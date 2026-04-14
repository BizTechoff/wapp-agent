// Webhook Service - for sending callbacks to tenants

import { HttpService, HttpResult } from './http.service'

export interface WebhookResult {
  success: boolean
  statusCode: number
  error: string
}

export class WebhookService {
  private static TIMEOUT = 5000  // 5 seconds

  static async send(url: string, payload: any): Promise<WebhookResult> {
    const result = await HttpService.post(url, payload, this.TIMEOUT)
    return {
      success: result.success,
      statusCode: result.statusCode,
      error: result.error || ''
    }
  }

  // Fire and Forget - don't wait for response
  static sendAsync(url: string, payload: any): void {
    this.send(url, payload).catch(err =>
      console.error('Webhook failed:', err)
    )
  }
}
