import { BackendMethod, Controller, remult } from 'remult'
import { Tenant } from '../../app/tenants/tenant'
import { MessageRequest } from '../../app/messages/message-request'
import { MessageFile } from '../../app/messages/message-file'
import { ProviderConfig } from '../../app/providers/provider-config'
import { MessageStatus } from '../enums/MessageStatus'
import { FairMessageQueueService } from '../services/fair-queue.service'
import { ProviderResponse, SendTextRequest, SendFileRequest } from '../providers/provider.interface'

@Controller('messages')
export class MessagesController {

  // Delegates for sending - will be set by server
  static sendTextDelegate: (config: ProviderConfig, req: SendTextRequest) => Promise<ProviderResponse>
  static sendFileDelegate: (config: ProviderConfig, req: SendFileRequest) => Promise<ProviderResponse>

  @BackendMethod({ allowed: true })
  static async sendMessage(request: ApiSendRequest): Promise<ApiSendResponse> {
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

    // 4. Get provider config
    const providerConfig = await remult.repo(ProviderConfig).findFirst({
      tenantId: tenant.id,
      isActive: true,
      isDefault: true
    })

    if (!providerConfig) {
      throw new Error('No provider configured')
    }

    // 5. Create message request
    const messageRequest = remult.repo(MessageRequest).create()
    messageRequest.tenantId = tenant.id
    messageRequest.mobile = request.mobile
    messageRequest.text = request.text || ''
    messageRequest.providerType = providerConfig.providerType
    messageRequest.status = MessageStatus.queued
    await messageRequest.save()

    // 6. Create file records if any
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

    // 7. Add to fair queue for processing
    await FairMessageQueueService.add(tenant.id, {
      id: messageRequest.id,
      tenantId: tenant.id,
      mobile: request.mobile,
      text: request.text || ''
    })

    // 8. Update tenant message count
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

    // 2. Check quota
    const remainingQuota = tenant.messageQuota - tenant.messagesSent
    if (remainingQuota < request.messages.length) {
      throw new Error(`Insufficient quota. Remaining: ${remainingQuota}`)
    }

    // 3. Check if tenant can send
    if (!tenant.canSend) {
      throw new Error('Sending not enabled for this tenant')
    }

    // 4. Get provider config
    const providerConfig = await remult.repo(ProviderConfig).findFirst({
      tenantId: tenant.id,
      isActive: true,
      isDefault: true
    })

    if (!providerConfig) {
      throw new Error('No provider configured')
    }

    // 5. Create batch ID
    const batchId = crypto.randomUUID()
    let queued = 0

    // 6. Process in batches of 100
    const BATCH_SIZE = 100
    for (let i = 0; i < request.messages.length; i += BATCH_SIZE) {
      const batch = request.messages.slice(i, i + BATCH_SIZE)

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

    // 7. Update tenant message count
    tenant.messagesSent += queued
    await tenant.save()

    return {
      batchId,
      total: request.messages.length,
      queued
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
