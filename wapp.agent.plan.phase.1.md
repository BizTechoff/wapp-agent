# wapp.agent - תוכנית מערכת

## שיטת דרוקמן - ארכיטקטורת הפלטפורמה

---

## 1. הגדרות וסביבות

### טכנולוגיות הליבה
| טכנולוגיה | תפקיד |
|-----------|--------|
| **Angular** | Frontend - קומפוננטות, routing, UI |
| **Node.js + Express** | Backend - שרת HTTP |
| **Remult** | ORM + RPC + Auth + Session - **מנהל הכל** |
| **TypeScript** | Type Safety בכל השכבות |
| **PostgreSQL** | בסיס נתונים |

### Remult - הלב של המערכת
Remult מנהל **הכל** - אנחנו מתמקדים רק בלוגיקה עסקית:
- ORM ומיפוי ישויות ל-DB
- RPC אוטומטי (@BackendMethod)
- הרשאות (allowed: Roles.admin)
- סשן ו-Login/Logout
- שחזור משתמש בעליית מערכת
- Type Safety בין קליינט לשרת

```typescript
// גישה למשתמש הנוכחי בכל מקום:
remult.user?.id
remult.user?.name
remult.user?.roles

// בדיקת הרשאה:
if (remult.user?.roles?.includes(Roles.admin)) { ... }
```

---

## 2. מבנה תיקיות

```
src/
├── app/                              # Angular Frontend
│   ├── [entity]/                     # תיקייה לכל ישות
│   │   ├── [entity].ts               # הגדרת Entity (Remult)
│   │   ├── [entity].service.ts       # Service - facade לcontroller
│   │   ├── [entity]-list/            # קומפוננטת רשימה
│   │   ├── [entity]-details/         # קומפוננטת עריכה/יצירה (Dialog)
│   │   ├── [entity]-selection/       # קומפוננטת בחירה מרובה (Dialog)
│   │   └── [entity]-selection-field/ # שדה בחירה בטופס
│   │
│   ├── common/                       # תשתית UI משותפת
│   │   ├── components/
│   │   │   └── base-table/           # טבלה גנרית
│   │   ├── UIToolsService.ts         # פתיחת דיאלוגים
│   │   └── busyService.ts
│   │
│   ├── users/                        # ניהול משתמשים
│   ├── terms.ts                      # תרגומים/כותרות
│   ├── app.module.ts
│   └── app-routing.module.ts
│
├── shared/                           # משותף לקליינט ושרת
│   ├── controllers/                  # לוגיקה עסקית (@BackendMethod)
│   │   └── [Entity]Controller.ts
│   ├── enums/                        # @ValueListFieldType
│   │   └── [EnumName].ts
│   └── types/                        # Request/Response interfaces
│       └── [feature].type.ts
│
└── server/                           # Node.js Backend בלבד
    ├── index.ts                      # Server startup
    ├── api.ts                        # Remult configuration
    ├── seed.ts                       # נתוני בדיקה
    └── [service].ts                  # Delegate implementations
        ├── email.ts
        ├── geo.ts
        ├── s3.ts
        └── heb-cal.ts
```

---

## 3. זרימת נתונים

### תרשים זרימה ראשי
```
┌─────────────────────────────────────────────────────────────┐
│  ANGULAR CLIENT                                             │
│                                                             │
│  Component (UI)                                             │
│      ↓                                                      │
│  Service.method() ─── facade בלבד, אין לוגיקה              │
│      ↓                                                      │
│  Controller.staticMethod() ─── @BackendMethod               │
│      ↓                                                      │
│  [Remult: Serialize → HTTP POST → /api]                     │
└─────────────────────────────────────────────────────────────┘
                          ↓ NETWORK
┌─────────────────────────────────────────────────────────────┐
│  NODE.JS SERVER                                             │
│                                                             │
│  api.ts: remultApi({ controllers, entities, getUser })      │
│      ↓                                                      │
│  Controller.staticMethod() ─── רץ בשרת                      │
│      ↓                                                      │
│  remult.repo(Entity).find/save/delete                       │
│      ↓                                                      │
│  PostgreSQL                                                 │
│      ↓                                                      │
│  [Response typed חוזר לקליינט]                              │
└─────────────────────────────────────────────────────────────┘
```

### שמירת נתונים
```typescript
// צד קליינט - תמיד דרך repo:
await remult.repo(Entity).save(record)

// צד שרת - אפשר ישירות:
await record.save()
```

---

## 4. Delegate Pattern - קריאות חיצוניות

כאשר Controller צריך לקרוא לשירות חיצוני (email, S3, geo):

### שלב 1: הגדרת Delegate בקונטרולר
```typescript
// shared/controllers/EmailController.ts
export class EmailController {

  // הגדרת חתימת הDelegate
  static sendEmailDelegate: (req: EmailRequest) => Promise<EmailResponse>

  @BackendMethod({ allowed: Allow.authenticated })
  static async sendEmail(req: EmailRequest): Promise<EmailResponse> {
    // קריאה לdelegate - המימוש בserver/email.ts
    return await EmailController.sendEmailDelegate(req)
  }
}
```

### שלב 2: מימוש ורישום בשרת
```typescript
// server/email.ts
import { EmailController } from '../shared/controllers/EmailController'

// רישום המימוש - קורה בעליית השרת
EmailController.sendEmailDelegate = async (req: EmailRequest) => {
  return await doSendEmail(req)
}
console.info('sendEmailDelegate successfully registered.')

// המימוש עצמו
async function doSendEmail(req: EmailRequest): Promise<EmailResponse> {
  // nodemailer, API call, etc.
}
```

### למה Delegate?
- Controller נשאר ב-`/shared` (משותף לקליינט ושרת)
- המימוש החיצוני נשאר רק בשרת (`/server`)
- הפרדה נקייה בין לוגיקה לאינטגרציות

---

## 5. מבנה קומפוננטות (h-c-f)

### Header-Content-Footer Layout
```
┌─────────────────────────────────────┐
│ HEADER (sticky top)                 │ ← כותרת + כפתור הוספה + פילטרים
├─────────────────────────────────────┤
│ CONTENT                             │
│ ┌─────────────────────────────────┐ │
│ │ Table Header (sticky)           │ │ ← כותרות עמודות
│ ├─────────────────────────────────┤ │
│ │ ↕                               │ │
│ │ Scrollable Rows                 │ │ ← הרשומות (נגלל)
│ │ ↕                               │ │
│ ├─────────────────────────────────┤ │
│ │ Table Footer (sticky)           │ │ ← Pagination
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ FOOTER (sticky bottom)              │ ← לעתיד
└─────────────────────────────────────┘
```

### סוגי קומפוננטות לכל Entity
| קומפוננטה | תפקיד |
|-----------|--------|
| `[entity]-list` | תצוגת רשימה, פילטור, מיון, pagination |
| `[entity]-details` | Dialog ליצירה/עריכה |
| `[entity]-selection` | Dialog לבחירה מרובה |
| `[entity]-selection-field` | שדה בחירה בתוך טופס |

---

## 6. הגדרת Entity

```typescript
// app/[entity]/[entity].ts
import { Entity, Fields, IdEntity, Relations, Validators } from 'remult'
import { terms } from '../terms'

@Entity<MyEntity>('my-entities', {
  allowApiCrud: true,
  defaultOrderBy: { createDate: 'desc' }
})
export class MyEntity extends IdEntity {

  @Fields.string({
    validate: [Validators.required(terms.requiredField)],
    caption: terms.name
  })
  name = ''

  // Foreign Key pattern
  @Fields.string({ caption: terms.parentId })
  parentId = ''

  @Relations.toOne(() => Parent, { caption: terms.parentId })
  parent!: Parent

  @Fields.object({ caption: terms.status })
  status = MyStatus.active

  @Fields.date({ allowApiUpdate: false, caption: terms.createDate })
  createDate = new Date()
}
```

---

## 7. הגדרת Enum

```typescript
// shared/enums/MyStatus.ts
import { ValueListFieldType } from 'remult'

@ValueListFieldType()
export class MyStatus {
  static active = new MyStatus('active', 'פעיל')
  static inactive = new MyStatus('inactive', 'לא פעיל')
  static pending = new MyStatus('pending', 'ממתין')

  constructor(public id: string, public caption: string) {}
}
```

---

## 8. Controller עם @BackendMethod

```typescript
// shared/controllers/MyEntityController.ts
import { BackendMethod, Controller, remult } from 'remult'
import { MyEntity } from '../../app/my-entity/my-entity'

@Controller('my-entities')
export class MyEntityController {

  @BackendMethod({ allowed: true })
  static async getItems(request: GetItemsRequest): Promise<GetItemsResponse> {
    const { filter, page = 1, pageSize = 30 } = request

    const where: any = {}
    if (filter) {
      where.name = { $contains: filter }
    }

    const items = await remult.repo(MyEntity).find({
      where,
      page,
      limit: pageSize
    })

    const totalRecords = await remult.repo(MyEntity).count(where)

    return { items, totalRecords }
  }

  @BackendMethod({ allowed: Roles.admin })
  static async deleteItem(id: string): Promise<void> {
    await remult.repo(MyEntity).delete(id)
  }
}
```

---

## 9. Service (Facade)

```typescript
// app/[entity]/[entity].service.ts
import { Injectable } from '@angular/core'
import { MyEntityController } from '../../shared/controllers/MyEntityController'

@Injectable({ providedIn: 'root' })
export class MyEntityService {

  // Service = facade בלבד, אין לוגיקה
  async getItems(request: GetItemsRequest): Promise<GetItemsResponse> {
    return await MyEntityController.getItems(request)
  }

  async deleteItem(id: string): Promise<void> {
    return await MyEntityController.deleteItem(id)
  }
}
```

---

## 10. כללי עבודה (אקסיומות)

### איסורים
- [ ] לא למחוק שדות מישויות או קומפוננטות
- [ ] לא לבצע commit ללא אישור מפורש
- [ ] לא לבצע push ללא אישור מפורש
- [ ] לא standalone components
- [ ] רק `npm run build` (לא dev)

### עקרונות
- [x] מודולריות! מודולריות! מודולריות!
- [x] קוד פעם אחת - קל לתחזוק
- [x] עבודה על קומפוננטה אחת עד לסיום
- [x] לוגיקה משותפת → קומפוננטה משותפת
- [x] שדות משותפים → שכפול בכל קומפוננטה

### חתימת Commit
```
BizTechoff™ - התאמת העסק לעידן הדיגיטלי
```

---

## 11. סיכום - מה Remult מנהל

| תחום | Remult מטפל | אנחנו מטפלים |
|------|-------------|--------------|
| DB Access | ✅ ORM, Queries | - |
| API | ✅ RPC אוטומטי | - |
| Auth | ✅ Login, Session, Roles | הגדרת Roles |
| Validation | ✅ Validators | הגדרת כללים |
| Type Safety | ✅ קליינט ↔ שרת | - |
| Business Logic | - | ✅ Controllers |
| UI | - | ✅ Components |
| External Services | - | ✅ Delegates |

---

## 12. תוכנית להמשך

> **למלא לאחר דיון עם הלקוח**

### שדרוג גרסאות
- Node.js: ?
- Angular: ?
- Remult: ?
- TypeScript: ?

### ישויות חדשות
- [ ] ...

### ישויות להסרה
- [ ] ...

### פיצ'רים חדשים
- [ ] ...

---

*נוצר על ידי שיטת דרוקמן*
