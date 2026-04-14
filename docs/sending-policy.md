# Sending Policy - מנגנוני הגנה לשליחת הודעות WhatsApp

## סקירה כללית

מערכת ההגנה מונעת חסימה של מספרי WhatsApp על ידי בדיקות מרובות לפני שליחת הודעות.
כל הבדיקות מרוכזות ב-`SendingPolicyService` לתחזוקה קלה.

---

## רשימת הבדיקות

### 1. בדיקת הרשאת שליחה (checkCanSend)

| פרמטר | ערך |
|-------|-----|
| **מה נבדק** | האם `tenant.canSend = true` |
| **קוד שגיאה** | `SENDING_DISABLED` |
| **פעולה בכשלון** | חסימה מלאה |

**מתי רלוונטי:** תמיד - בדיקה ראשונה

---

### 2. הגבלת שעות שליחה (checkSendingHours)

| פרמטר | ערך |
|-------|-----|
| **שעת התחלה** | 08:00 |
| **שעת סיום** | 22:00 |
| **אזור זמן** | Asia/Jerusalem (Israel) |
| **קוד שגיאה** | `OUTSIDE_SENDING_HOURS` |
| **פעולה בכשלון** | חסימה מלאה |

**מתי רלוונטי:** תמיד - מונע שליחה בשעות לא סבירות

**קונפיגורציה:**
```typescript
const SENDING_HOURS = {
  START: 8,   // 08:00
  END: 22     // 22:00
}
```

---

### 3. בדיקת איכות תוכן (checkContentQuality)

| פרמטר | ערך |
|-------|-----|
| **מקסימום אימוג'ים** | 10 |
| **מקסימום לינקים** | 3 |
| **קוד שגיאה** | `CONTENT_VIOLATION` |

**תבניות חשודות שנחסמות:**
- קיצורי URL: `bit.ly`, `tinyurl`, `goo.gl`
- מילות spam: `WIN FREE`, `CLICK HERE NOW`, `LIMITED TIME OFFER`
- סימנים חשודים: `$$$`
- תווים סיניים חשודים

**קונפיגורציה:**
```typescript
const CONTENT_LIMITS = {
  MAX_EMOJIS: 10,
  MAX_LINKS: 3,
  SUSPICIOUS_PATTERNS: [
    /bit\.ly/i,
    /tinyurl/i,
    /goo\.gl/i,
    /\$\$\$+/,
    /WIN FREE/i,
    /CLICK HERE NOW/i,
    /LIMITED TIME OFFER/i
  ]
}
```

**אזהרות (לא חוסמות):**
- יותר מלינק אחד בהודעה

---

### 4. זיהוי תבניות Spam (checkSpamPattern)

| פרמטר | ערך |
|-------|-----|
| **סף אזהרה** | 20 נמענים עם אותו טקסט |
| **סף חסימה** | 50 נמענים עם אותו טקסט |
| **קוד שגיאה** | `SPAM_DETECTED` |

**מתי רלוונטי:** שליחה באצווה (bulk) בלבד

**קונפיגורציה:**
```typescript
const SPAM_THRESHOLDS = {
  WARNING: 20,  // 20-49 = אזהרה בלוג
  BLOCK: 50     // 50+ = חסימה
}
```

**המלצה:** אם שולחים לרבים, להוסיף פרסונליזציה (שם, וכו')

---

### 5. מגבלת Warm-up למספרים חדשים (checkWarmup)

| תקופה | מגבלה יומית |
|-------|-------------|
| יום 1-7 | 50 הודעות |
| יום 8-14 | 100 הודעות |
| יום 15-30 | 250 הודעות |
| יום 31+ | ללא מגבלה (מכסת דייר) |

| פרמטר | ערך |
|-------|-----|
| **בסיס חישוב** | `providerConfig.createDate` |
| **קוד שגיאה** | `WARMUP_LIMIT_REACHED` |

**קונפיגורציה:**
```typescript
const WARMUP_LEVELS = [
  { maxDays: 7, dailyLimit: 50 },
  { maxDays: 14, dailyLimit: 100 },
  { maxDays: 30, dailyLimit: 250 }
]
```

---

### 6. בדיקת מכסה (checkQuota)

| פרמטר | ערך |
|-------|-----|
| **מה נבדק** | `tenant.messagesSent < tenant.messageQuota` |
| **ברירת מחדל** | 1000 הודעות |
| **קוד שגיאה** | `QUOTA_EXCEEDED` |

---

### 7. זיהוי נמענים בעייתיים (checkProblematicRecipient)

| פרמטר | ערך |
|-------|-----|
| **סף כשלונות** | 3 |
| **תקופת בדיקה** | 7 ימים אחרונים |
| **קוד שגיאה** | `PROBLEMATIC_RECIPIENT` |

**מתי רלוונטי:** מספר שנכשל 3+ פעמים ב-7 ימים נחסם אוטומטית

**קונפיגורציה:**
```typescript
const PROBLEMATIC_RECIPIENT = {
  FAIL_COUNT: 3,
  DAYS_TO_CHECK: 7
}
```

---

### 8. מגבלה יומית לנמען (checkDailyLimit)

| פרמטר | ערך |
|-------|-----|
| **מקסימום הודעות** | 2 ליום לכל נמען |
| **קוד שגיאה** | `DAILY_LIMIT_REACHED` |

**קונפיגורציה:**
```typescript
const MAX_MESSAGES_PER_RECIPIENT_PER_DAY = 2
```

---

## מנגנוני Rate Limiting (FairMessageQueueService)

### השהייה אקראית בין אצוות

| פרמטר | ערך |
|-------|-----|
| **השהייה בסיסית** | 1000ms |
| **טווח אקראי** | ±200ms (800-1200ms) |
| **הודעות באצווה** | 10 |

### השהייה מיקרו בין הודעות

| פרמטר | ערך |
|-------|-----|
| **מינימום** | 50ms |
| **מקסימום** | 150ms |

### פריסת שליחה (Spread)

| פרמטר | ערך |
|-------|-----|
| **סף הפעלה** | תור > 100 הודעות |
| **השהייה נוספת** | 500ms * (גודל תור / 100) |
| **מקסימום מכפיל** | 3x |

**קונפיגורציה:**
```typescript
const RATE_LIMIT = {
  BASE_DELAY_MS: 1000,
  RANDOM_RANGE_MS: 400,
  MESSAGES_PER_BATCH: 10,
  SPREAD_THRESHOLD: 100,
  SPREAD_EXTRA_DELAY_MS: 500,
  MICRO_DELAY_MIN_MS: 50,
  MICRO_DELAY_MAX_MS: 150
}
```

---

## קודי שגיאה

| קוד | תיאור | פתרון |
|-----|-------|-------|
| `SENDING_DISABLED` | שליחה לא מאופשרת לדייר | הפעל canSend |
| `OUTSIDE_SENDING_HOURS` | מחוץ לשעות השליחה | המתן ל-08:00-22:00 |
| `CONTENT_VIOLATION` | תוכן חשוד | הסר לינקים/אימוג'ים מיותרים |
| `SPAM_DETECTED` | אותו טקסט ליותר מדי נמענים | הוסף פרסונליזציה |
| `WARMUP_LIMIT_REACHED` | מספר חדש - מגבלה יומית | המתן או הגדל בהדרגה |
| `QUOTA_EXCEEDED` | מכסה נגמרה | הגדל מכסה או איפוס |
| `PROBLEMATIC_RECIPIENT` | נמען עם כשלונות רבים | הסר מרשימה |
| `DAILY_LIMIT_REACHED` | 2 הודעות ליום לנמען | המתן ליום הבא |

---

## תגובת API מורחבת

### שליחה בודדת
```json
{
  "requestId": "uuid",
  "status": "queued"
}
```

### שליחה באצווה
```json
{
  "batchId": "uuid",
  "total": 100,
  "queued": 85,
  "blocked": 15,
  "blockedMobiles": ["972501234567", "..."],
  "warmupInfo": {
    "daysSinceCreation": 5,
    "currentDailyLimit": 50,
    "sentToday": 30,
    "remaining": 20
  },
  "warnings": ["Warning: Same message to 25 recipients..."]
}
```

---

## סדר הבדיקות

```
1. checkCanSend()           → האם מאופשר לדייר
2. checkSendingHours()      → האם בשעות מותרות
3. checkContentQuality()    → האם התוכן תקין
4. checkSpamPattern()       → האם לא spam
5. checkWarmup()            → האם לא חורג מ-warmup
6. checkQuota()             → האם יש מכסה
7. checkProblematicRecipient() → האם נמען לא בעייתי
8. checkDailyLimit()        → האם לא עבר 2/יום
```

---

## גישה לקונפיגורציה (לUI/Dashboard)

```typescript
import { SendingPolicyService } from './services/sending-policy.service'
import { FairMessageQueueService } from './services/fair-queue.service'

// Policy configs
SendingPolicyService.getWarmupLevels()
SendingPolicyService.getMaxMessagesPerRecipientPerDay()
SendingPolicyService.getSpamThresholds()
SendingPolicyService.getSendingHours()
SendingPolicyService.getContentLimits()
SendingPolicyService.getProblematicRecipientConfig()

// Rate limit config
FairMessageQueueService.getRateLimitConfig()
```

---

## עדכון קונפיגורציה

כל הקונפיגורציות נמצאות בקבצים:
- `src/shared/services/sending-policy.service.ts` - בדיקות policy
- `src/shared/services/fair-queue.service.ts` - rate limiting

לשינוי ערכים, עדכן את הקבועים בראש הקובץ ובצע build מחדש.
