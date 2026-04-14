// Sending Policy Service - Centralized validation for message sending
// All sending checks in one modular place for easy maintenance

import { remult } from 'remult'
import { Tenant } from '../../app/tenants/tenant'
import { ProviderConfig } from '../../app/providers/provider-config'
import { MessageRequest } from '../../app/messages/message-request'

// =====================
// Configuration
// =====================

// Daily limit per recipient (WhatsApp safety)
const MAX_MESSAGES_PER_RECIPIENT_PER_DAY = 2

// Warm-up levels: Days since provider created -> Max messages per day
const WARMUP_LEVELS = [
  { maxDays: 7, dailyLimit: 50 },      // Day 1-7: 50/day
  { maxDays: 14, dailyLimit: 100 },    // Day 8-14: 100/day
  { maxDays: 30, dailyLimit: 250 },    // Day 15-30: 250/day
  // After 30 days: No warm-up limit (tenant quota applies)
]

// =====================
// Types
// =====================

export interface PolicyValidationRequest {
  tenantId: string
  mobile?: string           // For single message
  mobiles?: string[]        // For bulk messages
  messageCount?: number     // How many messages to send
}

export interface PolicyValidationResult {
  allowed: boolean
  reason?: string
  code?: PolicyErrorCode
  // For bulk: which mobiles are blocked
  blockedMobiles?: string[]
  allowedMobiles?: string[]
  // Warm-up info
  warmupInfo?: {
    daysSinceCreation: number
    currentDailyLimit: number
    sentToday: number
    remaining: number
  }
}

export type PolicyErrorCode =
  | 'QUOTA_EXCEEDED'
  | 'DAILY_LIMIT_REACHED'
  | 'WARMUP_LIMIT_REACHED'
  | 'SENDING_DISABLED'
  | 'NO_PROVIDER'

// Internal check result
interface CheckResult {
  passed: boolean
  reason?: string
  code?: PolicyErrorCode
  data?: any
}

// =====================
// Service
// =====================

export class SendingPolicyService {

  // =====================
  // Main Validation Method
  // =====================

  /**
   * Validate if sending is allowed
   * Runs all checks in sequence and returns the result
   */
  static async validate(
    tenant: Tenant,
    providerConfig: ProviderConfig,
    request: PolicyValidationRequest
  ): Promise<PolicyValidationResult> {

    // 1. Check if sending is enabled
    const canSendCheck = this.checkCanSend(tenant)
    if (!canSendCheck.passed) {
      return { allowed: false, reason: canSendCheck.reason, code: canSendCheck.code }
    }

    // 2. Check warm-up limit
    const warmupCheck = await this.checkWarmup(tenant.id, providerConfig, request.messageCount || 1)
    if (!warmupCheck.passed) {
      return {
        allowed: false,
        reason: warmupCheck.reason,
        code: warmupCheck.code,
        warmupInfo: warmupCheck.data?.warmupInfo
      }
    }

    // 3. Check quota
    const quotaCheck = this.checkQuota(tenant, request.messageCount || 1)
    if (!quotaCheck.passed) {
      return { allowed: false, reason: quotaCheck.reason, code: quotaCheck.code }
    }

    // 4. Check daily limit per recipient
    if (request.mobile) {
      // Single message
      const dailyCheck = await this.checkDailyLimit(tenant.id, request.mobile)
      if (!dailyCheck.passed) {
        return { allowed: false, reason: dailyCheck.reason, code: dailyCheck.code }
      }
    } else if (request.mobiles && request.mobiles.length > 0) {
      // Bulk messages
      const bulkCheck = await this.checkDailyLimitBulk(tenant.id, request.mobiles)
      return {
        allowed: bulkCheck.data.allowedMobiles.length > 0,
        reason: bulkCheck.data.blockedMobiles.length > 0
          ? `${bulkCheck.data.blockedMobiles.length} recipients blocked due to daily limit`
          : undefined,
        blockedMobiles: bulkCheck.data.blockedMobiles,
        allowedMobiles: bulkCheck.data.allowedMobiles,
        warmupInfo: warmupCheck.data?.warmupInfo
      }
    }

    return {
      allowed: true,
      warmupInfo: warmupCheck.data?.warmupInfo
    }
  }

  // =====================
  // Individual Checks
  // =====================

  /**
   * Check if tenant has sending enabled
   */
  private static checkCanSend(tenant: Tenant): CheckResult {
    if (!tenant.canSend) {
      return {
        passed: false,
        reason: 'Sending not enabled for this tenant',
        code: 'SENDING_DISABLED'
      }
    }
    return { passed: true }
  }

  /**
   * Check if tenant has enough quota
   */
  private static checkQuota(tenant: Tenant, messageCount: number): CheckResult {
    const remaining = tenant.messageQuota - tenant.messagesSent
    if (remaining < messageCount) {
      return {
        passed: false,
        reason: `Insufficient quota. Remaining: ${remaining}, Requested: ${messageCount}`,
        code: 'QUOTA_EXCEEDED'
      }
    }
    return { passed: true }
  }

  /**
   * Check daily limit for single recipient
   */
  private static async checkDailyLimit(tenantId: string, mobile: string): Promise<CheckResult> {
    const count = await this.getMessageCountToday(tenantId, mobile)
    if (count >= MAX_MESSAGES_PER_RECIPIENT_PER_DAY) {
      return {
        passed: false,
        reason: `Daily limit reached for ${mobile}. Max ${MAX_MESSAGES_PER_RECIPIENT_PER_DAY} messages per recipient per day.`,
        code: 'DAILY_LIMIT_REACHED'
      }
    }
    return { passed: true }
  }

  /**
   * Check daily limit for multiple recipients (bulk)
   * Returns which mobiles are allowed and which are blocked
   */
  private static async checkDailyLimitBulk(
    tenantId: string,
    mobiles: string[]
  ): Promise<CheckResult> {
    const uniqueMobiles = [...new Set(mobiles)]
    const dailyCounts = await this.getDailyCounts(tenantId, uniqueMobiles)

    const batchCounts = new Map<string, number>()
    const blockedMobiles: string[] = []
    const allowedMobiles: string[] = []

    for (const mobile of mobiles) {
      const existingToday = dailyCounts.get(mobile) || 0
      const addedInBatch = batchCounts.get(mobile) || 0
      const totalAfterThis = existingToday + addedInBatch + 1

      if (totalAfterThis <= MAX_MESSAGES_PER_RECIPIENT_PER_DAY) {
        allowedMobiles.push(mobile)
        batchCounts.set(mobile, addedInBatch + 1)
      } else {
        if (!blockedMobiles.includes(mobile)) {
          blockedMobiles.push(mobile)
        }
      }
    }

    return {
      passed: true, // Always passes, but returns filtered lists
      data: { allowedMobiles, blockedMobiles }
    }
  }

  /**
   * Check warm-up limit for new phone numbers
   * New numbers start with low limits that increase over time
   */
  private static async checkWarmup(
    tenantId: string,
    providerConfig: ProviderConfig,
    messageCount: number
  ): Promise<CheckResult> {
    const daysSinceCreation = this.getDaysSinceCreation(providerConfig.createDate)
    const dailyLimit = this.getWarmupDailyLimit(daysSinceCreation)

    // If no warm-up limit (phone is mature), pass
    if (dailyLimit === null) {
      return {
        passed: true,
        data: {
          warmupInfo: {
            daysSinceCreation,
            currentDailyLimit: -1, // -1 means no limit
            sentToday: 0,
            remaining: -1
          }
        }
      }
    }

    // Count messages sent today by this provider
    const sentToday = await this.getProviderMessageCountToday(tenantId, providerConfig.id)
    const remaining = dailyLimit - sentToday

    if (remaining < messageCount) {
      return {
        passed: false,
        reason: `Warm-up limit reached. Day ${daysSinceCreation}: ${dailyLimit}/day limit. Sent today: ${sentToday}, Remaining: ${remaining}, Requested: ${messageCount}`,
        code: 'WARMUP_LIMIT_REACHED',
        data: {
          warmupInfo: {
            daysSinceCreation,
            currentDailyLimit: dailyLimit,
            sentToday,
            remaining
          }
        }
      }
    }

    return {
      passed: true,
      data: {
        warmupInfo: {
          daysSinceCreation,
          currentDailyLimit: dailyLimit,
          sentToday,
          remaining
        }
      }
    }
  }

  // =====================
  // Helper Methods
  // =====================

  private static getStartOfToday(): Date {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }

  private static async getMessageCountToday(tenantId: string, mobile: string): Promise<number> {
    const startOfDay = this.getStartOfToday()
    return await remult.repo(MessageRequest).count({
      tenantId,
      mobile,
      createDate: { $gte: startOfDay }
    })
  }

  private static async getDailyCounts(tenantId: string, mobiles: string[]): Promise<Map<string, number>> {
    const startOfDay = this.getStartOfToday()
    const counts = new Map<string, number>()

    for (const mobile of mobiles) {
      counts.set(mobile, 0)
    }

    const existingMessages = await remult.repo(MessageRequest).find({
      where: {
        tenantId,
        mobile: { $in: mobiles },
        createDate: { $gte: startOfDay }
      }
    })

    for (const msg of existingMessages) {
      counts.set(msg.mobile, (counts.get(msg.mobile) || 0) + 1)
    }

    return counts
  }

  private static async getProviderMessageCountToday(tenantId: string, providerConfigId: string): Promise<number> {
    const startOfDay = this.getStartOfToday()
    // Count all messages sent by this tenant today (provider-level limit)
    return await remult.repo(MessageRequest).count({
      tenantId,
      createDate: { $gte: startOfDay }
    })
  }

  private static getDaysSinceCreation(createDate: Date): number {
    const now = new Date()
    const diffTime = now.getTime() - createDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // Day 1 is the first day
  }

  private static getWarmupDailyLimit(daysSinceCreation: number): number | null {
    for (const level of WARMUP_LEVELS) {
      if (daysSinceCreation <= level.maxDays) {
        return level.dailyLimit
      }
    }
    // After all warm-up levels, no limit
    return null
  }

  // =====================
  // Public Getters (for UI/Dashboard)
  // =====================

  static getWarmupLevels() {
    return WARMUP_LEVELS
  }

  static getMaxMessagesPerRecipientPerDay() {
    return MAX_MESSAGES_PER_RECIPIENT_PER_DAY
  }
}
