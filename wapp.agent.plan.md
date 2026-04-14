# wapp.agent - תוכנית מערכת

## שיטת דרוקמן - ארכיטקטורת הפלטפורמה

---

## 1. ראיית הפרויקט

### ארכיטקטורה כוללת - שני Repos
```
Repo 1: wapp-agent              # Microservice עצמאי
        └── שירות שליחת WhatsApp

Repo 2: crm-biz-base            # פלטפורמה + מודולים
        ├── Core CRM
        └── Modules (תוספים לבחירה)
```

### wapp.agent - Microservice (הפרויקט הנוכחי)
```
┌─────────────────────────────────────────────────────────────┐
│  wapp.agent (Node.js on Heroku - Scalable)                  │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  🎯 שירות עצמאי - משרת כל אפליקציה עם API key תקין          │
│                                                             │
│  INPUT:                                                     │
│  • mobile (טלפון)                                           │
│  • text (תוכן)                                              │
│  • files[] (קבצים מטיפוסים מוגדרים)                         │
│  • bulk support (רשימות הודעות)                             │
│                                                             │
│  OUTPUT:                                                    │
│  • status לכל הודעה (queued → sent → delivered → read)      │
│  • tracking מלא                                             │
│  • real-time updates (LiveQuery)                            │
│                                                             │
│  PROVIDERS:                                                 │
│  • Green-API ✅ (יש חשבון)                                  │
│  • Meta API 🔜 (לפי דרישה - תהליך מייגע)                    │
│                                                             │
│  UI:                                                        │
│  • Admin Dashboard חי                                       │
│  • ניהול Tenants                                            │
│  • מעקב הודעות                                              │
└─────────────────────────────────────────────────────────────┘
```

### crm-biz-base - פלטפורמה עם מודולים (עתידי)
```
┌─────────────────────────────────────────────────────────────┐
│  crm-biz-base (פלטפורמה בסיסית)                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  CORE (תמיד פעיל):                                          │
│  • Customers (לקוחות)                                       │
│  • Contacts (אנשי קשר)                                      │
│  • Deals (עסקאות)                                           │
│  • Tasks (משימות)                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🔌 MODULES (תוספים לבחירת הלקוח):                          │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ WhatsApp Basic  │  │ WhatsApp Pro    │                   │
│  │ ───────────────│  │ ───────────────│                   │
│  │ • שליחה בודדת  │  │ • קמפיינים     │                   │
│  │ • סטטוס        │  │ • תבניות       │                   │
│  │                 │  │ • אוטומציה     │                   │
│  │                 │  │ • דוחות        │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                            │
│           └─────────┬──────────┘                            │
│                     ▼                                       │
│              ┌─────────────┐                                │
│              │ wapp.agent  │  (API call)                    │
│              └─────────────┘                                │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Email Marketing │  │ SMS             │                   │
│  │ (עתידי)         │  │ (עתידי)         │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### סדר פיתוח
```
1. wapp.agent        ← עכשיו (הפרויקט הנוכחי)
2. crm-biz-base      ← אחרי wapp.agent
   ├── Core CRM
   ├── Module: whatsapp-basic
   └── Module: whatsapp-pro
```

---

## 2. גרסאות יעד

| טכנולוגיה | גרסה | הערות |
|-----------|------|-------|
| **Angular** | 19.0.0 | נעול - Latest stable |
| **Remult** | 3.3.6 | נעול - Latest stable |
| **Node.js** | 20 LTS | או 22 LTS |
| **TypeScript** | 5.5.0 | נעול - תואם ל-Angular 19 |
| **PostgreSQL** | 15+ | - |

> **חשוב:** כל הגרסאות נעולות (ללא `^`) למניעת שבירות בעדכונים אוטומטיים

---

## 3. טכנולוגיות הליבה

| טכנולוגיה | תפקיד |
|-----------|--------|
| **Angular 19** | Frontend - Admin UI, Dashboard |
| **Node.js + Express** | Backend - שרת HTTP |
| **Remult 3** | ORM + RPC + Auth + Session + **LiveQuery** |
| **TypeScript** | Type Safety בכל השכבות |
| **PostgreSQL** | בסיס נתונים |
| **Heroku** | Hosting - Scalable |
| **Green-API** | WhatsApp Provider |

---

## 4. Remult - מה הוא מנהל

Remult מנהל **הכל** - אנחנו מתמקדים רק בלוגיקה עסקית:

| תחום | Remult מטפל | אנחנו מטפלים |
|------|-------------|--------------|
| DB Access | ✅ ORM, Queries | - |
| API | ✅ RPC אוטומטי | - |
| Auth | ✅ Login, Session, Roles | הגדרת Roles |
| Validation | ✅ Validators | הגדרת כללים |
| Type Safety | ✅ קליינט ↔ שרת | - |
| **Real-time** | ✅ **LiveQuery** | שימוש בקליינט |
| Business Logic | - | ✅ Controllers |
| UI | - | ✅ Components |
| External Services | - | ✅ Delegates |

### גישה למשתמש הנוכחי
```typescript
remult.user?.id
remult.user?.name
remult.user?.roles

// בדיקת הרשאה:
if (remult.user?.roles?.includes(Roles.admin)) { ... }
```

### LiveQuery - Real-time Updates
```typescript
// בצד הקליינט בלבד!
ngOnInit() {
  this.subscription = remult.repo(Message)
    .liveQuery({
      where: { status: MessageStatus.pending },
      orderBy: { createDate: 'desc' }
    })
    .subscribe(info => {
      this.messages = info.applyChanges(this.messages)
    })
}

ngOnDestroy() {
  this.subscription() // unsubscribe
}
```

**מגבלת LiveQuery:**
- רץ רק בקליינט (SSE - Server-Sent Events)
- לא ניתן להריץ queries כבדים בשרת עם real-time
- **פתרון:** לשמור את הכבד בשרת, LiveQuery רק לתצוגה

### SSE אוטומטי - איך זה עובד
```
Server: entity.save()
            ↓
Remult detects change in entity
            ↓
SSE push to ALL subscribed clients
            ↓
Dashboard LiveQuery callback fires
            ↓
UI updates automatically 🔴 LIVE
```

**כל `save()` בשרת → עדכון אוטומטי בקליינט!**
- לא צריך לכתוב קוד נוסף
- לא צריך WebSocket ידני
- Remult מנהל הכל

---

## 5. מבנה תיקיות - wapp.agent

```
src/
├── app/                              # Angular Frontend (Admin UI)
│   ├── dashboard/                    # Dashboard חי
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   └── dashboard.component.scss
│   │
│   ├── tenants/                      # ניהול לקוחות השירות
│   │   ├── tenant.ts
│   │   ├── tenants.service.ts
│   │   ├── tenant-list/
│   │   └── tenant-details/
│   │
│   ├── messages/                     # ניהול הודעות
│   │   ├── message-request.ts        # הודעות יוצאות
│   │   ├── incoming-message.ts       # הודעות נכנסות
│   │   ├── messages.service.ts
│   │   ├── message-list/             # רשימת הודעות יוצאות
│   │   ├── message-details/
│   │   └── incoming-list/            # רשימת הודעות נכנסות
│   │
│   ├── providers/                    # הגדרות ספקים
│   │   ├── provider-config.ts
│   │   ├── provider-list/
│   │   └── provider-details/
│   │
│   ├── common/                       # תשתית UI משותפת
│   │   ├── components/
│   │   │   └── base-table/
│   │   ├── UIToolsService.ts
│   │   └── busyService.ts
│   │
│   ├── users/                        # ניהול משתמשים (Admin)
│   ├── terms.ts
│   ├── app.module.ts
│   └── app-routing.module.ts
│
├── shared/                           # משותף לקליינט ושרת
│   ├── controllers/
│   │   ├── MessagesController.ts     # לוגיקת שליחה
│   │   ├── TenantsController.ts
│   │   └── ProvidersController.ts
│   ├── providers/                    # 🆕 Provider Interface
│   │   └── provider.interface.ts     # IProviderAdapter
│   ├── services/                     # 🆕 Shared Services
│   │   ├── webhook.service.ts        # WebhookService
│   │   ├── http.service.ts           # HttpService (timeout)
│   │   └── message-queue.service.ts  # MessageQueueService (throttle)
│   ├── enums/
│   │   ├── MessageStatus.ts
│   │   ├── MessageType.ts
│   │   ├── ProviderType.ts
│   │   └── FileType.ts
│   └── types/
│       └── webhook.type.ts
│
└── server/                           # Node.js Backend
    ├── index.ts                      # Server startup
    ├── api.ts                        # Remult configuration
    ├── providers/                    # 🔹 Provider Adapters
    │   ├── index.ts                  # Factory
    │   ├── greenapi.adapter.ts       # Green-API implementation
    │   └── meta.adapter.ts           # Meta (עתידי)
    └── webhooks/                     # 🔹 Webhook Handlers
        └── greenapi.webhook.ts       # Green-API webhooks
```

---

## 6. ישויות wapp.agent

### Tenant - לקוח השירות
```typescript
@Entity<Tenant>('tenants', { allowApiCrud: Roles.admin })
export class Tenant extends IdEntity {
  @Fields.string({ validate: [Validators.required] })
  name = ''

  @Fields.string({ validate: [Validators.required, Validators.unique] })
  apiKey = ''  // UUID generated

  @Fields.boolean()
  isActive = true

  @Fields.number()
  messageQuota = 1000  // מכסה חודשית

  @Fields.number()
  messagesSent = 0

  // 🔌 הגדרות שירות
  @Fields.boolean({ caption: 'שליחת הודעות' })
  canSend = true  // ברירת מחדל - כולם יכולים לשלוח

  @Fields.boolean({ caption: 'קבלת הודעות' })
  canReceive = false  // ברירת מחדל - לא מקבלים

  @Fields.string({ caption: 'Webhook URL להודעות נכנסות' })
  incomingWebhookUrl = ''  // אופציונלי - callback לtenant

  @Fields.date({ allowApiUpdate: false })
  createDate = new Date()
}
```

### ProviderConfig - הגדרות ספק (לכל Tenant מספר משלו!)
```typescript
@Entity<ProviderConfig>('provider-configs', { allowApiCrud: Roles.admin })
export class ProviderConfig extends IdEntity {
  @Fields.string()
  tenantId = ''

  @Relations.toOne(() => Tenant)
  tenant!: Tenant

  @Fields.object()
  providerType = ProviderType.greenApi

  @Fields.string()
  instanceId = ''  // Green-API instance ID

  @Fields.string()
  apiToken = ''  // encrypted

  @Fields.string()
  phoneNumber = ''  // 🆕 המספר המשויך (972501234567)

  @Fields.string()
  displayName = ''  // 🆕 שם לתצוגה ("מכירות", "תמיכה")

  @Fields.boolean()
  isDefault = true  // ברירת מחדל לשליחה

  @Fields.boolean()
  isActive = true

  @Fields.date({ allowApiUpdate: false })
  createDate = new Date()
}
```

**תרחישים נתמכים:**
```
תרחיש A: כל Tenant = מספר משלו (מומלץ)
  Tenant A ──> Instance A ──> 972-50-111-1111
  Tenant B ──> Instance B ──> 972-50-222-2222

תרחיש B: Tenant עם כמה מספרים
  Tenant A ──> Instance A1 ──> 972-50-111-1111 (מכירות)
           ──> Instance A2 ──> 972-50-111-2222 (תמיכה)
```

### MessageRequest - בקשת הודעה
```typescript
@Entity<MessageRequest>('message-requests', { allowApiCrud: true })
export class MessageRequest extends IdEntity {
  @Fields.string()
  tenantId = ''

  @Relations.toOne(() => Tenant)
  tenant!: Tenant

  @Fields.string({ validate: [Validators.required] })
  mobile = ''  // 972501234567

  @Fields.string()
  text = ''

  @Fields.object()
  providerType = ProviderType.greenApi

  @Fields.string()
  batchId = ''  // לקיבוץ bulk

  @Fields.object()
  status = MessageStatus.queued

  @Fields.string()
  providerMessageId = ''  // ID מהספק

  @Fields.string()
  errorMessage = ''

  @Fields.date({ allowApiUpdate: false })
  createDate = new Date()

  @Fields.date()
  sentDate?: Date

  @Fields.date()
  deliveredDate?: Date

  @Fields.date()
  readDate?: Date
}
```

### MessageFile - קובץ מצורף
```typescript
@Entity<MessageFile>('message-files', { allowApiCrud: true })
export class MessageFile extends IdEntity {
  @Fields.string()
  messageRequestId = ''

  @Relations.toOne(() => MessageRequest)
  messageRequest!: MessageRequest

  @Fields.object()
  fileType = FileType.image  // image, document, audio, video

  @Fields.string()
  url = ''

  @Fields.string()
  fileName = ''

  @Fields.number()
  fileSize = 0
}
```

### IncomingMessage - הודעה נכנסת (אופציונלי לכל Tenant)
```typescript
@Entity<IncomingMessage>('incoming-messages', { allowApiCrud: true })
export class IncomingMessage extends IdEntity {
  @Fields.string()
  tenantId = ''

  @Relations.toOne(() => Tenant)
  tenant!: Tenant

  @Fields.string()
  mobile = ''  // מאיפה הגיע

  @Fields.string()
  text = ''

  @Fields.object()
  messageType = MessageType.text  // text, image, document, audio, video

  @Fields.string()
  mediaUrl = ''  // URL לקובץ אם יש

  @Fields.string()
  providerMessageId = ''

  @Fields.date({ allowApiUpdate: false })
  receivedDate = new Date()

  // 📤 מעקב Callback ל-Tenant
  @Fields.boolean()
  callbackSent = false  // האם נשלח callback

  @Fields.date()
  callbackSentDate?: Date  // מתי נשלח

  @Fields.string()
  callbackError = ''  // שגיאה אם נכשל

  // ✅ מעקב טיפול
  @Fields.boolean()
  isRead = false  // האם ה-tenant קרא/טיפל
}
```

### Enums
```typescript
// shared/enums/MessageStatus.ts
@ValueListFieldType()
export class MessageStatus {
  static queued = new MessageStatus('queued', 'בתור')
  static sending = new MessageStatus('sending', 'בשליחה')
  static sent = new MessageStatus('sent', 'נשלח')
  static delivered = new MessageStatus('delivered', 'הגיע')
  static read = new MessageStatus('read', 'נקרא')
  static failed = new MessageStatus('failed', 'נכשל')
  constructor(public id: string, public caption: string) {}
}

// shared/enums/ProviderType.ts
@ValueListFieldType()
export class ProviderType {
  static greenApi = new ProviderType('green-api', 'Green-API')
  static metaApi = new ProviderType('meta-api', 'Meta WhatsApp API')
  constructor(public id: string, public caption: string) {}
}

// shared/enums/FileType.ts
@ValueListFieldType()
export class FileType {
  static image = new FileType('image', 'תמונה')
  static document = new FileType('document', 'מסמך')
  static audio = new FileType('audio', 'אודיו')
  static video = new FileType('video', 'וידאו')
  constructor(public id: string, public caption: string) {}
}

// shared/enums/MessageType.ts (להודעות נכנסות)
@ValueListFieldType()
export class MessageType {
  static text = new MessageType('text', 'טקסט')
  static image = new MessageType('image', 'תמונה')
  static document = new MessageType('document', 'מסמך')
  static audio = new MessageType('audio', 'אודיו')
  static video = new MessageType('video', 'וידאו')
  static location = new MessageType('location', 'מיקום')
  static contact = new MessageType('contact', 'איש קשר')
  constructor(public id: string, public caption: string) {}
}
```

---

## 7. Provider Abstraction Layer

### העיקרון: פשוט + יציב כמו סלע!

```
┌─────────────────────────────────────────────────────────────┐
│  wapp.agent API (יציב - לא משתנה)                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  IProviderAdapter (Interface)                               │
└─────────────────────────────────────────────────────────────┘
                    ↓                   ↓
        ┌───────────────────┐ ┌───────────────────┐
        │ GreenApiAdapter   │ │ MetaApiAdapter    │
        │ (עכשיו)           │ │ (עתידי)           │
        └───────────────────┘ └───────────────────┘
```

### shared/providers/provider.interface.ts
```typescript
// 🎯 Interface מינימלי ויציב

export interface IProviderAdapter {
  // 📤 שליחה
  sendText(req: SendTextRequest): Promise<ProviderResponse>
  sendFile(req: SendFileRequest): Promise<ProviderResponse>

  // 📊 סטטוס
  getInstanceStatus(): Promise<ProviderStatus>
}

// Types - פשוטים וברורים
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

export interface ProviderResponse {
  success: boolean
  messageId?: string
  error?: string
}

export interface ProviderStatus {
  connected: boolean
  phone?: string
}
```

### server/providers/greenapi.adapter.ts
```typescript
import { GreenApiClient } from '@green-api/whatsapp-api-client-js-v2'
import { IProviderAdapter, SendTextRequest, SendFileRequest,
         ProviderResponse, ProviderStatus } from '../../shared/providers/provider.interface'

export class GreenApiAdapter implements IProviderAdapter {
  private client: GreenApiClient

  constructor(instanceId: string, apiToken: string) {
    this.client = new GreenApiClient({
      idInstance: instanceId,
      apiTokenInstance: apiToken
    })
  }

  async sendText(req: SendTextRequest): Promise<ProviderResponse> {
    try {
      const result = await this.client.sendMessage({
        chatId: `${req.mobile}@c.us`,
        message: req.text,
        quotedMessageId: req.replyToMessageId
      })
      return { success: true, messageId: result.idMessage }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async sendFile(req: SendFileRequest): Promise<ProviderResponse> {
    try {
      const result = await this.client.sendFileByUrl({
        chatId: `${req.mobile}@c.us`,
        file: { url: req.fileUrl, fileName: req.fileName },
        caption: req.caption || '',
        quotedMessageId: req.replyToMessageId
      })
      return { success: true, messageId: result.idMessage }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async getInstanceStatus(): Promise<ProviderStatus> {
    try {
      const state = await this.client.getStateInstance()
      return {
        connected: state.stateInstance === 'authorized',
        phone: state.phoneNumber
      }
    } catch (error) {
      return { connected: false }
    }
  }
}
```

### server/providers/index.ts - Factory
```typescript
import { IProviderAdapter } from '../../shared/providers/provider.interface'
import { GreenApiAdapter } from './greenapi.adapter'
import { ProviderType } from '../../shared/enums/ProviderType'

export function createProviderAdapter(
  providerType: ProviderType,
  instanceId: string,
  apiToken: string
): IProviderAdapter {

  switch (providerType) {
    case ProviderType.greenApi:
      return new GreenApiAdapter(instanceId, apiToken)

    // עתידי:
    // case ProviderType.metaApi:
    //   return new MetaApiAdapter(instanceId, apiToken)

    default:
      throw new Error(`Unknown provider: ${providerType.id}`)
  }
}
```

---

## 8. Webhook Handler

### server/webhooks/greenapi.webhook.ts
```typescript
import { remult } from 'remult'
import { MessageRequest } from '../../app/messages/message-request'
import { IncomingMessage } from '../../app/messages/incoming-message'
import { ProviderConfig } from '../../app/providers/provider-config'
import { Tenant } from '../../app/tenants/tenant'
import { MessageStatus } from '../../shared/enums/MessageStatus'
import { WebhookService } from '../../shared/services/webhook.service'

// 🔑 זיהוי Tenant לפי instanceId מה-webhook!

// Helper: מציאת Tenant לפי instanceId
async function getTenantByInstance(instanceId: string): Promise<Tenant | null> {
  const config = await remult.repo(ProviderConfig).findFirst({
    instanceId: instanceId?.toString(),
    isActive: true
  })

  if (!config) {
    console.error(`Unknown instance: ${instanceId}`)
    return null
  }

  return await remult.repo(Tenant).findId(config.tenantId)
}

export async function handleGreenApiWebhook(body: any) {
  const { typeWebhook } = body
  const instanceId = body.instanceData?.idInstance || body.instanceId

  // 1. סטטוס הודעה יוצאת - תמיד
  if (typeWebhook === 'outgoingMessageStatus') {
    const message = await remult.repo(MessageRequest)
      .findFirst({ providerMessageId: body.idMessage })

    if (message) {
      message.status = mapStatus(body.status)
      if (body.status === 'delivered') message.deliveredDate = new Date()
      if (body.status === 'read') message.readDate = new Date()
      await message.save()  // ← SSE אוטומטי לכל המאזינים!
    }
  }

  // 2. הודעה נכנסת - רק אם Tenant ביקש
  if (typeWebhook === 'incomingMessageReceived') {
    const tenant = await getTenantByInstance(instanceId)

    if (!tenant) return  // לא מוכר

    if (tenant.canReceive) {
      // שמירה ב-DB
      const incoming = remult.repo(IncomingMessage).create()
      incoming.tenantId = tenant.id
      incoming.mobile = body.senderData?.chatId?.replace('@c.us', '') || ''
      incoming.text = body.messageData?.textMessageData?.textMessage || ''
      incoming.providerMessageId = body.idMessage
      await incoming.save()  // ← SSE אוטומטי!

      // Callback ל-tenant (fire & forget!)
      if (tenant.incomingWebhookUrl) {
        WebhookService.sendAsync(tenant.incomingWebhookUrl, {
          type: 'incoming',
          from: incoming.mobile,
          text: incoming.text,
          receivedAt: incoming.receivedDate
        })
      }
    }
  }
}
```

### Green-API Methods Available
| מתודה | תפקיד |
|-------|--------|
| `sendMessage` | שליחת טקסט |
| `sendFileByUrl` | שליחת קובץ מ-URL |
| `sendFileByUpload` | העלאה ושליחה |
| `sendLocation` | שליחת מיקום |
| `sendContact` | שליחת איש קשר |
| `sendPoll` | שליחת סקר |
| `getStateInstance` | בדיקת סטטוס החשבון |
| `receiveNotification` | קבלת webhook |

---

## 8. API Interface

### שליחת הודעה בודדת
```typescript
POST /api/messages/send
Authorization: Bearer <tenant-api-key>

{
  "mobile": "972501234567",
  "text": "שלום! זו הודעת בדיקה",
  "files": [
    { "type": "image", "url": "https://...", "fileName": "photo.jpg" }
  ],
  "provider": "green-api"  // optional, default from tenant config
}

// Response:
{
  "requestId": "uuid",
  "status": "queued"
}
```

### שליחת Bulk
```typescript
POST /api/messages/send-bulk
Authorization: Bearer <tenant-api-key>

{
  "messages": [
    { "mobile": "972501234567", "text": "הודעה 1" },
    { "mobile": "972509876543", "text": "הודעה 2", "files": [...] }
  ],
  "provider": "green-api"
}

// Response:
{
  "batchId": "uuid",
  "total": 2,
  "queued": 2
}
```

### מעקב סטטוס
```typescript
GET /api/messages/{requestId}/status
Authorization: Bearer <tenant-api-key>

// Response:
{
  "requestId": "uuid",
  "mobile": "972501234567",
  "status": "delivered",
  "statusHistory": [
    { "status": "queued", "at": "2025-04-13T10:00:00Z" },
    { "status": "sent", "at": "2025-04-13T10:00:01Z" },
    { "status": "delivered", "at": "2025-04-13T10:00:05Z" }
  ]
}
```

---

## 9. Admin UI - Dashboard

### מסכים
| מסך | תפקיד |
|-----|--------|
| **Dashboard** | מצב חי - LiveQuery - הודעות בתור, נשלחו, נכשלו |
| **Tenants** | ניהול לקוחות + API keys |
| **Messages** | רשימת הודעות + סטטוס + פילטרים |
| **Providers** | הגדרות Green-API / Meta |
| **Logs** | Webhook logs לדיבוג |

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│  📊 DASHBOARD                                    🔴 LIVE    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 📤 156  │ │ ✅ 142  │ │ ⏳ 8    │ │ ❌ 6    │           │
│  │ Total   │ │Delivered│ │ Pending │ │ Failed  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  [═══════════════════════════════░░░░░░░] 91% Success      │
│                                                             │
│  📈 Last 24 Hours (LiveQuery updates)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     ╱╲    ╱╲                                         │   │
│  │    ╱  ╲  ╱  ╲    ╱╲                                  │   │
│  │   ╱    ╲╱    ╲  ╱  ╲                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔴 Recent Failures (LiveQuery)                             │
│  • 972501234567 - "Invalid number" - 2 min ago             │
│  • 972509876543 - "Rate limit" - 5 min ago                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. זרימת נתונים

### Component → Server → Provider
```
┌─────────────────────────────────────────────────────────────┐
│  ANGULAR CLIENT                                             │
│                                                             │
│  Component (Dashboard / Messages List)                      │
│      ↓                                                      │
│  Service.sendMessage()                                      │
│      ↓                                                      │
│  MessagesController.sendMessage() ─── @BackendMethod        │
│      ↓                                                      │
│  [Remult: HTTP POST → /api]                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓ NETWORK
┌─────────────────────────────────────────────────────────────┐
│  NODE.JS SERVER                                             │
│                                                             │
│  MessagesController.sendMessage()                           │
│      ↓                                                      │
│  1. Validate API key → get Tenant                           │
│  2. Create MessageRequest (status: queued)                  │
│  3. Call Delegate: sendViaGreenApiDelegate()                │
│      ↓                                                      │
│  server/greenapi.ts                                         │
│      ↓                                                      │
│  GreenApiClient.sendMessage()                               │
│      ↓                                                      │
│  4. Update MessageRequest (status: sent, providerMessageId) │
│      ↓                                                      │
│  [LiveQuery pushes update to Dashboard]                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  GREEN-API                                                  │
│      ↓                                                      │
│  WhatsApp sends message                                     │
│      ↓                                                      │
│  Webhook: status update (delivered/read)                    │
│      ↓                                                      │
│  server/greenapi.ts handleWebhook()                         │
│      ↓                                                      │
│  Update MessageRequest status                               │
│      ↓                                                      │
│  [LiveQuery pushes update to Dashboard]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Delegate Pattern

### Controller
```typescript
// shared/controllers/MessagesController.ts
@Controller('messages')
export class MessagesController {

  // Delegate definitions
  static sendViaGreenApiDelegate: (req: SendMessageRequest) => Promise<SendMessageResponse>
  static sendViaMetaApiDelegate: (req: SendMessageRequest) => Promise<SendMessageResponse>

  @BackendMethod({ allowed: true })  // API key validation inside
  static async sendMessage(request: ApiSendMessageRequest): Promise<ApiSendMessageResponse> {
    // 1. Validate API key
    const tenant = await this.validateApiKey(request.apiKey)
    if (!tenant) throw new Error('Invalid API key')

    // 2. Get provider config
    const providerConfig = await this.getProviderConfig(tenant.id, request.provider)

    // 3. Create message request
    const messageRequest = remult.repo(MessageRequest).create()
    messageRequest.tenantId = tenant.id
    messageRequest.mobile = request.mobile
    messageRequest.text = request.text
    messageRequest.status = MessageStatus.queued
    await messageRequest.save()

    // 4. Send via delegate
    const sendRequest: SendMessageRequest = {
      mobile: request.mobile,
      text: request.text,
      instanceId: providerConfig.instanceId,
      apiToken: providerConfig.apiToken
    }

    let result: SendMessageResponse
    if (providerConfig.providerType === ProviderType.greenApi) {
      result = await MessagesController.sendViaGreenApiDelegate(sendRequest)
    } else {
      result = await MessagesController.sendViaMetaApiDelegate(sendRequest)
    }

    // 5. Update status
    if (result.success) {
      messageRequest.status = MessageStatus.sent
      messageRequest.providerMessageId = result.messageId!
      messageRequest.sentDate = new Date()
    } else {
      messageRequest.status = MessageStatus.failed
      messageRequest.errorMessage = result.error!
    }
    await messageRequest.save()

    return {
      requestId: messageRequest.id,
      status: messageRequest.status.id
    }
  }
}
```

### Server Registration
```typescript
// server/greenapi.ts
MessagesController.sendViaGreenApiDelegate = async (req) => await sendViaGreenApi(req)
console.info('sendViaGreenApiDelegate successfully registered.')

// server/meta-api.ts (עתידי)
MessagesController.sendViaMetaApiDelegate = async (req) => await sendViaMetaApi(req)
console.info('sendViaMetaApiDelegate successfully registered.')
```

---

## 12. יציבות כמו סלע - צווארי בקבוק ופתרונות

### עקרון מנחה
> **פשוט + יציב = לא חוסמים, לא ממתינים, לא קורסים**

---

### 1. FairMessageQueue - שליחה עם Throttle + הוגנות (Round-Robin)
```typescript
// shared/services/fair-queue.service.ts

// 🎯 בעיה: Tenant A שולח 10,000, Tenant B שולח 10,000
//          בלי הוגנות - B מחכה ש-A יסיים!
// ✅ פתרון: Round-Robin - לוקחים מכל tenant בתורות

export class FairMessageQueueService {
  // תור נפרד לכל Tenant
  private static queues: Map<string, QueuedMessage[]> = new Map()
  private static tenantOrder: string[] = []
  private static processing = false
  private static MESSAGES_PER_SECOND = 10

  static async add(tenantId: string, message: QueuedMessage): Promise<void> {
    // יצירת תור ל-tenant אם אין
    if (!this.queues.has(tenantId)) {
      this.queues.set(tenantId, [])
      this.tenantOrder.push(tenantId)
    }

    // הוספה לתור של ה-tenant
    this.queues.get(tenantId)!.push(message)

    if (!this.processing) {
      this.process()
    }
  }

  private static async process(): Promise<void> {
    this.processing = true

    while (this.hasMessages()) {
      const batch: QueuedMessage[] = []

      // 🔄 Round-Robin: לקחת הודעה מכל tenant בתור
      for (const tenantId of [...this.tenantOrder]) {
        const queue = this.queues.get(tenantId)
        if (queue && queue.length > 0) {
          batch.push(queue.shift()!)
          if (batch.length >= this.MESSAGES_PER_SECOND) break
        }
      }

      // ניקוי tenants ריקים
      this.cleanEmptyQueues()

      // שליחת ה-batch
      if (batch.length > 0) {
        await Promise.all(batch.map(m => this.sendOne(m)))
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

  private static async sendOne(message: QueuedMessage): Promise<void> {
    try {
      // קבלת הגדרות הספק של ה-Tenant
      const config = await remult.repo(ProviderConfig).findFirst({
        tenantId: message.tenantId,
        isActive: true,
        isDefault: true
      })

      if (!config) throw new Error('No provider config')

      const adapter = createProviderAdapter(
        config.providerType,
        config.instanceId,
        config.apiToken
      )

      const result = await adapter.sendText({
        mobile: message.mobile,
        text: message.text,
        replyToMessageId: message.replyToMessageId
      })

      await this.updateMessageStatus(message.id, result)
    } catch (error: any) {
      await this.updateMessageStatus(message.id, {
        success: false,
        error: error.message
      })
    }
  }

  // 📊 סטטיסטיקות לDashboard
  static getStats(): QueueStats {
    const stats: QueueStats = { totalPending: 0, perTenant: {} }
    for (const [tenantId, queue] of this.queues.entries()) {
      stats.perTenant[tenantId] = queue.length
      stats.totalPending += queue.length
    }
    return stats
  }
}

// דוגמה לזרימה:
// Tenant A: 10,000 הודעות, Tenant B: 10,000 הודעות
// Batch 1: A1, B1, A2, B2, A3, B3... (מתחלקים שווה!)
// Tenant C מגיע באמצע? נכנס מיד לrotation!
```

---

### 2. Webhook Acknowledge Pattern - לא חוסמים!
```typescript
// server/webhooks/greenapi.webhook.ts
import express from 'express'

export function setupWebhookRoutes(app: express.Application) {

  app.post('/webhook/greenapi', async (req, res) => {
    // 🚀 שלב 1: להגיב מיד! (תוך מילישניות)
    res.status(200).send('OK')

    // 🔄 שלב 2: עיבוד אסינכרוני (לא חוסם)
    setImmediate(async () => {
      try {
        await processGreenApiWebhook(req.body)
      } catch (error) {
        console.error('Webhook processing error:', error)
        // לא זורקים - כבר ענינו 200
      }
    })
  })
}

async function processGreenApiWebhook(body: any): Promise<void> {
  const { typeWebhook } = body

  if (typeWebhook === 'outgoingMessageStatus') {
    await handleOutgoingStatus(body)
  }

  if (typeWebhook === 'incomingMessageReceived') {
    await handleIncomingMessage(body)
  }
}
```

---

### 3. Timeout בכל קריאה חיצונית
```typescript
// shared/services/http.service.ts
export class HttpService {
  private static DEFAULT_TIMEOUT = 5000  // 5 שניות

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
}

// שימוש ב-WebhookService:
export class WebhookService {
  static async send(url: string, payload: any): Promise<WebhookResult> {
    return await HttpService.post(url, payload, 5000)  // timeout 5s
  }

  // Fire and Forget - לא מחכים
  static sendAsync(url: string, payload: any): void {
    this.send(url, payload).catch(err =>
      console.error('Webhook failed:', err)
    )
  }
}
```

---

### 4. Batching לשליחת Bulk
```typescript
// shared/controllers/MessagesController.ts
@BackendMethod({ allowed: true })
static async sendBulk(request: BulkSendRequest): Promise<BulkSendResponse> {
  const BATCH_SIZE = 100
  const { messages, tenantId } = request

  const batchId = generateUUID()
  let queued = 0

  // עיבוד ב-batches - לא טוענים הכל לזיכרון
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE)

    // יצירת רשומות ב-DB
    for (const msg of batch) {
      const messageRequest = remult.repo(MessageRequest).create()
      messageRequest.tenantId = tenantId
      messageRequest.batchId = batchId
      messageRequest.mobile = msg.mobile
      messageRequest.text = msg.text
      messageRequest.status = MessageStatus.queued
      await messageRequest.save()

      // הוספה לתור השליחה
      await MessageQueueService.add({
        id: messageRequest.id,
        mobile: msg.mobile,
        text: msg.text
      })

      queued++
    }
  }

  return {
    batchId,
    total: messages.length,
    queued
  }
}
```

---

### 5. SSE/LiveQuery - Best Practices
```typescript
// בקומפוננטה - תמיד לנקות subscription
export class DashboardComponent implements OnInit, OnDestroy {
  private subscription?: () => void

  ngOnInit() {
    this.subscription = remult.repo(MessageRequest)
      .liveQuery({
        where: { status: MessageStatus.pending },
        limit: 100  // 🔒 הגבלה! לא לטעון הכל
      })
      .subscribe(info => {
        this.messages = info.applyChanges(this.messages)
      })
  }

  ngOnDestroy() {
    // 🧹 ניקוי - חובה!
    this.subscription?.()
  }
}
```

---

### 6. Database - Status History כ-JSON
```typescript
// אופציה לעתיד - אם יש עומס על DB
@Entity<MessageRequest>('message-requests')
export class MessageRequest extends IdEntity {
  // ...

  // במקום הרבה updates - JSON field אחד
  @Fields.json()
  statusHistory: StatusEntry[] = []

  // מתודה להוספת סטטוס
  addStatus(status: MessageStatus) {
    this.statusHistory.push({
      status: status.id,
      at: new Date().toISOString()
    })
    this.status = status
  }
}

interface StatusEntry {
  status: string
  at: string
}
```

---

### סיכום - Checklist יציבות

| נושא | פתרון | סטטוס |
|------|--------|-------|
| Rate Limits | MessageQueueService + Throttle | 🔲 |
| Webhook חוסם | Acknowledge מיד + setImmediate | 🔲 |
| Callback איטי | HttpService + Timeout 5s | 🔲 |
| Callback לא קריטי | WebhookService.sendAsync (fire&forget) | 🔲 |
| Bulk Memory | Batching (100 per batch) | 🔲 |
| LiveQuery Cleanup | ngOnDestroy subscription | 🔲 |
| LiveQuery Limit | limit: 100 בכל query | 🔲 |

---

## 13. מודולריות ו-Best Practices (ראה גם סעיף 12)

### עקרונות ארכיטקטורה

#### 1. Separation of Concerns - הפרדת אחריות
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Entities  │  │ Controllers │  │  Services   │
│  (מה יש)    │  │ (לוגיקה)    │  │ (חיצוני)    │
└─────────────┘  └─────────────┘  └─────────────┘
       ↓                ↓                ↓
   Data Model     Business Logic   External APIs
```

#### 2. Single Responsibility - אחריות יחידה
| רכיב | אחריות אחת בלבד |
|------|-----------------|
| `MessagesController` | לוגיקת שליחה/קבלה |
| `TenantsController` | ניהול לקוחות |
| `WebhookService` | שליחת callbacks |
| `GreenApiService` | תקשורת עם Green-API |

#### 3. DRY - קוד פעם אחת
```typescript
// ❌ לא טוב - כפילות
await fetch(url1, { method: 'POST', body: JSON.stringify(data1) })
await fetch(url2, { method: 'POST', body: JSON.stringify(data2) })

// ✅ טוב - שירות משותף
await WebhookService.send(url1, data1)
await WebhookService.send(url2, data2)
```

#### 4. Consistent Patterns - דפוסים אחידים
```typescript
// כל Entity עם אותו מבנה:
@Entity<X>('x', { allowApiCrud: ... })
export class X extends IdEntity {
  // שדות עסקיים
  // ...

  // תמיד בסוף:
  @Fields.date({ allowApiUpdate: false })
  createDate = new Date()
}
```

### שירותים משותפים (Shared Services)

#### WebhookService - שליחת Callbacks
```typescript
// shared/services/webhook.service.ts
export class WebhookService {

  static async send(url: string, payload: any): Promise<WebhookResult> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      return {
        success: response.ok,
        statusCode: response.status,
        error: response.ok ? '' : await response.text()
      }
    } catch (error: any) {
      return {
        success: false,
        statusCode: 0,
        error: error.message
      }
    }
  }
}
```

**שימוש:**
```typescript
// בכל מקום שצריך לשלוח callback:
const result = await WebhookService.send(tenant.incomingWebhookUrl, {
  type: 'incoming',
  message: incomingMessage
})

incomingMessage.callbackSent = result.success
incomingMessage.callbackError = result.error
incomingMessage.callbackSentDate = new Date()
await incomingMessage.save()
```

#### RetryService - ניסיונות חוזרים (עתידי)
```typescript
// לטיפול ב-callbacks שנכשלו
export class RetryService {
  static async retryFailedCallbacks(): Promise<void> {
    const failed = await remult.repo(IncomingMessage).find({
      where: { callbackSent: false, callbackError: { $ne: '' } }
    })

    for (const msg of failed) {
      const tenant = await remult.repo(Tenant).findId(msg.tenantId)
      if (tenant?.incomingWebhookUrl) {
        const result = await WebhookService.send(...)
        // עדכון...
      }
    }
  }
}
```

### מבנה תיקיות - מודולרי
```
src/
├── shared/
│   ├── controllers/          # לוגיקה עסקית
│   ├── services/             # 🆕 שירותים משותפים
│   │   ├── webhook.service.ts
│   │   └── retry.service.ts
│   ├── entities/             # 🆕 base classes
│   │   └── base.entity.ts
│   ├── enums/
│   └── types/
```

### Base Entity (אופציונלי - לעתיד)
```typescript
// shared/entities/base.entity.ts
export abstract class BaseEntity extends IdEntity {
  @Fields.date({ allowApiUpdate: false })
  createDate = new Date()

  @Fields.date({ allowApiUpdate: false })
  updateDate = new Date()
}

// שימוש:
export class Tenant extends BaseEntity {
  // רק שדות ספציפיים
}
```

---

## 13. כללי עבודה (אקסיומות)

### איסורים
- [ ] לא למחוק שדות מישויות או קומפוננטות
- [ ] לא לבצע commit ללא אישור מפורש
- [ ] לא לבצע push ללא אישור מפורש
- [ ] לא standalone components
- [ ] רק `npm run build` (לא dev)

### עקרונות
- [x] **מודולריות! מודולריות! מודולריות!**
- [x] קוד פעם אחת - קל לתחזוק (DRY)
- [x] עבודה על קומפוננטה אחת עד לסיום
- [x] לוגיקה משותפת → שירות משותף (WebhookService, RetryService)
- [x] דפוסים אחידים בכל הקוד
- [x] הפרדת אחריות ברורה

### חתימת Commit
```
BizTechoff™ - התאמת העסק לעידן הדיגיטלי
```

---

## 14. שלבי מימוש

### שלב 1: תשתית
- [ ] מחיקת הקוד הקיים
- [ ] שדרוג גרסאות (Angular 19.0.0, Remult 3.3.6, Node 20)
- [ ] הגדרת מבנה תיקיות חדש
- [ ] יצירת Shared Services:
  - [ ] HttpService (timeout)
  - [ ] WebhookService
  - [ ] MessageQueueService (throttle)

### שלב 2: Core Entities
- [ ] Tenant entity + API key generation + canSend/canReceive
- [ ] ProviderConfig entity
- [ ] MessageRequest + MessageFile entities
- [ ] IncomingMessage entity
- [ ] כל ה-Enums

### שלב 3: Controllers + Delegate Pattern
- [ ] MessagesController - שליחה/קבלה
- [ ] TenantsController - ניהול לקוחות
- [ ] ProvidersController - הגדרות ספקים

### שלב 4: Green-API Integration
- [ ] server/providers/greenapi.adapter.ts
- [ ] sendText, sendFile (via IProviderAdapter)
- [ ] server/webhooks/greenapi.webhook.ts:
  - [ ] Acknowledge מיד (res.200)
  - [ ] עיבוד אסינכרוני (setImmediate)
- [ ] Callback to tenant (fire & forget)

### שלב 5: Admin UI
- [ ] Dashboard component + LiveQuery (SSE אוטומטי)
- [ ] Tenants list/details
- [ ] Messages list/details (יוצאות + נכנסות)
- [ ] Providers configuration

### שלב 6: Production
- [ ] Heroku deployment
- [ ] Environment variables
- [ ] Security hardening
- [ ] Monitoring & logging
- [ ] RetryService לcallbacks שנכשלו

---

## 15. Resources

### Green-API
- [SDK v2 Documentation](https://green-api.com/en/docs/sdk/nodejs/client-v2/)
- [GitHub Repository](https://github.com/green-api/whatsapp-api-client-js)
- [NPM Package](https://www.npmjs.com/package/@green-api/whatsapp-api-client)

### Remult
- [LiveQuery Documentation](https://remult.dev/tutorials/angular/live-queries)
- [LiveQuery Reference](https://remult.dev/docs/ref_livequery)

---

*נוצר על ידי שיטת דרוקמן*
*BizTechoff™ - התאמת העסק לעידן הדיגיטלי*
