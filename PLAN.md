# Kids & Fun Platform - Implementation Plan

## Summary
Building an ERP platform for Kids & Fun - managing Afterschool Programs (60%), Camps (30%), and Events (10%).
Existing Project entity stays as reference. We build new entities alongside it.

---

## Phase 1 - Core Foundation + Branch (First Entity)

### Step 1.1 - Update Roles
**Modify:** `src/app/users/roles.ts`
- Add `branchManager: 'branchManager'` (branch manager)
- Add `instructor: 'instructor'` (instructor)

**Modify:** `src/app/users/authGuard.ts`
- Add `BranchManagerGuard extends AuthenticatedGuard`
- Add `InstructorGuard extends AuthenticatedGuard`

### Step 1.2 - Update Terms
**Modify:** `src/app/terms.ts`
- Replace buildings/apartments/tenants terms with Kids & Fun terms
- Add Branch terms: branches, branch, branchName, branchAddress, branchCity, branchPhone, branchContactPerson, addBranch
- Add Contact terms: contacts, contact, contactFirstName, contactLastName, contactPhone, contactEmail, contactType, contactAddress, addContact
- Add Child terms: children, child, childFirstName, childLastName, childBirthDate, childGender, childSchool, childGrade, addChild
- Add Employee terms: employees, employee, employeeFirstName, employeeLastName, employeePhone, employeeRole, addEmployee
- Add Afternoon terms: afternoons, afternoon, afternoonName, schoolYear, addAfternoon
- Add Camp terms: camps, camp, campName, campType, campStartDate, campEndDate, addCamp
- Add Event terms: events, event, eventDate, eventType, addEvent
- Add shared terms: active, inactive, status, phone, email, address, city, search, filter, total, payment, amount, etc.

### Step 1.3 - Branch Entity (Full Flow)

**Branch Entity Fields:**
- name (string, required) - branch name
- address (string) - address
- city (string) - city
- phone (string) - phone number
- contactPerson (string) - contact person name
- isActive (boolean, default true) - active status
- createDate (date, auto) - creation date

**Files to CREATE (following Project pattern exactly):**

| # | File | Purpose |
|---|------|---------|
| 1 | `src/app/branches/branch.ts` | Entity definition (extends IdEntity) |
| 2 | `src/shared/controllers/BranchesController.ts` | Controller (extends ControllerBase) with getList, create, update, delete |
| 3 | `src/app/branches/branches.service.ts` | Service (Injectable, calls controller) |
| 4 | `src/app/branches/branch-list/branch-list.component.ts` | List component (like ProjectListComponent) |
| 5 | `src/app/branches/branch-list/branch-list.component.html` | List template (uses app-base-table) |
| 6 | `src/app/branches/branch-list/branch-list.component.scss` | List styles (like project-list) |
| 7 | `src/app/branches/branch-details/branch-details.component.ts` | Details modal (like ProjectDetailsComponent) |
| 8 | `src/app/branches/branch-details/branch-details.component.html` | Details template (uses app-base-input-field) |
| 9 | `src/app/branches/branch-details/branch-details.component.scss` | Details styles (like project-details) |
| 10 | `src/app/branches/branch-selection/branch-selection.component.ts` | Selection modal |
| 11 | `src/app/branches/branch-selection/branch-selection.component.html` | Selection template |
| 12 | `src/app/branches/branch-selection/branch-selection.component.scss` | Selection styles |
| 13 | `src/app/branches/branch-selection-field/branch-selection-field.component.ts` | Selection field (ControlValueAccessor) |
| 14 | `src/app/branches/branch-selection-field/branch-selection-field.component.html` | Selection field template |
| 15 | `src/app/branches/branch-selection-field/branch-selection-field.component.scss` | Selection field styles |

**Files to MODIFY:**

| # | File | Change |
|---|------|--------|
| 1 | `src/app/app.module.ts` | Register all 5 Branch components in declarations |
| 2 | `src/app/app-routing.module.ts` | Add 'branches' route with AuthenticatedGuard |
| 3 | `src/server/api.ts` | Add Branch to entities, BranchesController to controllers |
| 4 | `src/app/common/UIToolsService.ts` | Add openBranchDetails(), openBranchSelection() |

---

## Phase 2 - Core Entities (Contact, Child, Employee)

### Step 2.1 - Contact Entity (Parents/Business Clients)

**Contact Entity Fields:**
- firstName (string, required)
- lastName (string, required)
- phone (string, required)
- email (string)
- additionalPhone (string)
- address (string)
- city (string)
- contactType (enum: parent, business) - ValueListFieldType
- idNumber (string) - Teudat Zehut
- notes (string)
- isActive (boolean, default true)
- createDate (date, auto)

**Same file structure as Branch:** 15 files + 4 modifications
**Enum:** `src/shared/enums/ContactType.ts` (@ValueListFieldType)

### Step 2.2 - Child Entity

**Child Entity Fields:**
- firstName (string, required)
- lastName (string, required)
- birthDate (date)
- gender (enum: male, female)
- contactId (string, FK to Contact - parent)
- secondaryContactId (string, FK to Contact - second parent)
- school (string)
- grade (string)
- isActive (boolean, default true)
- notes (string)
- createDate (date, auto)

**Same file structure:** 15 files + 4 modifications
**Enum:** `src/shared/enums/Gender.ts`

### Step 2.3 - Employee Entity

**Employee Entity Fields:**
- firstName (string, required)
- lastName (string, required)
- phone (string, required)
- email (string)
- idNumber (string)
- branchId (string, FK to Branch)
- employeeRole (enum: instructor, coordinator, assistant)
- isActive (boolean, default true)
- notes (string)
- createDate (date, auto)

**Same file structure:** 15 files + 4 modifications
**Enum:** `src/shared/enums/EmployeeRole.ts`

---

## Phase 3 - Afternoon Module (60% of business - highest priority)

### Step 3.1 - Afternoon Entity (Afternoon Framework)
Fields: name, branchId (FK), schoolYear, startDate, endDate, monthlyPrice, isActive, createDate

### Step 3.2 - AfternoonGroup Entity
Fields: name, afternoonId (FK), ageFrom, ageTo, maxChildren, employeeId (FK - instructor), isActive

### Step 3.3 - AfternoonChild Entity (Registration)
Fields: childId (FK), afternoonGroupId (FK), startDate, endDate, registrationStatus (enum), notes

### Step 3.4 - Attendance Entity
Fields: afternoonChildId (FK), date, checkIn (time), checkOut (time), status (enum: present, absent, late), notes

### Step 3.5 - MonthlyCharge Entity
Fields: contactId (FK), afternoonChildId (FK), month, year, amount, status (enum: pending, paid, partial, overdue), paidAmount, notes

---

## Phase 4 - Camp Module (30%)

### Step 4.1 - Camp Entity
Fields: name, campType (enum: summer, passover, hanukkah), branchId (FK), startDate, endDate, isActive

### Step 4.2 - CampCycle Entity (Week/Cycle)
Fields: campId (FK), name, startDate, endDate, price, maxChildren

### Step 4.3 - CampGroup Entity
Fields: campCycleId (FK), name, ageFrom, ageTo, maxChildren, employeeId (FK)

### Step 4.4 - CampRegistration Entity
Fields: childId (FK), campCycleId (FK), campGroupId (FK), paymentStatus (enum), registrationDate, notes

### Step 4.5 - CampActivity Entity
Fields: campGroupId (FK), date, description, activityType, notes

---

## Phase 5 - Events Module (10%)

### Step 5.1 - EventType Entity
Fields: name, description, isActive

### Step 5.2 - EventPackage Entity
Fields: eventTypeId (FK), name, description, price, includes (what the package includes)

### Step 5.3 - Event Entity
Fields: contactId (FK), eventTypeId (FK), eventPackageId (FK), eventDate, location, participantCount, status (enum), totalPrice, notes

### Step 5.4 - EventStaff Entity
Fields: eventId (FK), employeeId (FK), role, notes

### Step 5.5 - EventEquipment Entity
Fields: eventId (FK), itemName, quantity, notes

---

## Phase 6 - Shared/Cross-cutting Entities

### Step 6.1 - MedicalInfo Entity
Fields: childId (FK), allergies, medications, conditions, dietaryRestrictions, notes

### Step 6.2 - EmergencyContact Entity
Fields: childId (FK), name, phone, relationship, priority

### Step 6.3 - Payment Entity
Fields: contactId (FK), amount, paymentDate, paymentMethod (enum), referenceNumber, relatedEntityType, relatedEntityId, notes

### Step 6.4 - Note Entity
Fields: relatedEntityType, relatedEntityId, text, createdBy, createDate

### Step 6.5 - Message Entity
Fields: contactId (FK), messageType (enum: SMS, WhatsApp, Email), content, status (enum: sent, failed, pending), sentDate

### Step 6.6 - Document Entity
Fields: relatedEntityType, relatedEntityId, fileName, fileUrl, fileType, uploadDate

---

## Implementation Pattern (for each entity):

```
1. Entity file:        src/app/[module]/[entity].ts
2. Controller:         src/shared/controllers/[Entity]Controller.ts
3. Service:            src/app/[module]/[entities].service.ts
4. List component:     src/app/[module]/[entity]-list/
5. Details modal:      src/app/[module]/[entity]-details/
6. Selection modal:    src/app/[module]/[entity]-selection/ (if needed as FK)
7. Selection field:    src/app/[module]/[entity]-selection-field/ (if needed as FK)
8. Enums:              src/shared/enums/[EnumName].ts (if needed)
9. Register:           app.module.ts, app-routing.module.ts, api.ts, UIToolsService.ts
```

---

## Execution: Starting with Phase 1 (Branch)
After approval, we build Branch entity with ALL its components, register it everywhere, verify with `npm run build`, and move to the next entity.
