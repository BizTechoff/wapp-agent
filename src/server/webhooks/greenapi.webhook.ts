// Green-API Webhook Handler

import { remult } from 'remult'
import { MessageRequest } from '../../app/messages/message-request'
import { IncomingMessage } from '../../app/messages/incoming-message'
import { ProviderConfig } from '../../app/providers/provider-config'
import { Tenant } from '../../app/tenants/tenant'
import { MessageStatus } from '../../shared/enums/MessageStatus'
import { MessageType } from '../../shared/enums/MessageType'
import { WebhookService } from '../../shared/services/webhook.service'

// Helper: Find Tenant by instanceId from webhook
async function getTenantByInstance(instanceId: string): Promise<Tenant | null> {
  const config = await remult.repo(ProviderConfig).findFirst({
    instanceId: instanceId?.toString(),
    isActive: true
  })

  if (!config) {
    console.error(`Unknown instance: ${instanceId}`)
    return null
  }

  return await remult.repo(Tenant).findId(config.tenantId) ?? null
}

// Map Green-API status to our status
function mapStatus(greenApiStatus: string): MessageStatus {
  switch (greenApiStatus) {
    case 'sent':
      return MessageStatus.sent
    case 'delivered':
      return MessageStatus.delivered
    case 'read':
      return MessageStatus.read
    case 'failed':
    case 'noAccount':
      return MessageStatus.failed
    default:
      return MessageStatus.sent
  }
}

// Map Green-API message type to our type
function mapMessageType(greenApiType: string): MessageType {
  switch (greenApiType) {
    case 'textMessage':
      return MessageType.text
    case 'imageMessage':
      return MessageType.image
    case 'videoMessage':
      return MessageType.video
    case 'audioMessage':
      return MessageType.audio
    case 'documentMessage':
      return MessageType.document
    case 'locationMessage':
      return MessageType.location
    case 'contactMessage':
      return MessageType.contact
    default:
      return MessageType.text
  }
}

export async function handleGreenApiWebhook(body: any): Promise<void> {
  const { typeWebhook } = body
  const instanceId = body.instanceData?.idInstance || body.instanceId

  // 1. Outgoing message status - always handle
  if (typeWebhook === 'outgoingMessageStatus') {
    const message = await remult.repo(MessageRequest).findFirst({
      providerMessageId: body.idMessage
    })

    if (message) {
      message.status = mapStatus(body.status)
      if (body.status === 'delivered') message.deliveredDate = new Date()
      if (body.status === 'read') message.readDate = new Date()
      await message.save()  // LiveQuery auto-push to clients
      console.log(`Message ${body.idMessage} status updated to: ${body.status}`)
    } else {
      console.warn(`Message not found for idMessage: ${body.idMessage}`)
    }
  }

  // 2. Incoming message - only if tenant requested
  if (typeWebhook === 'incomingMessageReceived') {
    const tenant = await getTenantByInstance(instanceId)

    if (!tenant) return  // Unknown instance

    if (tenant.canReceive) {
      // Save to DB
      const incoming = remult.repo(IncomingMessage).create()
      incoming.tenantId = tenant.id
      incoming.mobile = body.senderData?.chatId?.replace('@c.us', '') || ''
      incoming.providerMessageId = body.idMessage

      // Extract text/media based on message type
      const messageData = body.messageData
      const typeMessage = messageData?.typeMessage

      // Set message type using the mapping function
      incoming.messageType = mapMessageType(typeMessage)

      // Extract content based on type
      if (typeMessage === 'textMessage') {
        incoming.text = messageData.textMessageData?.textMessage || ''
      } else if (typeMessage === 'extendedTextMessage') {
        incoming.text = messageData.extendedTextMessageData?.text || ''
      } else if (messageData?.fileMessageData) {
        // All file-based messages (image, video, audio, document)
        incoming.mediaUrl = messageData.fileMessageData.downloadUrl || ''
        incoming.text = messageData.fileMessageData.caption || ''
      } else if (typeMessage === 'locationMessage') {
        const loc = messageData.locationMessageData
        incoming.text = `מיקום: ${loc?.latitude}, ${loc?.longitude}`
      } else if (typeMessage === 'contactMessage') {
        const contact = messageData.contactMessageData
        incoming.text = `איש קשר: ${contact?.displayName || ''}`
      }

      await incoming.save()  // LiveQuery auto-push!

      // Callback to tenant (fire & forget!)
      if (tenant.incomingWebhookUrl) {
        const callbackPayload = {
          type: 'incoming',
          from: incoming.mobile,
          text: incoming.text,
          messageType: incoming.messageType.id,
          mediaUrl: incoming.mediaUrl,
          receivedAt: incoming.receivedDate.toISOString()
        }

        WebhookService.sendAsync(tenant.incomingWebhookUrl, callbackPayload)

        // Update callback status
        incoming.callbackSent = true
        incoming.callbackSentDate = new Date()
        await incoming.save()
      }
    }
  }
}
