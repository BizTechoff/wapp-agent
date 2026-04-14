// Provider Abstraction Layer - Interface for all WhatsApp providers

export interface IProviderAdapter {
  // Sending
  sendText(req: SendTextRequest): Promise<ProviderResponse>
  sendFile(req: SendFileRequest): Promise<ProviderResponse>

  // Status
  getInstanceStatus(): Promise<ProviderStatus>
}

// Request Types
export interface SendTextRequest {
  mobile: string           // 972501234567
  text: string
  replyToMessageId?: string
}

export interface SendFileRequest {
  mobile: string
  fileUrl: string
  fileName: string
  caption?: string
  replyToMessageId?: string
}

// Response Types
export interface ProviderResponse {
  success: boolean
  messageId?: string
  error?: string
}

export interface ProviderStatus {
  connected: boolean
  phone?: string
}

// Queue Types
export interface QueuedMessage {
  id: string
  tenantId: string
  mobile: string
  text: string
  replyToMessageId?: string
}

export interface QueueStats {
  totalPending: number
  perTenant: { [tenantId: string]: number }
}
