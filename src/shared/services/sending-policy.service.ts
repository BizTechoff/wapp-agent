// Sending Policy Service - Centralized validation for message sending
// All sending checks in one modular place for easy maintenance

import { remult } from 'remult'
import { Tenant } from '../../app/tenants/tenant'
import { ProviderConfig } from '../../app/providers/provider-config'
import { MessageRequest } from '../../app/messages/message-request'
import { MessageStatus } from '../enums/MessageStatus'

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

// Spam pattern detection thresholds
const SPAM_THRESHOLDS = {
  WARNING: 20,    // 20-50 recipients with same text = warning
  BLOCK: 50       // 50+ recipients with same text = block
}

// Sending hours (Israel timezone UTC+2/+3)
const SENDING_HOURS = {
  START: 8,       // 08:00
  END: 22         // 22:00
}

// Problematic recipient thresholds
const PROBLEMATIC_RECIPIENT = {
  FAIL_COUNT: 3,           // 3+ failures = problematic
  DAYS_TO_CHECK: 7         // Check failures in last 7 days
}

// Content quality checks
const CONTENT_LIMITS = {
  MAX_EMOJIS: 10,                    // Max emojis per message
  MAX_LINKS: 3,                       // Max links per message
  SUSPICIOUS_PATTERNS: [
    /bit\.ly/i,
    /tinyurl/i,
    /goo\.gl/i,
    /短/,                             // Chinese URL shorteners
    /免费|赚钱|中奖/,                  // Chinese spam words
    /\$\$\$+/,                        // Multiple dollar signs
    /WIN FREE/i,
    /CLICK HERE NOW/i,
    /LIMITED TIME OFFER/i
  ]
}

// =====================
// Types
// =====================

export interface PolicyValidationRequest {
  tenantId: string
  mobile?: string           // For single message
  mobiles?: string[]        // For bulk messages
  messageCount?: number     // How many messages to send
  text?: string             // Message text (for spam/content checks)
  texts?: string[]          // Multiple texts (for bulk with different texts)
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
  // Warnings (not blocking, but logged)
  warnings?: string[]
}

export type PolicyErrorCode =
  | 'QUOTA_EXCEEDED'
  | 'DAILY_LIMIT_REACHED'
  | 'WARMUP_LIMIT_REACHED'
  | 'SENDING_DISABLED'
  | 'NO_PROVIDER'
  | 'SPAM_DETECTED'
  | 'OUTSIDE_SENDING_HOURS'
  | 'PROBLEMATIC_RECIPIENT'
  | 'CONTENT_VIOLATION'

// Internal check result
interface CheckResult {
  passed: boolean
  reason?: string
  code?: PolicyErrorCode
  data?: any
  warning?: string
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
    const warnings: string[] = []

    // 1. Check if sending is enabled
    const canSendCheck = this.checkCanSend(tenant)
    if (!canSendCheck.passed) {
      return { allowed: false, reason: canSendCheck.reason, code: canSendCheck.code }
    }

    // 2. Check sending hours
    const hoursCheck = this.checkSendingHours()
    if (!hoursCheck.passed) {
      return { allowed: false, reason: hoursCheck.reason, code: hoursCheck.code }
    }

    // 3. Check content quality (if text provided)
    if (request.text) {
      const contentCheck = this.checkContentQuality(request.text)
      if (!contentCheck.passed) {
        return { allowed: false, reason: contentCheck.reason, code: contentCheck.code }
      }
      if (contentCheck.warning) {
        warnings.push(contentCheck.warning)
      }
    }

    // 4. Check spam pattern (for bulk sends)
    if (request.mobiles && request.mobiles.length > 0 && request.text) {
      const spamCheck = this.checkSpamPattern(request.mobiles.length, request.text)
      if (!spamCheck.passed) {
        return { allowed: false, reason: spamCheck.reason, code: spamCheck.code }
      }
      if (spamCheck.warning) {
        warnings.push(spamCheck.warning)
      }
    }

    // 5. Check warm-up limit
    const warmupCheck = await this.checkWarmup(tenant.id, providerConfig, request.messageCount || 1)
    if (!warmupCheck.passed) {
      return {
        allowed: false,
        reason: warmupCheck.reason,
        code: warmupCheck.code,
        warmupInfo: warmupCheck.data?.warmupInfo
      }
    }

    // 6. Check quota
    const quotaCheck = this.checkQuota(tenant, request.messageCount || 1)
    if (!quotaCheck.passed) {
      return { allowed: false, reason: quotaCheck.reason, code: quotaCheck.code }
    }

    // 7. Check daily limit per recipient + problematic recipients
    if (request.mobile) {
      // Single message - check problematic recipient
      const problematicCheck = await this.checkProblematicRecipient(tenant.id, request.mobile)
      if (!problematicCheck.passed) {
        return { allowed: false, reason: problematicCheck.reason, code: problematicCheck.code }
      }

      // Check daily limit
      const dailyCheck = await this.checkDailyLimit(tenant.id, request.mobile)
      if (!dailyCheck.passed) {
        return { allowed: false, reason: dailyCheck.reason, code: dailyCheck.code }
      }
    } else if (request.mobiles && request.mobiles.length > 0) {
      // Bulk messages - filter problematic + daily limit
      const bulkCheck = await this.checkBulkRecipients(tenant.id, request.mobiles)

      return {
        allowed: bulkCheck.data.allowedMobiles.length > 0,
        reason: bulkCheck.data.blockedMobiles.length > 0
          ? `${bulkCheck.data.blockedMobiles.length} recipients blocked`
          : undefined,
        blockedMobiles: bulkCheck.data.blockedMobiles,
        allowedMobiles: bulkCheck.data.allowedMobiles,
        warmupInfo: warmupCheck.data?.warmupInfo,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    }

    return {
      allowed: true,
      warmupInfo: warmupCheck.data?.warmupInfo,
      warnings: warnings.length > 0 ? warnings : undefined
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
   * Check if current time is within allowed sending hours
   */
  private static checkSendingHours(): CheckResult {
    const now = new Date()
    // Israel timezone (UTC+2 or UTC+3 during DST)
    const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }))
    const hour = israelTime.getHours()

    if (hour < SENDING_HOURS.START || hour >= SENDING_HOURS.END) {
      return {
        passed: false,
        reason: `Sending allowed only between ${SENDING_HOURS.START}:00-${SENDING_HOURS.END}:00. Current time: ${hour}:${israelTime.getMinutes().toString().padStart(2, '0')}`,
        code: 'OUTSIDE_SENDING_HOURS'
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
   * Check for spam patterns - same text to many recipients
   */
  private static checkSpamPattern(recipientCount: number, text: string): CheckResult {
    if (recipientCount >= SPAM_THRESHOLDS.BLOCK) {
      return {
        passed: false,
        reason: `Spam pattern detected: Same message to ${recipientCount} recipients (limit: ${SPAM_THRESHOLDS.BLOCK}). Consider personalizing messages.`,
        code: 'SPAM_DETECTED'
      }
    }

    if (recipientCount >= SPAM_THRESHOLDS.WARNING) {
      return {
        passed: true,
        warning: `Warning: Same message to ${recipientCount} recipients. Consider personalizing to avoid WhatsApp restrictions.`
      }
    }

    return { passed: true }
  }

  /**
   * Check content quality - suspicious links, too many emojis, spam words
   */
  private static checkContentQuality(text: string): CheckResult {
    // Check for suspicious patterns
    for (const pattern of CONTENT_LIMITS.SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        return {
          passed: false,
          reason: `Content contains suspicious pattern. Message may be flagged as spam.`,
          code: 'CONTENT_VIOLATION'
        }
      }
    }

    // Count emojis (simplified - counts emoji-like unicode ranges)
    const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length
    if (emojiCount > CONTENT_LIMITS.MAX_EMOJIS) {
      return {
        passed: false,
        reason: `Too many emojis (${emojiCount}). Maximum allowed: ${CONTENT_LIMITS.MAX_EMOJIS}`,
        code: 'CONTENT_VIOLATION'
      }
    }

    // Count links
    const linkCount = (text.match(/https?:\/\/[^\s]+/gi) || []).length
    if (linkCount > CONTENT_LIMITS.MAX_LINKS) {
      return {
        passed: false,
        reason: `Too many links (${linkCount}). Maximum allowed: ${CONTENT_LIMITS.MAX_LINKS}`,
        code: 'CONTENT_VIOLATION'
      }
    }

    // Warning for multiple links (but allow)
    if (linkCount > 1) {
      return {
        passed: true,
        warning: `Message contains ${linkCount} links. Multiple links may increase spam risk.`
      }
    }

    return { passed: true }
  }

  /**
   * Check if recipient is problematic (too many failures)
   */
  private static async checkProblematicRecipient(tenantId: string, mobile: string): Promise<CheckResult> {
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - PROBLEMATIC_RECIPIENT.DAYS_TO_CHECK)

    const failCount = await remult.repo(MessageRequest).count({
      tenantId,
      mobile,
      status: MessageStatus.failed,
      createDate: { $gte: daysAgo }
    })

    if (failCount >= PROBLEMATIC_RECIPIENT.FAIL_COUNT) {
      return {
        passed: false,
        reason: `Recipient ${mobile} has ${failCount} failed messages in the last ${PROBLEMATIC_RECIPIENT.DAYS_TO_CHECK} days. Consider removing from list.`,
        code: 'PROBLEMATIC_RECIPIENT'
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
   * Check bulk recipients - combines daily limit + problematic check
   */
  private static async checkBulkRecipients(
    tenantId: string,
    mobiles: string[]
  ): Promise<CheckResult> {
    const uniqueMobiles = [...new Set(mobiles)]

    // Get daily counts
    const dailyCounts = await this.getDailyCounts(tenantId, uniqueMobiles)

    // Get problematic recipients
    const problematicMobiles = await this.getProblematicRecipients(tenantId, uniqueMobiles)

    const batchCounts = new Map<string, number>()
    const blockedMobiles: string[] = []
    const allowedMobiles: string[] = []

    for (const mobile of mobiles) {
      // Check if problematic
      if (problematicMobiles.has(mobile)) {
        if (!blockedMobiles.includes(mobile)) {
          blockedMobiles.push(mobile)
        }
        continue
      }

      // Check daily limit
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
      passed: true,
      data: { allowedMobiles, blockedMobiles }
    }
  }

  /**
   * Check warm-up limit for new phone numbers
   */
  private static async checkWarmup(
    tenantId: string,
    providerConfig: ProviderConfig,
    messageCount: number
  ): Promise<CheckResult> {
    const daysSinceCreation = this.getDaysSinceCreation(providerConfig.createDate)
    const dailyLimit = this.getWarmupDailyLimit(daysSinceCreation)

    if (dailyLimit === null) {
      return {
        passed: true,
        data: {
          warmupInfo: {
            daysSinceCreation,
            currentDailyLimit: -1,
            sentToday: 0,
            remaining: -1
          }
        }
      }
    }

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

  private static async getProblematicRecipients(tenantId: string, mobiles: string[]): Promise<Set<string>> {
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - PROBLEMATIC_RECIPIENT.DAYS_TO_CHECK)

    const failedMessages = await remult.repo(MessageRequest).find({
      where: {
        tenantId,
        mobile: { $in: mobiles },
        status: MessageStatus.failed,
        createDate: { $gte: daysAgo }
      }
    })

    // Count failures per mobile
    const failCounts = new Map<string, number>()
    for (const msg of failedMessages) {
      failCounts.set(msg.mobile, (failCounts.get(msg.mobile) || 0) + 1)
    }

    // Return mobiles with too many failures
    const problematic = new Set<string>()
    for (const [mobile, count] of failCounts.entries()) {
      if (count >= PROBLEMATIC_RECIPIENT.FAIL_COUNT) {
        problematic.add(mobile)
      }
    }

    return problematic
  }

  private static async getProviderMessageCountToday(tenantId: string, providerConfigId: string): Promise<number> {
    const startOfDay = this.getStartOfToday()
    return await remult.repo(MessageRequest).count({
      tenantId,
      createDate: { $gte: startOfDay }
    })
  }

  private static getDaysSinceCreation(createDate: Date): number {
    const now = new Date()
    const diffTime = now.getTime() - createDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1
  }

  private static getWarmupDailyLimit(daysSinceCreation: number): number | null {
    for (const level of WARMUP_LEVELS) {
      if (daysSinceCreation <= level.maxDays) {
        return level.dailyLimit
      }
    }
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

  static getSpamThresholds() {
    return SPAM_THRESHOLDS
  }

  static getSendingHours() {
    return SENDING_HOURS
  }

  static getContentLimits() {
    return CONTENT_LIMITS
  }

  static getProblematicRecipientConfig() {
    return PROBLEMATIC_RECIPIENT
  }
}
