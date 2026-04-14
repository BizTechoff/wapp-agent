// Fair Message Queue Service - Round-Robin between tenants
// Ensures no single tenant can block others during bulk sends

import { remult } from 'remult'
import { QueuedMessage, QueueStats, ProviderResponse } from '../providers/provider.interface'
import { ProviderConfig } from '../../app/providers/provider-config'
import { MessageRequest } from '../../app/messages/message-request'
import { MessageStatus } from '../enums/MessageStatus'

export class FairMessageQueueService {
  // Separate queue per tenant
  private static queues: Map<string, QueuedMessage[]> = new Map()
  private static tenantOrder: string[] = []
  private static processing = false
  private static MESSAGES_PER_SECOND = 10

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

      // Round-Robin: take one message from each tenant in turn
      for (const tenantId of [...this.tenantOrder]) {
        const queue = this.queues.get(tenantId)
        if (queue && queue.length > 0) {
          batch.push({ tenantId, message: queue.shift()! })
          if (batch.length >= this.MESSAGES_PER_SECOND) break
        }
      }

      // Clean up empty queues
      this.cleanEmptyQueues()

      // Send the batch
      if (batch.length > 0) {
        await Promise.all(batch.map(item => this.sendOne(item.tenantId, item.message)))
        await this.delay(1000)
      }
    }

    this.processing = false
  }

  private static hasMessages(): boolean {
    for (const queue of this.queues.values()) {
      if (queue.length > 0) return true
    }
    return false
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

  // Stats for Dashboard
  static getStats(): QueueStats {
    const stats: QueueStats = { totalPending: 0, perTenant: {} }
    for (const [tenantId, queue] of this.queues.entries()) {
      stats.perTenant[tenantId] = queue.length
      stats.totalPending += queue.length
    }
    return stats
  }
}
