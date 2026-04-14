import { BackendMethod, Controller, remult } from 'remult'
import { Tenant } from '../../app/tenants/tenant'
import { MessageRequest } from '../../app/messages/message-request'
import { MessageFile } from '../../app/messages/message-file'
import { ProviderConfig } from '../../app/providers/provider-config'
import { MessageStatus } from '../enums/MessageStatus'
import { FairMessageQueueService } from '../services/fair-queue.service'
import { ProviderResponse, SendTextRequest, SendFileRequest } from '../providers/provider.interface'
import { config } from '../config'

// WhatsApp daily limit per recipient (to prevent number blocking)
const MAX_MESSAGES_PER_RECIPIENT_PER_DAY = 2

@Controller('messages')
export class MessagesController {

  // Delegates for sending - will be set by server
  static sendTextDelegate: (config: ProviderConfig, req: SendTextRequest) => Promise<ProviderResponse>
  static sendFileDelegate: (config: ProviderConfig, req: SendFileRequest) => Promise<ProviderResponse>

  // Helper: Get start of today
  private static getStartOfToday(): Date {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }

  // Helper: Check daily limit for single mobile
  private static async checkDailyLimit(tenantId: string, mobile: string): Promise<boolean> {
    const startOfDay = this.getStartOfToday()
    const count = await remult.repo(MessageRequest).count({
      tenantId,
      mobile,
      createDate: { $gte: startOfDay }
    })
    return count < MAX_MESSAGES_PER_RECIPIENT_PER_DAY
  }

  // Helper: Get daily counts for multiple mobiles (efficient batch query)
  private static async getDailyCounts(tenantId: string, mobiles: string[]): Promise<Map<string, number>> {
    const startOfDay = this.getStartOfToday()
    const counts = new Map<string, number>()

    // Initialize all mobiles with 0
    for (const mobile of mobiles) {
      counts.set(mobile, 0)
    }

    // Get existing messages for these mobiles today
    const existingMessages = await remult.repo(MessageRequest).find({
      where: {
        tenantId,
        mobile: { $in: mobiles },
        createDate: { $gte: startOfDay }
      }
    })

    // Count per mobile
    for (const msg of existingMessages) {
      counts.set(msg.mobile, (counts.get(msg.mobile) || 0) + 1)
    }

    return counts
  }

  @BackendMethod({ allowed: true })
  static async sendMessage(request: ApiSendRequest): Promise<ApiSendResponse> {
    console.log('=== sendMessage called ===', { mobile: request.mobile, hasApiKey: !!request.apiKey })

    // 1. Validate API key
    const tenant = await MessagesController.validateApiKey(request.apiKey)
    if (!tenant) {
      throw new Error('Invalid API key')
    }

    // 2. Check quota
    if (tenant.messagesSent >= tenant.messageQuota) {
      throw new Error('Message quota exceeded')
    }

    // 3. Check if tenant can send
    if (!tenant.canSend) {
      throw new Error('Sending not enabled for this tenant')
    }

    // 4. Check daily limit per recipient (WhatsApp safety)
    const canSendToRecipient = await this.checkDailyLimit(tenant.id, request.mobile)
    if (!canSendToRecipient) {
      throw new Error(`Daily limit reached for ${request.mobile}. Max ${MAX_MESSAGES_PER_RECIPIENT_PER_DAY} messages per recipient per day.`)
    }

    // 5. Get provider config
    const providerConfig = await remult.repo(ProviderConfig).findFirst({
      tenantId: tenant.id,
      isActive: true,
      isDefault: true
    })

    if (!providerConfig) {
      throw new Error('No provider configured')
    }

    // 7. Create message request
    const messageRequest = remult.repo(MessageRequest).create()
    messageRequest.tenantId = tenant.id
    messageRequest.mobile = request.mobile
    messageRequest.text = request.text || ''
    messageRequest.providerType = providerConfig.providerType
    messageRequest.status = MessageStatus.queued
    await messageRequest.save()

    // 8. Create file records if any
    if (request.files && request.files.length > 0) {
      for (const file of request.files) {
        const messageFile = remult.repo(MessageFile).create()
        messageFile.messageRequestId = messageRequest.id
        messageFile.fileType = file.type
        messageFile.url = file.url
        messageFile.fileName = file.fileName || ''
        await messageFile.save()
      }
    }

    // 9. Add to fair queue for processing
    await FairMessageQueueService.add(tenant.id, {
      id: messageRequest.id,
      tenantId: tenant.id,
      mobile: request.mobile,
      text: request.text || ''
    })

    // 10. Update tenant message count
    tenant.messagesSent++
    await tenant.save()

    return {
      requestId: messageRequest.id,
      status: 'queued'
    }
  }

  @BackendMethod({ allowed: true })
  static async sendBulk(request: ApiBulkSendRequest): Promise<ApiBulkSendResponse> {
    // 1. Validate API key
    const tenant = await MessagesController.validateApiKey(request.apiKey)
    if (!tenant) {
      throw new Error('Invalid API key')
    }

    // 2. Check if tenant can send
    if (!tenant.canSend) {
      throw new Error('Sending not enabled for this tenant')
    }

    // 3. Get provider config
    const providerConfig = await remult.repo(ProviderConfig).findFirst({
      tenantId: tenant.id,
      isActive: true,
      isDefault: true
    })

    if (!providerConfig) {
      throw new Error('No provider configured')
    }

    // 4. Get unique mobiles and check daily limits (efficient batch query)
    const allMobiles = [...new Set(request.messages.map(m => m.mobile))]
    const dailyCounts = await this.getDailyCounts(tenant.id, allMobiles)

    // Track how many messages we're adding per mobile in this batch
    const batchCounts = new Map<string, number>()
    const blockedMobiles: string[] = []

    // Filter messages based on daily limit
    const allowedMessages: { mobile: string; text?: string }[] = []
    for (const msg of request.messages) {
      const existingToday = dailyCounts.get(msg.mobile) || 0
      const addedInBatch = batchCounts.get(msg.mobile) || 0
      const totalAfterThis = existingToday + addedInBatch + 1

      if (totalAfterThis <= MAX_MESSAGES_PER_RECIPIENT_PER_DAY) {
        allowedMessages.push(msg)
        batchCounts.set(msg.mobile, addedInBatch + 1)
      } else {
        if (!blockedMobiles.includes(msg.mobile)) {
          blockedMobiles.push(msg.mobile)
        }
      }
    }

    // 5. Check quota for allowed messages only
    const remainingQuota = tenant.messageQuota - tenant.messagesSent
    if (remainingQuota < allowedMessages.length) {
      throw new Error(`Insufficient quota. Remaining: ${remainingQuota}, Requested: ${allowedMessages.length}`)
    }

    // 6. Create batch ID
    const batchId = crypto.randomUUID()
    let queued = 0

    // 7. Process in batches of 100
    const BATCH_SIZE = 100
    for (let i = 0; i < allowedMessages.length; i += BATCH_SIZE) {
      const batch = allowedMessages.slice(i, i + BATCH_SIZE)

      for (const msg of batch) {
        // Create message request
        const messageRequest = remult.repo(MessageRequest).create()
        messageRequest.tenantId = tenant.id
        messageRequest.batchId = batchId
        messageRequest.mobile = msg.mobile
        messageRequest.text = msg.text || ''
        messageRequest.providerType = providerConfig.providerType
        messageRequest.status = MessageStatus.queued
        await messageRequest.save()

        // Add to queue
        await FairMessageQueueService.add(tenant.id, {
          id: messageRequest.id,
          tenantId: tenant.id,
          mobile: msg.mobile,
          text: msg.text || ''
        })

        queued++
      }
    }

    // 8. Update tenant message count
    tenant.messagesSent += queued
    await tenant.save()

    return {
      batchId,
      total: request.messages.length,
      queued,
      blocked: blockedMobiles.length,
      blockedMobiles
    }
  }

  @BackendMethod({ allowed: true })
  static async getMessageStatus(requestId: string, apiKey: string): Promise<MessageStatusResponse> {
    // Validate API key
    const tenant = await MessagesController.validateApiKey(apiKey)
    if (!tenant) {
      throw new Error('Invalid API key')
    }

    const message = await remult.repo(MessageRequest).findFirst({
      id: requestId,
      tenantId: tenant.id
    })

    if (!message) {
      throw new Error('Message not found')
    }

    return {
      requestId: message.id,
      mobile: message.mobile,
      status: message.status.id,
      errorMessage: message.errorMessage,
      sentDate: message.sentDate,
      deliveredDate: message.deliveredDate,
      readDate: message.readDate
    }
  }

  private static async validateApiKey(apiKey: string): Promise<Tenant | null> {
    if (!apiKey) return null

    return await remult.repo(Tenant).findFirst({
      apiKey,
      isActive: true
    }) ?? null
  }
}

// API Types
interface ApiSendRequest {
  apiKey: string
  mobile: string
  text?: string
  files?: { type: any; url: string; fileName?: string }[]
}

interface ApiSendResponse {
  requestId: string
  status: string
}

interface ApiBulkSendRequest {
  apiKey: string
  messages: { mobile: string; text?: string }[]
}

interface ApiBulkSendResponse {
  batchId: string
  total: number
  queued: number
  blocked: number
  blockedMobiles: string[]
}

interface MessageStatusResponse {
  requestId: string
  mobile: string
  status: string
  errorMessage: string
  sentDate?: Date
  deliveredDate?: Date
  readDate?: Date
}
