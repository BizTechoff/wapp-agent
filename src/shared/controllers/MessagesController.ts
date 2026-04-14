import { BackendMethod, Controller, remult } from 'remult'
import { Tenant } from '../../app/tenants/tenant'
import { MessageRequest } from '../../app/messages/message-request'
import { MessageFile } from '../../app/messages/message-file'
import { ProviderConfig } from '../../app/providers/provider-config'
import { MessageStatus } from '../enums/MessageStatus'
import { FairMessageQueueService } from '../services/fair-queue.service'
import { SendingPolicyService } from '../services/sending-policy.service'
import { ProviderResponse, SendTextRequest, SendFileRequest } from '../providers/provider.interface'

@Controller('messages')
export class MessagesController {

  // Delegates for sending - will be set by server
  static sendTextDelegate: (config: ProviderConfig, req: SendTextRequest) => Promise<ProviderResponse>
  static sendFileDelegate: (config: ProviderConfig, req: SendFileRequest) => Promise<ProviderResponse>

  @BackendMethod({ allowed: true })
  static async sendMessage(request: ApiSendRequest): Promise<ApiSendResponse> {
    console.log('=== sendMessage called ===', { mobile: request.mobile, hasApiKey: !!request.apiKey })

    // 1. Validate API key
    const tenant = await MessagesController.validateApiKey(request.apiKey)
    if (!tenant) {
      throw new Error('Invalid API key')
    }

    // 2. Get provider config
    const providerConfig = await remult.repo(ProviderConfig).findFirst({
      tenantId: tenant.id,
      isActive: true,
      isDefault: true
    })

    if (!providerConfig) {
      throw new Error('No provider configured')
    }

    // 3. Validate sending policy (quota, daily limit, warm-up)
    const validation = await SendingPolicyService.validate(tenant, providerConfig, {
      tenantId: tenant.id,
      mobile: request.mobile,
      messageCount: 1
    })

    if (!validation.allowed) {
      throw new Error(validation.reason || 'Sending not allowed')
    }

    // 4. Create message request
    const messageRequest = remult.repo(MessageRequest).create()
    messageRequest.tenantId = tenant.id
    messageRequest.mobile = request.mobile
    messageRequest.text = request.text || ''
    messageRequest.providerType = providerConfig.providerType
    messageRequest.status = MessageStatus.queued
    await messageRequest.save()

    // 5. Create file records if any
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

    // 6. Add to fair queue for processing
    await FairMessageQueueService.add(tenant.id, {
      id: messageRequest.id,
      tenantId: tenant.id,
      mobile: request.mobile,
      text: request.text || ''
    })

    // 7. Update tenant message count
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

    // 2. Get provider config
    const providerConfig = await remult.repo(ProviderConfig).findFirst({
      tenantId: tenant.id,
      isActive: true,
      isDefault: true
    })

    if (!providerConfig) {
      throw new Error('No provider configured')
    }

    // 3. Validate sending policy (handles quota, daily limit, warm-up)
    const allMobiles = request.messages.map(m => m.mobile)
    const validation = await SendingPolicyService.validate(tenant, providerConfig, {
      tenantId: tenant.id,
      mobiles: allMobiles,
      messageCount: allMobiles.length
    })

    // Get allowed messages based on daily limit filtering
    const allowedMobilesSet = new Set(validation.allowedMobiles || allMobiles)
    const blockedMobiles = validation.blockedMobiles || []

    // Filter messages to only allowed ones
    const allowedMessages = request.messages.filter(m => allowedMobilesSet.has(m.mobile))

    // Check quota for allowed messages
    const remainingQuota = tenant.messageQuota - tenant.messagesSent
    if (remainingQuota < allowedMessages.length) {
      throw new Error(`Insufficient quota. Remaining: ${remainingQuota}, Requested: ${allowedMessages.length}`)
    }

    // Check warm-up limit
    if (validation.warmupInfo && validation.warmupInfo.currentDailyLimit !== -1) {
      const warmupRemaining = validation.warmupInfo.remaining
      if (warmupRemaining < allowedMessages.length) {
        throw new Error(`Warm-up limit reached. Remaining today: ${warmupRemaining}, Requested: ${allowedMessages.length}`)
      }
    }

    // 4. Create batch ID
    const batchId = crypto.randomUUID()
    let queued = 0

    // 5. Process in batches of 100
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

    // 6. Update tenant message count
    tenant.messagesSent += queued
    await tenant.save()

    return {
      batchId,
      total: request.messages.length,
      queued,
      blocked: blockedMobiles.length,
      blockedMobiles,
      warmupInfo: validation.warmupInfo
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
  warmupInfo?: {
    daysSinceCreation: number
    currentDailyLimit: number
    sentToday: number
    remaining: number
  }
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
