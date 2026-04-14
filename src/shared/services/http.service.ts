// HTTP Service with timeout support

export interface HttpResult {
  success: boolean
  statusCode: number
  data?: any
  error?: string
}

export class HttpService {
  private static DEFAULT_TIMEOUT = 5000  // 5 seconds

  static async post(
    url: string,
    payload: any,
    timeoutMs = this.DEFAULT_TIMEOUT
  ): Promise<HttpResult> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      return {
        success: response.ok,
        statusCode: response.status,
        data: await response.json().catch(() => null)
      }
    } catch (error: any) {
      return {
        success: false,
        statusCode: 0,
        error: error.name === 'AbortError' ? 'Timeout' : error.message
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  static async get(
    url: string,
    timeoutMs = this.DEFAULT_TIMEOUT
  ): Promise<HttpResult> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      })

      return {
        success: response.ok,
        statusCode: response.status,
        data: await response.json().catch(() => null)
      }
    } catch (error: any) {
      return {
        success: false,
        statusCode: 0,
        error: error.name === 'AbortError' ? 'Timeout' : error.message
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}
