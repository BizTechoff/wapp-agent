// Fair Message Queue Service - Round-Robin between tenants
// Ensures no single tenant can block others during bulk sends
// Includes random delays and spread sending for WhatsApp safety

import { remult } from 'remult'
import { QueuedMessage, QueueStats, ProviderResponse } from '../providers/provider.interface'
import { ProviderConfig } from '../../app/providers/provider-config'
import { MessageRequest } from '../../app/messages/message-request'
import { MessageStatus } from '../enums/MessageStatus'

// =====================
// Configuration
// =====================

// Rate limiting with randomization (WhatsApp safety)
const RATE_LIMIT = {
  BASE_DELAY_MS: 1000,           // Base delay between batches
  RANDOM_RANGE_MS: 400,          // +/- random range (800-1200ms)
  MESSAGES_PER_BATCH: 10,        // Max messages per batch

  // Spread sending: For large queues, add extra delays
  SPREAD_THRESHOLD: 100,         // If queue > 100, activate spread
  SPREAD_EXTRA_DELAY_MS: 500,    // Extra delay per message when spreading

  // Per-message random micro-delay (between messages in same batch)
  MICRO_DELAY_MIN_MS: 50,
  MICRO_DELAY_MAX_MS: 150
}

export class FairMessageQueueService {
  // Separate queue per tenant
  private static queues: Map<string, QueuedMessage[]> = new Map()
  private static tenantOrder: string[] = []
  private static processing = false

  // Delegate for actual sending - will be set by server
  static sendDelegate: (tenantId: string, message: QueuedMessage) => Promise<ProviderResponse>

  static async add(tenantId: string, message: QueuedMessage): Promise<void> {
    // Create queue for tenant if not exists
    if (!this.queues.has(tenantId)) {
      this.queues.set(tenantId, [])
      this.tenantOrder.push(tenantId)
    }

    // Add to tenant's queue
    this.queues.get(tenantId)!.push(message)

    if (!this.processing) {
      this.process()
    }
  }

  private static async process(): Promise<void> {
    this.processing = true

    while (this.hasMessages()) {
      const batch: { tenantId: string; message: QueuedMessage }[] = []
      const totalPending = this.getTotalPending()

      // Round-Robin: take one message from each tenant in turn
      for (const tenantId of [...this.tenantOrder]) {
        const queue = this.queues.get(tenantId)
        if (queue && queue.length > 0) {
          batch.push({ tenantId, message: queue.shift()! })
          if (batch.length >= RATE_LIMIT.MESSAGES_PER_BATCH) break
        }
      }

      // Clean up empty queues
      this.cleanEmptyQueues()

      // Send the batch with micro-delays between messages
      if (batch.length > 0) {
        await this.sendBatchWithMicroDelays(batch)

        // Calculate delay for next batch
        const delay = this.calculateDelay(totalPending)
        await this.delay(delay)
      }
    }

    this.processing = false
  }

  /**
   * Send batch with random micro-delays between messages
   * This makes the sending pattern look more human-like
   */
  private static async sendBatchWithMicroDelays(
    batch: { tenantId: string; message: QueuedMessage }[]
  ): Promise<void> {
    for (let i = 0; i < batch.length; i++) {
      const item = batch[i]

      // Send the message
      await this.sendOne(item.tenantId, item.message)

      // Add micro-delay between messages (except after last one)
      if (i < batch.length - 1) {
        const microDelay = this.getRandomDelay(
          RATE_LIMIT.MICRO_DELAY_MIN_MS,
          RATE_LIMIT.MICRO_DELAY_MAX_MS
        )
        await this.delay(microDelay)
      }
    }
  }

  /**
   * Calculate delay based on queue size
   * Larger queues = spread out more to avoid detection
   */
  private static calculateDelay(totalPending: number): number {
    // Base delay with random variation
    let delay = this.getRandomDelay(
      RATE_LIMIT.BASE_DELAY_MS - RATE_LIMIT.RANDOM_RANGE_MS / 2,
      RATE_LIMIT.BASE_DELAY_MS + RATE_LIMIT.RANDOM_RANGE_MS / 2
    )

    // Add spread delay for large queues
    if (totalPending > RATE_LIMIT.SPREAD_THRESHOLD) {
      // Proportionally increase delay based on queue size
      const spreadFactor = Math.min(totalPending / RATE_LIMIT.SPREAD_THRESHOLD, 3) // Max 3x
      delay += RATE_LIMIT.SPREAD_EXTRA_DELAY_MS * spreadFactor
    }

    return delay
  }

  /**
   * Get random delay within range
   */
  private static getRandomDelay(min: number, max: number): number {
    return Math.floor(min + Math.random() * (max - min))
  }

  private static hasMessages(): boolean {
    for (const queue of this.queues.values()) {
      if (queue.length > 0) return true
    }
    return false
  }

  private static getTotalPending(): number {
    let total = 0
    for (const queue of this.queues.values()) {
      total += queue.length
    }
    return total
  }

  private static cleanEmptyQueues(): void {
    for (const [tenantId, queue] of this.queues.entries()) {
      if (queue.length === 0) {
        this.queues.delete(tenantId)
        this.tenantOrder = this.tenantOrder.filter(id => id !== tenantId)
      }
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private static async sendOne(tenantId: string, message: QueuedMessage): Promise<void> {
    try {
      if (!this.sendDelegate) {
        throw new Error('sendDelegate not configured')
      }

      const result = await this.sendDelegate(tenantId, message)
      await this.updateMessageStatus(message.id, result)
    } catch (error: any) {
      await this.updateMessageStatus(message.id, {
        success: false,
        error: error.message
      })
    }
  }

  private static async updateMessageStatus(messageId: string, result: ProviderResponse): Promise<void> {
    const message = await remult.repo(MessageRequest).findId(messageId)
    if (message) {
      if (result.success) {
        message.status = MessageStatus.sent
        message.providerMessageId = result.messageId || ''
        message.sentDate = new Date()
      } else {
        message.status = MessageStatus.failed
        message.errorMessage = result.error || 'Unknown error'
      }
      await message.save()
    }
  }

  // =====================
  // Stats for Dashboard
  // =====================

  static getStats(): QueueStats {
    const stats: QueueStats = { totalPending: 0, perTenant: {} }
    for (const [tenantId, queue] of this.queues.entries()) {
      stats.perTenant[tenantId] = queue.length
      stats.totalPending += queue.length
    }
    return stats
  }

  // =====================
  // Public Getters (for UI/Dashboard)
  // =====================

  static getRateLimitConfig() {
    return RATE_LIMIT
  }
}
