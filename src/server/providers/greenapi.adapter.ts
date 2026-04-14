// Green-API Provider Adapter

import { IProviderAdapter, SendTextRequest, SendFileRequest, ProviderResponse, ProviderStatus } from '../../shared/providers/provider.interface'
import { HttpService } from '../../shared/services/http.service'
import { config } from '../../shared/config'

export class GreenApiAdapter implements IProviderAdapter {
  private baseUrl: string
  private instanceId: string
  private apiToken: string

  constructor(instanceId: string, apiToken: string) {
    this.instanceId = instanceId
    this.apiToken = apiToken
    this.baseUrl = `https://api.green-api.com/waInstance${instanceId}`
  }

  async sendText(req: SendTextRequest): Promise<ProviderResponse> {
    try {
      const url = `${this.baseUrl}/sendMessage/${this.apiToken}`
      const body: any = {
        chatId: `${req.mobile}@c.us`,
        message: req.text
      }

      if (req.replyToMessageId) {
        body.quotedMessageId = req.replyToMessageId
      }

      const result = await HttpService.post(url, body, 10000)

      if (result.success && result.data?.idMessage) {
        return {
          success: true,
          messageId: result.data.idMessage
        }
      }

      return {
        success: false,
        error: result.error || result.data?.message || 'Send failed'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async sendFile(req: SendFileRequest): Promise<ProviderResponse> {
    try {
      const url = `${this.baseUrl}/sendFileByUrl/${this.apiToken}`
      const body: any = {
        chatId: `${req.mobile}@c.us`,
        urlFile: req.fileUrl,
        fileName: req.fileName,
        caption: req.caption || ''
      }

      if (req.replyToMessageId) {
        body.quotedMessageId = req.replyToMessageId
      }

      const result = await HttpService.post(url, body, 15000)

      if (result.success && result.data?.idMessage) {
        return {
          success: true,
          messageId: result.data.idMessage
        }
      }

      return {
        success: false,
        error: result.error || result.data?.message || 'Send failed'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getInstanceStatus(): Promise<ProviderStatus> {
    try {
      const url = `${this.baseUrl}/getStateInstance/${this.apiToken}`
      const result = await HttpService.get(url, 5000)

      if (result.success && result.data) {
        if (config.showDebugLogs) console.log('getInstanceStatus success', url, JSON.stringify(result))
        return {
          connected: result.data.stateInstance === 'authorized',
          phone: result.data.phoneNumber || undefined
        }
      }
      if (config.showDebugLogs) console.log('getInstanceStatus NOT success', url, JSON.stringify(result))

      return { connected: false }
    } catch (error) {
      if (config.showDebugLogs) console.log('getInstanceStatus catch', JSON.stringify(error))

      return { connected: false }
    }
  }
}
