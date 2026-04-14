import { remult } from 'remult'
import { User } from '../app/users/user'
import { Branch } from '../app/branches/branch'
import { Contact } from '../app/contacts/contact'
import { Child } from '../app/children/child'
import { Employee } from '../app/employees/employee'
import { Afternoon } from '../app/afternoons/afternoon'
import { AfternoonGroup } from '../app/afternoon-groups/afternoon-group'
import { AfternoonChild } from '../app/afternoon-children/afternoon-child'
import { Attendance } from '../app/attendances/attendance'
import { MonthlyCharge } from '../app/monthly-charges/monthly-charge'
import { Camp } from '../app/camps/camp'
import { CampCycle } from '../app/camp-cycles/camp-cycle'
import { CampGroup } from '../app/camp-groups/camp-group'
import { CampRegistration } from '../app/camp-registrations/camp-registration'
import { CampActivity } from '../app/camp-activities/camp-activity'
import { EventType } from '../app/event-types/event-type'
import { EventPackage } from '../app/event-packages/event-package'
import { Event } from '../app/events/event'
import { EventStaff } from '../app/event-staff/event-staff'
import { EventEquipment } from '../app/event-equipment/event-equipment'
import { MedicalInfo } from '../app/medical-infos/medical-info'
import { EmergencyContact } from '../app/emergency-contacts/emergency-contact'
import { Payment } from '../app/payments/payment'
import { Message } from '../app/messages/message'
import { Note } from '../app/notes/note'
import { Document } from '../app/documents/document'
import { School } from '../app/schools/school'
import { ContactType } from '../shared/enums/ContactType'
import { Gender } from '../shared/enums/Gender'
import { EmployeeRole } from '../shared/enums/EmployeeRole'
import { RegistrationStatus } from '../shared/enums/RegistrationStatus'
import { AttendanceStatus } from '../shared/enums/AttendanceStatus'
import { ChargeStatus } from '../shared/enums/ChargeStatus'
import { CampType } from '../shared/enums/CampType'
import { EventStatus } from '../shared/enums/EventStatus'
import { PaymentMethod } from '../shared/enums/PaymentMethod'
import { MessageType } from '../shared/enums/MessageType'
import { MessageStatus } from '../shared/enums/MessageStatus'

// ===== Fixed Seed IDs =====
// Using deterministic IDs so each section can run independently
// and FK references always resolve correctly.

const ID = {
  branches: {
    tlv: '10000000-0000-0000-0000-000000000001',
    jlm: '10000000-0000-0000-0000-000000000002',
    haifa: '10000000-0000-0000-0000-000000000003',
  },
  schools: {
    gordon: '20000000-0000-0000-0000-000000000001',
    sunshine: '20000000-0000-0000-0000-000000000002',
    carmel: '20000000-0000-0000-0000-000000000003',
    nitzanim: '20000000-0000-0000-0000-000000000004',
    alon: '20000000-0000-0000-0000-000000000005',
    moriah: '20000000-0000-0000-0000-000000000006',
  },
  contacts: {
    parent1: '30000000-0000-0000-0000-000000000001',
    parent2: '30000000-0000-0000-0000-000000000002',
    parent3: '30000000-0000-0000-0000-000000000003',
    parent4: '30000000-0000-0000-0000-000000000004',
    parent5: '30000000-0000-0000-0000-000000000005',
    parent6: '30000000-0000-0000-0000-000000000006',
    parent7: '30000000-0000-0000-0000-000000000007',
    biz1: '30000000-0000-0000-0000-000000000008',
    biz2: '30000000-0000-0000-0000-000000000009',
  },
  children: {
    child1: '40000000-0000-0000-0000-000000000001',
    child2: '40000000-0000-0000-0000-000000000002',
    child3: '40000000-0000-0000-0000-000000000003',
    child4: '40000000-0000-0000-0000-000000000004',
    child5: '40000000-0000-0000-0000-000000000005',
    child6: '40000000-0000-0000-0000-000000000006',
    child7: '40000000-0000-0000-0000-000000000007',
    child8: '40000000-0000-0000-0000-000000000008',
    child9: '40000000-0000-0000-0000-000000000009',
    child10: '40000000-0000-0000-0000-000000000010',
    child11: '40000000-0000-0000-0000-000000000011',
    child12: '40000000-0000-0000-0000-000000000012',
  },
  employees: {
    emp1: '50000000-0000-0000-0000-000000000001',
    emp2: '50000000-0000-0000-0000-000000000002',
    emp3: '50000000-0000-0000-0000-000000000003',
    emp4: '50000000-0000-0000-0000-000000000004',
    emp5: '50000000-0000-0000-0000-000000000005',
    emp6: '50000000-0000-0000-0000-000000000006',
    emp7: '50000000-0000-0000-0000-000000000007',
    emp8: '50000000-0000-0000-0000-000000000008',
  },
  afternoons: {
    tlv: '60000000-0000-0000-0000-000000000001',
    jlm: '60000000-0000-0000-0000-000000000002',
    haifa: '60000000-0000-0000-0000-000000000003',
  },
  afternoonGroups: {
    grp1: '61000000-0000-0000-0000-000000000001',
    grp2: '61000000-0000-0000-0000-000000000002',
    grp3: '61000000-0000-0000-0000-000000000003',
    grp4: '61000000-0000-0000-0000-000000000004',
    grp5: '61000000-0000-0000-0000-000000000005',
  },
  afternoonChildren: {
    ac1: '62000000-0000-0000-0000-000000000001',
    ac2: '62000000-0000-0000-0000-000000000002',
    ac3: '62000000-0000-0000-0000-000000000003',
    ac4: '62000000-0000-0000-0000-000000000004',
    ac5: '62000000-0000-0000-0000-000000000005',
    ac6: '62000000-0000-0000-0000-000000000006',
    ac7: '62000000-0000-0000-0000-000000000007',
    ac8: '62000000-0000-0000-0000-000000000008',
    ac9: '62000000-0000-0000-0000-000000000009',
    ac10: '62000000-0000-0000-0000-000000000010',
  },
  camps: {
    summer: '70000000-0000-0000-0000-000000000001',
    passover: '70000000-0000-0000-0000-000000000002',
    hanukkah: '70000000-0000-0000-0000-000000000003',
  },
  campCycles: {
    summer1: '71000000-0000-0000-0000-000000000001',
    summer2: '71000000-0000-0000-0000-000000000002',
    passover: '71000000-0000-0000-0000-000000000003',
    hanukkah: '71000000-0000-0000-0000-000000000004',
  },
  campGroups: {
    cg1: '72000000-0000-0000-0000-000000000001',
    cg2: '72000000-0000-0000-0000-000000000002',
    cg3: '72000000-0000-0000-0000-000000000003',
    cg4: '72000000-0000-0000-0000-000000000004',
    cg5: '72000000-0000-0000-0000-000000000005',
  },
  eventTypes: {
    birthday: '80000000-0000-0000-0000-000000000001',
    team: '80000000-0000-0000-0000-000000000002',
    school: '80000000-0000-0000-0000-000000000003',
    private: '80000000-0000-0000-0000-000000000004',
  },
  eventPackages: {
    basic: '81000000-0000-0000-0000-000000000001',
    premium: '81000000-0000-0000-0000-000000000002',
    teamSmall: '81000000-0000-0000-0000-000000000003',
    teamLarge: '81000000-0000-0000-0000-000000000004',
    school: '81000000-0000-0000-0000-000000000005',
  },
  events: {
    evt1: '82000000-0000-0000-0000-000000000001',
    evt2: '82000000-0000-0000-0000-000000000002',
    evt3: '82000000-0000-0000-0000-000000000003',
    evt4: '82000000-0000-0000-0000-000000000004',
    evt5: '82000000-0000-0000-0000-000000000005',
  },
  monthlyCharges: {
    mc1: '90000000-0000-0000-0000-000000000001',
    mc2: '90000000-0000-0000-0000-000000000002',
    mc3: '90000000-0000-0000-0000-000000000003',
    mc4: '90000000-0000-0000-0000-000000000004',
    mc5: '90000000-0000-0000-0000-000000000005',
    mc6: '90000000-0000-0000-0000-000000000006',
    mc7: '90000000-0000-0000-0000-000000000007',
    mc8: '90000000-0000-0000-0000-000000000008',
    mc9: '90000000-0000-0000-0000-000000000009',
    mc10: '90000000-0000-0000-0000-000000000010',
    mc11: '90000000-0000-0000-0000-000000000011',
    mc12: '90000000-0000-0000-0000-000000000012',
    mc13: '90000000-0000-0000-0000-000000000013',
    mc14: '90000000-0000-0000-0000-000000000014',
  },
  campRegistrations: {
    cr1: '91000000-0000-0000-0000-000000000001',
    cr2: '91000000-0000-0000-0000-000000000002',
    cr3: '91000000-0000-0000-0000-000000000003',
    cr4: '91000000-0000-0000-0000-000000000004',
    cr5: '91000000-0000-0000-0000-000000000005',
    cr6: '91000000-0000-0000-0000-000000000006',
    cr7: '91000000-0000-0000-0000-000000000007',
    cr8: '91000000-0000-0000-0000-000000000008',
    cr9: '91000000-0000-0000-0000-000000000009',
    cr10: '91000000-0000-0000-0000-000000000010',
  },
  payments: {
    pay1: '92000000-0000-0000-0000-000000000001',
    pay2: '92000000-0000-0000-0000-000000000002',
    pay3: '92000000-0000-0000-0000-000000000003',
    pay4: '92000000-0000-0000-0000-000000000004',
    pay5: '92000000-0000-0000-0000-000000000005',
    pay6: '92000000-0000-0000-0000-000000000006',
    pay7: '92000000-0000-0000-0000-000000000007',
    pay8: '92000000-0000-0000-0000-000000000008',
    pay9: '92000000-0000-0000-0000-000000000009',
    pay10: '92000000-0000-0000-0000-000000000010',
    pay11: '92000000-0000-0000-0000-000000000011',
    pay12: '92000000-0000-0000-0000-000000000012',
    pay13: '92000000-0000-0000-0000-000000000013',
    pay14: '92000000-0000-0000-0000-000000000014',
  },
}

export async function seed() {
  console.log('[Seed] Starting database seed...')

  // === 1. Users ===
  if (await remult.repo(User).count() === 0) {
    console.log('[Seed] Creating users...')
    const admin = remult.repo(User).create()
    admin.name = 'admin'
    admin.admin = true
    admin.manager = true
    await admin.hashAndSetPassword('admin')
    await admin.save()

    const managerUser = remult.repo(User).create()
    managerUser.name = 'manager'
    managerUser.admin = false
    managerUser.manager = true
    await managerUser.hashAndSetPassword('manager')
    await managerUser.save()
  } else {
    console.log('[Seed] Users already exist, skipping.')
  }

  // === 2. Branches ===
  if (await remult.repo(Branch).count() === 0) {
    console.log('[Seed] Creating branches...')
    await remult.repo(Branch).insert([
      { id: ID.branches.tlv, name: 'סניף תל אביב', address: 'רחוב דיזנגוף 99', city: 'תל אביב', phone: '03-5551234', contactPerson: 'רונית לוי', isActive: true },
      { id: ID.branches.jlm, name: 'סניף ירושלים', address: 'רחוב יפו 45', city: 'ירושלים', phone: '02-5559876', contactPerson: 'משה כהן', isActive: true },
      { id: ID.branches.haifa, name: 'סניף חיפה', address: 'שדרות המגינים 12', city: 'חיפה', phone: '04-5554321', contactPerson: 'דנה אברהם', isActive: true },
    ])
  } else {
    console.log('[Seed] Branches already exist, skipping.')
  }

  // === 3. Schools ===
  if (await remult.repo(School).count() === 0) {
    console.log('[Seed] Creating schools...')
    await remult.repo(School).insert([
      { id: ID.schools.gordon, name: 'בית ספר גורדון', address: 'רחוב גורדון 55', city: 'תל אביב', isActive: true },
      { id: ID.schools.sunshine, name: 'גן ילדים שמש', address: 'רחוב סוקולוב 12', city: 'תל אביב', isActive: true },
      { id: ID.schools.carmel, name: 'בית ספר הכרמל', address: 'רחוב הנשיא 20', city: 'חיפה', isActive: true },
      { id: ID.schools.nitzanim, name: 'בית ספר ניצנים', address: 'רחוב רבי עקיבא 14', city: 'ירושלים', isActive: true },
      { id: ID.schools.alon, name: 'בית ספר אלון', address: 'שדרות רוטשילד 30', city: 'תל אביב', isActive: true },
      { id: ID.schools.moriah, name: 'בית ספר מוריה', address: "רחוב קינג ג'ורג' 8", city: 'ירושלים', isActive: true },
    ])
  } else {
    console.log('[Seed] Schools already exist, skipping.')
  }

  // === 4. Contacts ===
  if (await remult.repo(Contact).count() === 0) {
    console.log('[Seed] Creating contacts...')
    await remult.repo(Contact).insert([
      { id: ID.contacts.parent1, firstName: 'יוסי', lastName: 'כהן', phone: '050-1111111', email: 'yossi@example.com', address: 'רחוב הרצל 10', city: 'תל אביב', contactType: ContactType.parent, idNumber: '012345678', isActive: true },
      { id: ID.contacts.parent2, firstName: 'מירב', lastName: 'לוי', phone: '050-2222222', email: 'merav@example.com', address: 'רחוב בן גוריון 22', city: 'תל אביב', contactType: ContactType.parent, idNumber: '023456789', isActive: true },
      { id: ID.contacts.parent3, firstName: 'דוד', lastName: 'ישראלי', phone: '050-3333333', email: 'david@example.com', address: 'רחוב החלוצים 5', city: 'חיפה', contactType: ContactType.parent, idNumber: '034567890', isActive: true },
      { id: ID.contacts.parent4, firstName: 'שרה', lastName: 'מזרחי', phone: '050-4444444', email: 'sara@example.com', address: 'רחוב עגנון 8', city: 'ירושלים', contactType: ContactType.parent, idNumber: '045678901', isActive: true },
      { id: ID.contacts.parent5, firstName: 'אברהם', lastName: 'פרידמן', phone: '050-5555555', email: 'avraham@example.com', address: 'רחוב ביאליק 15', city: 'תל אביב', contactType: ContactType.parent, idNumber: '056789012', isActive: true },
      { id: ID.contacts.parent6, firstName: 'רחל', lastName: 'אדלר', phone: '050-6666666', email: 'rachel@example.com', address: 'רחוב הנביאים 30', city: 'ירושלים', contactType: ContactType.parent, idNumber: '067890123', isActive: true },
      { id: ID.contacts.parent7, firstName: 'עמוס', lastName: 'שלום', phone: '050-7777777', email: 'amos@example.com', address: 'רחוב הגפן 7', city: 'חיפה', contactType: ContactType.parent, idNumber: '078901234', isActive: true },
      { id: ID.contacts.biz1, firstName: 'נועה', lastName: 'ברק', phone: '050-8888888', email: 'noa@company.com', address: 'רחוב הברזל 3', city: 'תל אביב', contactType: ContactType.business, idNumber: '089012345', notes: 'לקוחה עסקית - חברת הייטק', isActive: true },
      { id: ID.contacts.biz2, firstName: 'גיא', lastName: 'רוזנברג', phone: '050-9999999', email: 'guy@org.com', address: 'רחוב ויצמן 18', city: 'תל אביב', contactType: ContactType.business, idNumber: '090123456', notes: 'ארגון קהילתי', isActive: true },
    ])
  } else {
    console.log('[Seed] Contacts already exist, skipping.')
  }

  // === 5. Children ===
  if (await remult.repo(Child).count() === 0) {
    console.log('[Seed] Creating children...')
    await remult.repo(Child).insert([
      { id: ID.children.child1, firstName: 'אורי', lastName: 'כהן', birthDate: new Date(2017, 2, 15), gender: Gender.male, contactId: ID.contacts.parent1, secondaryContactId: ID.contacts.parent2, schoolId: ID.schools.gordon, grade: 'ב', isActive: true },
      { id: ID.children.child2, firstName: 'נועה', lastName: 'כהן', birthDate: new Date(2019, 5, 20), gender: Gender.female, contactId: ID.contacts.parent1, secondaryContactId: ID.contacts.parent2, schoolId: ID.schools.sunshine, grade: 'טרום חובה', isActive: true },
      { id: ID.children.child3, firstName: 'עידן', lastName: 'לוי', birthDate: new Date(2016, 8, 10), gender: Gender.male, contactId: ID.contacts.parent2, schoolId: ID.schools.gordon, grade: 'ג', isActive: true },
      { id: ID.children.child4, firstName: 'תמר', lastName: 'ישראלי', birthDate: new Date(2018, 0, 5), gender: Gender.female, contactId: ID.contacts.parent3, schoolId: ID.schools.carmel, grade: 'א', isActive: true },
      { id: ID.children.child5, firstName: 'יונתן', lastName: 'ישראלי', birthDate: new Date(2015, 11, 1), gender: Gender.male, contactId: ID.contacts.parent3, secondaryContactId: ID.contacts.parent7, schoolId: ID.schools.carmel, grade: 'ד', isActive: true },
      { id: ID.children.child6, firstName: 'מיכל', lastName: 'מזרחי', birthDate: new Date(2017, 6, 22), gender: Gender.female, contactId: ID.contacts.parent4, schoolId: ID.schools.nitzanim, grade: 'ב', isActive: true },
      { id: ID.children.child7, firstName: 'אדם', lastName: 'פרידמן', birthDate: new Date(2018, 3, 14), gender: Gender.male, contactId: ID.contacts.parent5, schoolId: ID.schools.gordon, grade: 'א', isActive: true },
      { id: ID.children.child8, firstName: 'שירה', lastName: 'אדלר', birthDate: new Date(2016, 9, 30), gender: Gender.female, contactId: ID.contacts.parent6, schoolId: ID.schools.nitzanim, grade: 'ג', isActive: true },
      { id: ID.children.child9, firstName: 'רועי', lastName: 'שלום', birthDate: new Date(2017, 1, 18), gender: Gender.male, contactId: ID.contacts.parent7, schoolId: ID.schools.carmel, grade: 'ב', isActive: true },
      { id: ID.children.child10, firstName: 'ליה', lastName: 'פרידמן', birthDate: new Date(2019, 7, 8), gender: Gender.female, contactId: ID.contacts.parent5, schoolId: ID.schools.sunshine, grade: 'טרום חובה', isActive: true },
      { id: ID.children.child11, firstName: 'איתי', lastName: 'מזרחי', birthDate: new Date(2015, 4, 25), gender: Gender.male, contactId: ID.contacts.parent4, secondaryContactId: ID.contacts.parent6, schoolId: ID.schools.nitzanim, grade: 'ד', isActive: true },
      { id: ID.children.child12, firstName: 'יעל', lastName: 'שלום', birthDate: new Date(2018, 10, 12), gender: Gender.female, contactId: ID.contacts.parent7, schoolId: ID.schools.carmel, grade: 'א', isActive: true },
    ])
  } else {
    console.log('[Seed] Children already exist, skipping.')
  }

  // === 6. Employees ===
  if (await remult.repo(Employee).count() === 0) {
    console.log('[Seed] Creating employees...')
    await remult.repo(Employee).insert([
      { id: ID.employees.emp1, firstName: 'טלי', lastName: 'גולן', phone: '052-1111111', email: 'tali@wapp-agent.co.il', idNumber: '111111111', branchId: ID.branches.tlv, employeeRole: EmployeeRole.coordinator, isActive: true },
      { id: ID.employees.emp2, firstName: 'אלון', lastName: 'דהן', phone: '052-2222222', email: 'alon@wapp-agent.co.il', idNumber: '222222222', branchId: ID.branches.tlv, employeeRole: EmployeeRole.instructor, isActive: true },
      { id: ID.employees.emp3, firstName: 'שני', lastName: 'ביטון', phone: '052-3333333', email: 'shani@wapp-agent.co.il', idNumber: '333333333', branchId: ID.branches.jlm, employeeRole: EmployeeRole.instructor, isActive: true },
      { id: ID.employees.emp4, firstName: 'ניר', lastName: 'אביב', phone: '052-4444444', email: 'nir@wapp-agent.co.il', idNumber: '444444444', branchId: ID.branches.jlm, employeeRole: EmployeeRole.coordinator, isActive: true },
      { id: ID.employees.emp5, firstName: 'הדס', lastName: 'עמרם', phone: '052-5555555', email: 'hadas@wapp-agent.co.il', idNumber: '555555555', branchId: ID.branches.haifa, employeeRole: EmployeeRole.instructor, isActive: true },
      { id: ID.employees.emp6, firstName: 'עומר', lastName: 'סגל', phone: '052-6666666', email: 'omer@wapp-agent.co.il', idNumber: '666666666', branchId: ID.branches.haifa, employeeRole: EmployeeRole.coordinator, isActive: true },
      { id: ID.employees.emp7, firstName: 'ליאת', lastName: 'שוורץ', phone: '052-7777777', email: 'liat@wapp-agent.co.il', idNumber: '777777777', branchId: ID.branches.tlv, employeeRole: EmployeeRole.assistant, isActive: true },
      { id: ID.employees.emp8, firstName: 'גל', lastName: 'חזן', phone: '052-8888888', email: 'gal@wapp-agent.co.il', idNumber: '888888888', branchId: ID.branches.jlm, employeeRole: EmployeeRole.assistant, isActive: true },
    ])
  } else {
    console.log('[Seed] Employees already exist, skipping.')
  }

  // === 7. Afternoon Programs ===
  if (await remult.repo(Afternoon).count() === 0) {
    console.log('[Seed] Creating afternoon programs...')
    await remult.repo(Afternoon).insert([
      { id: ID.afternoons.tlv, name: 'צהרון דיזנגוף', branchId: ID.branches.tlv, schoolYear: 'תשפ"ו', monthlyPrice: 1800, isActive: true },
      { id: ID.afternoons.jlm, name: 'צהרון ירושלים', branchId: ID.branches.jlm, schoolYear: 'תשפ"ו', monthlyPrice: 1650, isActive: true },
      { id: ID.afternoons.haifa, name: 'צהרון הכרמל', branchId: ID.branches.haifa, schoolYear: 'תשפ"ו', monthlyPrice: 1500, isActive: true },
    ])
  } else {
    console.log('[Seed] Afternoon programs already exist, skipping.')
  }

  // === 8. Afternoon Groups ===
  if (await remult.repo(AfternoonGroup).count() === 0) {
    console.log('[Seed] Creating afternoon groups...')
    await remult.repo(AfternoonGroup).insert([
      { id: ID.afternoonGroups.grp1, afternoonId: ID.afternoons.tlv, name: 'קבוצת דובונים', ageFrom: 5, ageTo: 7, maxChildren: 20, instructorId: ID.employees.emp2, isActive: true },
      { id: ID.afternoonGroups.grp2, afternoonId: ID.afternoons.tlv, name: 'קבוצת אריות', ageFrom: 7, ageTo: 9, maxChildren: 22, instructorId: ID.employees.emp7, isActive: true },
      { id: ID.afternoonGroups.grp3, afternoonId: ID.afternoons.jlm, name: 'קבוצת כוכבים', ageFrom: 5, ageTo: 7, maxChildren: 18, instructorId: ID.employees.emp3, isActive: true },
      { id: ID.afternoonGroups.grp4, afternoonId: ID.afternoons.jlm, name: 'קבוצת נשרים', ageFrom: 7, ageTo: 10, maxChildren: 20, instructorId: ID.employees.emp8, isActive: true },
      { id: ID.afternoonGroups.grp5, afternoonId: ID.afternoons.haifa, name: 'קבוצת דולפינים', ageFrom: 5, ageTo: 8, maxChildren: 18, instructorId: ID.employees.emp5, isActive: true },
    ])
  } else {
    console.log('[Seed] Afternoon groups already exist, skipping.')
  }

  // === 9. Afternoon Children (Registrations) ===
  if (await remult.repo(AfternoonChild).count() === 0) {
    console.log('[Seed] Creating afternoon registrations...')
    await remult.repo(AfternoonChild).insert([
      { id: ID.afternoonChildren.ac1, afternoonGroupId: ID.afternoonGroups.grp1, childId: ID.children.child1, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2025, 8, 1) },
      { id: ID.afternoonChildren.ac2, afternoonGroupId: ID.afternoonGroups.grp1, childId: ID.children.child7, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2025, 8, 1) },
      { id: ID.afternoonChildren.ac3, afternoonGroupId: ID.afternoonGroups.grp2, childId: ID.children.child3, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2025, 8, 1) },
      { id: ID.afternoonChildren.ac4, afternoonGroupId: ID.afternoonGroups.grp3, childId: ID.children.child6, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2025, 8, 2) },
      { id: ID.afternoonChildren.ac5, afternoonGroupId: ID.afternoonGroups.grp3, childId: ID.children.child2, registrationStatus: RegistrationStatus.pending, registrationDate: new Date(2025, 8, 5) },
      { id: ID.afternoonChildren.ac6, afternoonGroupId: ID.afternoonGroups.grp4, childId: ID.children.child8, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2025, 8, 1) },
      { id: ID.afternoonChildren.ac7, afternoonGroupId: ID.afternoonGroups.grp4, childId: ID.children.child11, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2025, 8, 1) },
      { id: ID.afternoonChildren.ac8, afternoonGroupId: ID.afternoonGroups.grp5, childId: ID.children.child4, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2025, 8, 3) },
      { id: ID.afternoonChildren.ac9, afternoonGroupId: ID.afternoonGroups.grp5, childId: ID.children.child9, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2025, 8, 3) },
      { id: ID.afternoonChildren.ac10, afternoonGroupId: ID.afternoonGroups.grp5, childId: ID.children.child5, registrationStatus: RegistrationStatus.cancelled, registrationDate: new Date(2025, 8, 1), notes: 'בוטל - עבר לקבוצה אחרת' },
    ])
  } else {
    console.log('[Seed] Afternoon registrations already exist, skipping.')
  }

  // === 10. Attendance Records ===
  if (await remult.repo(Attendance).count() === 0) {
    console.log('[Seed] Creating attendance records...')
    const attendanceDates = [
      new Date(2026, 0, 26),
      new Date(2026, 0, 27),
      new Date(2026, 0, 28),
      new Date(2026, 0, 29),
      new Date(2026, 1, 1),
      new Date(2026, 1, 2)
    ]

    // Group 1 attendance - child1 & child7
    for (const date of attendanceDates) {
      await remult.repo(Attendance).insert({
        afternoonGroupId: ID.afternoonGroups.grp1,
        childId: ID.children.child1,
        date,
        attendanceStatus: Math.random() > 0.15 ? AttendanceStatus.present : AttendanceStatus.absent,
        checkIn: '13:30',
        checkOut: '17:00'
      })
      await remult.repo(Attendance).insert({
        afternoonGroupId: ID.afternoonGroups.grp1,
        childId: ID.children.child7,
        date,
        attendanceStatus: Math.random() > 0.2 ? AttendanceStatus.present : AttendanceStatus.late,
        checkIn: '13:45',
        checkOut: '17:00'
      })
    }

    // Group 5 attendance - child4 & child9
    for (const date of attendanceDates.slice(0, 4)) {
      await remult.repo(Attendance).insert({
        afternoonGroupId: ID.afternoonGroups.grp5,
        childId: ID.children.child4,
        date,
        attendanceStatus: AttendanceStatus.present,
        checkIn: '13:30',
        checkOut: '16:30'
      })
      await remult.repo(Attendance).insert({
        afternoonGroupId: ID.afternoonGroups.grp5,
        childId: ID.children.child9,
        date,
        attendanceStatus: date.getDay() === 3 ? AttendanceStatus.absent : AttendanceStatus.present,
        checkIn: '13:30',
        checkOut: '16:30',
        notes: date.getDay() === 3 ? 'חולה' : ''
      })
    }
  } else {
    console.log('[Seed] Attendance records already exist, skipping.')
  }

  // === 11. Monthly Charges ===
  if (await remult.repo(MonthlyCharge).count() === 0) {
    console.log('[Seed] Creating monthly charges...')
    const chargeRepo = remult.repo(MonthlyCharge)

    // October charges
    await chargeRepo.insert({ id: ID.monthlyCharges.mc1, afternoonChildId: ID.afternoonChildren.ac1, month: 10, year: 2025, amount: 1800, paidAmount: 1800, chargeStatus: ChargeStatus.paid })
    await chargeRepo.insert({ id: ID.monthlyCharges.mc2, afternoonChildId: ID.afternoonChildren.ac2, month: 10, year: 2025, amount: 1800, paidAmount: 1800, chargeStatus: ChargeStatus.paid })
    await chargeRepo.insert({ id: ID.monthlyCharges.mc3, afternoonChildId: ID.afternoonChildren.ac3, month: 10, year: 2025, amount: 1800, paidAmount: 1800, chargeStatus: ChargeStatus.paid })
    await chargeRepo.insert({ id: ID.monthlyCharges.mc4, afternoonChildId: ID.afternoonChildren.ac4, month: 10, year: 2025, amount: 1650, paidAmount: 1650, chargeStatus: ChargeStatus.paid })
    await chargeRepo.insert({ id: ID.monthlyCharges.mc5, afternoonChildId: ID.afternoonChildren.ac8, month: 10, year: 2025, amount: 1500, paidAmount: 1500, chargeStatus: ChargeStatus.paid })
    await chargeRepo.insert({ id: ID.monthlyCharges.mc6, afternoonChildId: ID.afternoonChildren.ac9, month: 10, year: 2025, amount: 1500, paidAmount: 1500, chargeStatus: ChargeStatus.paid })

    // November charges
    await chargeRepo.insert({ id: ID.monthlyCharges.mc7, afternoonChildId: ID.afternoonChildren.ac1, month: 11, year: 2025, amount: 1800, paidAmount: 1800, chargeStatus: ChargeStatus.paid })
    await chargeRepo.insert({ id: ID.monthlyCharges.mc8, afternoonChildId: ID.afternoonChildren.ac2, month: 11, year: 2025, amount: 1800, paidAmount: 900, chargeStatus: ChargeStatus.partial, notes: 'שולם חלקית' })
    await chargeRepo.insert({ id: ID.monthlyCharges.mc9, afternoonChildId: ID.afternoonChildren.ac3, month: 11, year: 2025, amount: 1800, paidAmount: 1800, chargeStatus: ChargeStatus.paid })
    await chargeRepo.insert({ id: ID.monthlyCharges.mc10, afternoonChildId: ID.afternoonChildren.ac8, month: 11, year: 2025, amount: 1500, paidAmount: 1500, chargeStatus: ChargeStatus.paid })

    // December charges
    await chargeRepo.insert({ id: ID.monthlyCharges.mc11, afternoonChildId: ID.afternoonChildren.ac1, month: 12, year: 2025, amount: 1800, paidAmount: 0, chargeStatus: ChargeStatus.pending })
    await chargeRepo.insert({ id: ID.monthlyCharges.mc12, afternoonChildId: ID.afternoonChildren.ac2, month: 12, year: 2025, amount: 1800, paidAmount: 0, chargeStatus: ChargeStatus.overdue, notes: 'יש חוב מנובמבר' })

    // January 2026 charges
    await chargeRepo.insert({ id: ID.monthlyCharges.mc13, afternoonChildId: ID.afternoonChildren.ac1, month: 1, year: 2026, amount: 1800, paidAmount: 0, chargeStatus: ChargeStatus.pending })
    await chargeRepo.insert({ id: ID.monthlyCharges.mc14, afternoonChildId: ID.afternoonChildren.ac3, month: 1, year: 2026, amount: 1800, paidAmount: 0, chargeStatus: ChargeStatus.pending })
  } else {
    console.log('[Seed] Monthly charges already exist, skipping.')
  }

  // === 12. Camps ===
  if (await remult.repo(Camp).count() === 0) {
    console.log('[Seed] Creating camps...')
    await remult.repo(Camp).insert([
      { id: ID.camps.summer, name: 'קייטנת קיץ 2026', branchId: ID.branches.tlv, campType: CampType.summer, startDate: new Date(2026, 6, 1), endDate: new Date(2026, 7, 15), price: 3500, isActive: true },
      { id: ID.camps.passover, name: 'קייטנת פסח 2026', branchId: ID.branches.jlm, campType: CampType.passover, startDate: new Date(2026, 3, 5), endDate: new Date(2026, 3, 16), price: 1800, isActive: true },
      { id: ID.camps.hanukkah, name: 'קייטנת חנוכה 2025', branchId: ID.branches.haifa, campType: CampType.hanukkah, startDate: new Date(2025, 11, 15), endDate: new Date(2025, 11, 22), price: 1200, isActive: false, notes: 'הסתיימה' },
    ])
  } else {
    console.log('[Seed] Camps already exist, skipping.')
  }

  // === 13. Camp Cycles ===
  if (await remult.repo(CampCycle).count() === 0) {
    console.log('[Seed] Creating camp cycles...')
    await remult.repo(CampCycle).insert([
      { id: ID.campCycles.summer1, campId: ID.camps.summer, name: 'מחזור א - יולי', startDate: new Date(2026, 6, 1), endDate: new Date(2026, 6, 15), price: 1800, maxChildren: 60, isActive: true },
      { id: ID.campCycles.summer2, campId: ID.camps.summer, name: 'מחזור ב - אוגוסט', startDate: new Date(2026, 7, 1), endDate: new Date(2026, 7, 15), price: 1800, maxChildren: 60, isActive: true },
      { id: ID.campCycles.passover, campId: ID.camps.passover, name: 'מחזור פסח', startDate: new Date(2026, 3, 5), endDate: new Date(2026, 3, 16), price: 1800, maxChildren: 40, isActive: true },
      { id: ID.campCycles.hanukkah, campId: ID.camps.hanukkah, name: 'מחזור חנוכה', startDate: new Date(2025, 11, 15), endDate: new Date(2025, 11, 22), price: 1200, maxChildren: 30, isActive: false },
    ])
  } else {
    console.log('[Seed] Camp cycles already exist, skipping.')
  }

  // === 14. Camp Groups ===
  if (await remult.repo(CampGroup).count() === 0) {
    console.log('[Seed] Creating camp groups...')
    await remult.repo(CampGroup).insert([
      { id: ID.campGroups.cg1, campCycleId: ID.campCycles.summer1, name: 'קבוצת ים', ageFrom: 5, ageTo: 7, maxChildren: 20, instructorId: ID.employees.emp2, isActive: true },
      { id: ID.campGroups.cg2, campCycleId: ID.campCycles.summer1, name: 'קבוצת הרים', ageFrom: 7, ageTo: 10, maxChildren: 20, instructorId: ID.employees.emp1, isActive: true },
      { id: ID.campGroups.cg3, campCycleId: ID.campCycles.summer2, name: 'קבוצת שמש', ageFrom: 5, ageTo: 8, maxChildren: 25, instructorId: ID.employees.emp7, isActive: true },
      { id: ID.campGroups.cg4, campCycleId: ID.campCycles.passover, name: 'קבוצת חירות', ageFrom: 5, ageTo: 9, maxChildren: 20, instructorId: ID.employees.emp3, isActive: true },
      { id: ID.campGroups.cg5, campCycleId: ID.campCycles.hanukkah, name: 'קבוצת סביבון', ageFrom: 5, ageTo: 8, maxChildren: 15, instructorId: ID.employees.emp5, isActive: false },
    ])
  } else {
    console.log('[Seed] Camp groups already exist, skipping.')
  }

  // === 15. Camp Registrations ===
  if (await remult.repo(CampRegistration).count() === 0) {
    console.log('[Seed] Creating camp registrations...')
    await remult.repo(CampRegistration).insert([
      { id: ID.campRegistrations.cr1, campCycleId: ID.campCycles.summer1, childId: ID.children.child1, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2026, 1, 15), price: 1800, paidAmount: 1800, chargeStatus: ChargeStatus.paid },
      { id: ID.campRegistrations.cr2, campCycleId: ID.campCycles.summer1, childId: ID.children.child3, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2026, 1, 16), price: 1800, paidAmount: 0, chargeStatus: ChargeStatus.pending },
      { id: ID.campRegistrations.cr3, campCycleId: ID.campCycles.summer1, childId: ID.children.child7, registrationStatus: RegistrationStatus.pending, registrationDate: new Date(2026, 1, 20), price: 1800, paidAmount: 0, chargeStatus: ChargeStatus.pending },
      { id: ID.campRegistrations.cr4, campCycleId: ID.campCycles.summer2, childId: ID.children.child1, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2026, 1, 15), price: 1800, paidAmount: 0, chargeStatus: ChargeStatus.pending },
      { id: ID.campRegistrations.cr5, campCycleId: ID.campCycles.summer2, childId: ID.children.child5, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2026, 1, 18), price: 1800, paidAmount: 0, chargeStatus: ChargeStatus.pending },
      { id: ID.campRegistrations.cr6, campCycleId: ID.campCycles.passover, childId: ID.children.child6, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2026, 0, 10), price: 1800, paidAmount: 0, chargeStatus: ChargeStatus.pending },
      { id: ID.campRegistrations.cr7, campCycleId: ID.campCycles.passover, childId: ID.children.child8, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2026, 0, 12), price: 1800, paidAmount: 0, chargeStatus: ChargeStatus.pending },
      { id: ID.campRegistrations.cr8, campCycleId: ID.campCycles.passover, childId: ID.children.child11, registrationStatus: RegistrationStatus.pending, registrationDate: new Date(2026, 0, 20), price: 1800, paidAmount: 0, chargeStatus: ChargeStatus.pending },
      { id: ID.campRegistrations.cr9, campCycleId: ID.campCycles.hanukkah, childId: ID.children.child4, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2025, 10, 1), price: 1200, paidAmount: 1200, chargeStatus: ChargeStatus.paid },
      { id: ID.campRegistrations.cr10, campCycleId: ID.campCycles.hanukkah, childId: ID.children.child9, registrationStatus: RegistrationStatus.active, registrationDate: new Date(2025, 10, 3), price: 1200, paidAmount: 1200, chargeStatus: ChargeStatus.paid },
    ])
  } else {
    console.log('[Seed] Camp registrations already exist, skipping.')
  }

  // === 16. Camp Activities ===
  if (await remult.repo(CampActivity).count() === 0) {
    console.log('[Seed] Creating camp activities...')
    await remult.repo(CampActivity).insert([
      { campCycleId: ID.campCycles.summer1, name: 'יום ספורט ומים', description: 'פעילויות ספורט ומשחקי מים', date: new Date(2026, 6, 3), location: 'מגרש ספורט תל אביב' },
      { campCycleId: ID.campCycles.summer1, name: 'סדנת אומנות', description: 'יצירה בחומרים שונים', date: new Date(2026, 6, 7), location: 'אולם יצירה' },
      { campCycleId: ID.campCycles.summer1, name: 'טיול לפארק המים', description: 'טיול יומי לפארק מים שפיים', date: new Date(2026, 6, 10), location: 'שפיים' },
      { campCycleId: ID.campCycles.summer2, name: 'יום אתגרי', description: 'מסלול אתגרים וחבלים', date: new Date(2026, 7, 5), location: 'פארק אתגרי' },
      { campCycleId: ID.campCycles.summer2, name: 'הופעה חיה', description: 'הופעת ליצן ומוזיקה', date: new Date(2026, 7, 12), location: 'אולם אירועים' },
      { campCycleId: ID.campCycles.passover, name: 'סדנת מצות', description: 'אפיית מצות יד', date: new Date(2026, 3, 7), location: 'מאפיית מצות' },
      { campCycleId: ID.campCycles.passover, name: 'טיול עין גדי', description: 'טיול בנחל דוד', date: new Date(2026, 3, 10), location: 'עין גדי' },
      { campCycleId: ID.campCycles.hanukkah, name: 'סדנת סופגניות', description: 'הכנת סופגניות מסורתיות', date: new Date(2025, 11, 17), location: 'מטבח מרכזי' },
    ])
  } else {
    console.log('[Seed] Camp activities already exist, skipping.')
  }

  // === 17. Event Types ===
  if (await remult.repo(EventType).count() === 0) {
    console.log('[Seed] Creating event types...')
    await remult.repo(EventType).insert([
      { id: ID.eventTypes.birthday, name: 'יום הולדת', description: 'מסיבות יום הולדת לילדים', isActive: true },
      { id: ID.eventTypes.team, name: 'גיבוש חברה', description: 'ימי כיף וגיבוש לחברות', isActive: true },
      { id: ID.eventTypes.school, name: 'אירוע בית ספר', description: 'אירועים לבתי ספר וגנים', isActive: true },
      { id: ID.eventTypes.private, name: 'אירוע פרטי', description: 'אירועים פרטיים מותאמים אישית', isActive: true },
    ])
  } else {
    console.log('[Seed] Event types already exist, skipping.')
  }

  // === 18. Event Packages ===
  if (await remult.repo(EventPackage).count() === 0) {
    console.log('[Seed] Creating event packages...')
    await remult.repo(EventPackage).insert([
      { id: ID.eventPackages.basic, eventTypeId: ID.eventTypes.birthday, name: 'חבילה בסיסית', description: 'מתנפחים + DJ + כיבוד קל', price: 2500, maxParticipants: 30, isActive: true },
      { id: ID.eventPackages.premium, eventTypeId: ID.eventTypes.birthday, name: 'חבילת פרימיום', description: 'מתנפחים + DJ + כיבוד מלא + ליצן + פינת צילום', price: 4500, maxParticipants: 40, isActive: true },
      { id: ID.eventPackages.teamSmall, eventTypeId: ID.eventTypes.team, name: 'גיבוש קטן', description: 'פעילויות גיבוש עד 30 משתתפים', price: 5000, maxParticipants: 30, isActive: true },
      { id: ID.eventPackages.teamLarge, eventTypeId: ID.eventTypes.team, name: 'גיבוש גדול', description: 'פעילויות גיבוש עד 80 משתתפים', price: 12000, maxParticipants: 80, isActive: true },
      { id: ID.eventPackages.school, eventTypeId: ID.eventTypes.school, name: 'חבילת בית ספר', description: 'יום פעילות לכיתה/שכבה', price: 3500, maxParticipants: 45, isActive: true },
    ])
  } else {
    console.log('[Seed] Event packages already exist, skipping.')
  }

  // === 19. Events ===
  if (await remult.repo(Event).count() === 0) {
    console.log('[Seed] Creating events...')
    await remult.repo(Event).insert([
      { id: ID.events.evt1, name: 'יום הולדת 7 לאורי', eventTypeId: ID.eventTypes.birthday, eventPackageId: ID.eventPackages.premium, branchId: ID.branches.tlv, contactId: ID.contacts.parent1, eventDate: new Date(2026, 2, 15), participantCount: 25, totalPrice: 4500, eventStatus: EventStatus.confirmed, isActive: true },
      { id: ID.events.evt2, name: 'גיבוש חברת TechCo', eventTypeId: ID.eventTypes.team, eventPackageId: ID.eventPackages.teamLarge, branchId: ID.branches.tlv, contactId: ID.contacts.biz1, eventDate: new Date(2026, 2, 22), participantCount: 60, totalPrice: 12000, eventStatus: EventStatus.confirmed, isActive: true },
      { id: ID.events.evt3, name: 'יום הולדת 8 לשירה', eventTypeId: ID.eventTypes.birthday, eventPackageId: ID.eventPackages.basic, branchId: ID.branches.jlm, contactId: ID.contacts.parent6, eventDate: new Date(2026, 3, 2), participantCount: 18, totalPrice: 2500, eventStatus: EventStatus.inquiry, isActive: true, notes: 'ממתינים לאישור תאריך סופי' },
      { id: ID.events.evt4, name: 'יום כיף שכבה ד', eventTypeId: ID.eventTypes.school, eventPackageId: ID.eventPackages.school, branchId: ID.branches.haifa, contactId: ID.contacts.biz2, eventDate: new Date(2026, 1, 10), participantCount: 40, totalPrice: 3500, eventStatus: EventStatus.completed, isActive: true },
      { id: ID.events.evt5, name: 'יום הולדת 6 לתמר', eventTypeId: ID.eventTypes.birthday, eventPackageId: ID.eventPackages.basic, branchId: ID.branches.haifa, contactId: ID.contacts.parent3, eventDate: new Date(2025, 11, 20), participantCount: 20, totalPrice: 2500, eventStatus: EventStatus.completed, isActive: false },
    ])
  } else {
    console.log('[Seed] Events already exist, skipping.')
  }

  // === 20. Event Staff ===
  if (await remult.repo(EventStaff).count() === 0) {
    console.log('[Seed] Creating event staff...')
    await remult.repo(EventStaff).insert([
      { eventId: ID.events.evt1, employeeId: ID.employees.emp2, role: 'מדריך ראשי', notes: 'אחראי על כל הפעילויות' },
      { eventId: ID.events.evt1, employeeId: ID.employees.emp7, role: 'עוזר', notes: 'סיוע בהפעלה' },
      { eventId: ID.events.evt2, employeeId: ID.employees.emp1, role: 'רכזת אירוע' },
      { eventId: ID.events.evt2, employeeId: ID.employees.emp2, role: 'מדריך' },
      { eventId: ID.events.evt2, employeeId: ID.employees.emp7, role: 'עוזר' },
      { eventId: ID.events.evt3, employeeId: ID.employees.emp3, role: 'מדריכה ראשית' },
      { eventId: ID.events.evt4, employeeId: ID.employees.emp5, role: 'מדריכה' },
      { eventId: ID.events.evt4, employeeId: ID.employees.emp6, role: 'רכז אירוע' },
      { eventId: ID.events.evt5, employeeId: ID.employees.emp5, role: 'מדריכה' },
    ])
  } else {
    console.log('[Seed] Event staff already exist, skipping.')
  }

  // === 21. Event Equipment ===
  if (await remult.repo(EventEquipment).count() === 0) {
    console.log('[Seed] Creating event equipment...')
    await remult.repo(EventEquipment).insert([
      { eventId: ID.events.evt1, name: 'מתנפח טירה', quantity: 1 },
      { eventId: ID.events.evt1, name: 'מכונת פופקורן', quantity: 1 },
      { eventId: ID.events.evt1, name: 'רמקול + מיקרופון', quantity: 1 },
      { eventId: ID.events.evt2, name: 'ציוד חבלים', quantity: 5 },
      { eventId: ID.events.evt2, name: 'אוהל צל', quantity: 3 },
      { eventId: ID.events.evt2, name: 'מערכת הגברה', quantity: 1 },
      { eventId: ID.events.evt3, name: 'מתנפח קטן', quantity: 1 },
      { eventId: ID.events.evt4, name: 'ציוד ספורט', quantity: 10 },
      { eventId: ID.events.evt4, name: 'אוהל צל', quantity: 2 },
    ])
  } else {
    console.log('[Seed] Event equipment already exist, skipping.')
  }

  // === 22. Medical Info ===
  if (await remult.repo(MedicalInfo).count() === 0) {
    console.log('[Seed] Creating medical info...')
    await remult.repo(MedicalInfo).insert([
      { childId: ID.children.child1, allergies: 'אגוזים', medications: '', dietaryRestrictions: 'ללא אגוזים', notes: 'יש אפיפן בתיק' },
      { childId: ID.children.child3, allergies: '', medications: 'ריטלין', dietaryRestrictions: '', notes: 'נוטל תרופה בבוקר' },
      { childId: ID.children.child6, allergies: 'חלב', medications: '', dietaryRestrictions: 'ללא מוצרי חלב', notes: 'אלרגיה ללקטוז' },
      { childId: ID.children.child9, allergies: 'דבורים', medications: '', dietaryRestrictions: '', notes: 'יש אפיפן' },
      { childId: ID.children.child11, allergies: '', medications: '', dietaryRestrictions: '', notes: 'אסטמה - יש משאף בתיק' },
    ])
  } else {
    console.log('[Seed] Medical info already exist, skipping.')
  }

  // === 23. Emergency Contacts ===
  if (await remult.repo(EmergencyContact).count() === 0) {
    console.log('[Seed] Creating emergency contacts...')
    await remult.repo(EmergencyContact).insert([
      { childId: ID.children.child1, firstName: 'דינה', lastName: 'כהן', phone: '050-1010101', relationship: 'סבתא' },
      { childId: ID.children.child1, firstName: 'חיים', lastName: 'כהן', phone: '050-1020102', relationship: 'סבא' },
      { childId: ID.children.child3, firstName: 'רינה', lastName: 'לוי', phone: '050-3030303', relationship: 'דודה' },
      { childId: ID.children.child4, firstName: 'יעקב', lastName: 'ישראלי', phone: '050-4040404', relationship: 'סבא' },
      { childId: ID.children.child5, firstName: 'יעקב', lastName: 'ישראלי', phone: '050-4040404', relationship: 'סבא' },
      { childId: ID.children.child6, firstName: 'אסתר', lastName: 'מזרחי', phone: '050-6060606', relationship: 'סבתא' },
      { childId: ID.children.child7, firstName: 'צביה', lastName: 'פרידמן', phone: '050-7070707', relationship: 'סבתא' },
      { childId: ID.children.child8, firstName: 'מרים', lastName: 'אדלר', phone: '050-8080808', relationship: 'דודה' },
      { childId: ID.children.child9, firstName: 'שמעון', lastName: 'שלום', phone: '050-9090909', relationship: 'דוד' },
      { childId: ID.children.child11, firstName: 'אסתר', lastName: 'מזרחי', phone: '050-6060606', relationship: 'סבתא' },
    ])
  } else {
    console.log('[Seed] Emergency contacts already exist, skipping.')
  }

  // === 24. Payments ===
  if (await remult.repo(Payment).count() === 0) {
    console.log('[Seed] Creating payments...')
    await remult.repo(Payment).insert([
      // Monthly charge payments – October
      { id: ID.payments.pay1, contactId: ID.contacts.parent1, amount: 1800, paymentDate: new Date(2025, 9, 5), paymentMethod: PaymentMethod.creditCard, monthlyChargeId: ID.monthlyCharges.mc1, notes: 'תשלום צהרון אוקטובר - אורי כהן' },
      { id: ID.payments.pay2, contactId: ID.contacts.parent5, amount: 1800, paymentDate: new Date(2025, 9, 1), paymentMethod: PaymentMethod.check, monthlyChargeId: ID.monthlyCharges.mc2, notes: 'תשלום צהרון אוקטובר - אדם פרידמן' },
      { id: ID.payments.pay3, contactId: ID.contacts.parent2, amount: 1800, paymentDate: new Date(2025, 9, 3), paymentMethod: PaymentMethod.bankTransfer, monthlyChargeId: ID.monthlyCharges.mc3, notes: 'תשלום צהרון אוקטובר - עידן לוי' },
      { id: ID.payments.pay4, contactId: ID.contacts.parent4, amount: 1650, paymentDate: new Date(2025, 9, 7), paymentMethod: PaymentMethod.cash, monthlyChargeId: ID.monthlyCharges.mc4, notes: 'תשלום צהרון אוקטובר - מיכל מזרחי' },
      { id: ID.payments.pay5, contactId: ID.contacts.parent3, amount: 1500, paymentDate: new Date(2025, 9, 10), paymentMethod: PaymentMethod.creditCard, monthlyChargeId: ID.monthlyCharges.mc5, notes: 'תשלום צהרון אוקטובר - תמר ישראלי' },
      { id: ID.payments.pay6, contactId: ID.contacts.parent7, amount: 1500, paymentDate: new Date(2025, 9, 5), paymentMethod: PaymentMethod.bankTransfer, monthlyChargeId: ID.monthlyCharges.mc6, notes: 'תשלום צהרון אוקטובר - רועי שלום' },
      // Monthly charge payments – November
      { id: ID.payments.pay7, contactId: ID.contacts.parent1, amount: 1800, paymentDate: new Date(2025, 10, 5), paymentMethod: PaymentMethod.creditCard, monthlyChargeId: ID.monthlyCharges.mc7, notes: 'תשלום צהרון נובמבר - אורי כהן' },
      { id: ID.payments.pay8, contactId: ID.contacts.parent5, amount: 900, paymentDate: new Date(2025, 10, 1), paymentMethod: PaymentMethod.check, monthlyChargeId: ID.monthlyCharges.mc8, notes: 'תשלום חלקי צהרון נובמבר - אדם פרידמן' },
      { id: ID.payments.pay9, contactId: ID.contacts.parent2, amount: 1800, paymentDate: new Date(2025, 10, 3), paymentMethod: PaymentMethod.bankTransfer, monthlyChargeId: ID.monthlyCharges.mc9, notes: 'תשלום צהרון נובמבר - עידן לוי' },
      { id: ID.payments.pay10, contactId: ID.contacts.parent3, amount: 1500, paymentDate: new Date(2025, 10, 10), paymentMethod: PaymentMethod.creditCard, monthlyChargeId: ID.monthlyCharges.mc10, notes: 'תשלום צהרון נובמבר - תמר ישראלי' },
      // Camp registration payments
      { id: ID.payments.pay11, contactId: ID.contacts.parent1, amount: 1800, paymentDate: new Date(2026, 1, 15), paymentMethod: PaymentMethod.creditCard, campRegistrationId: ID.campRegistrations.cr1, notes: 'תשלום רישום קייטנת קיץ מחזור א - אורי כהן' },
      { id: ID.payments.pay12, contactId: ID.contacts.parent3, amount: 1200, paymentDate: new Date(2025, 10, 1), paymentMethod: PaymentMethod.creditCard, campRegistrationId: ID.campRegistrations.cr9, notes: 'תשלום קייטנת חנוכה - תמר ישראלי' },
      { id: ID.payments.pay13, contactId: ID.contacts.parent7, amount: 1200, paymentDate: new Date(2025, 10, 3), paymentMethod: PaymentMethod.bankTransfer, campRegistrationId: ID.campRegistrations.cr10, notes: 'תשלום קייטנת חנוכה - רועי שלום' },
      // Standalone payment (event-related, no charge link)
      { id: ID.payments.pay14, contactId: ID.contacts.biz1, amount: 6000, paymentDate: new Date(2026, 1, 1), paymentMethod: PaymentMethod.bankTransfer, notes: 'מקדמה גיבוש חברה TechCo - 50%' },
    ])
  } else {
    console.log('[Seed] Payments already exist, skipping.')
  }

  // === 25. Messages ===
  if (await remult.repo(Message).count() === 0) {
    console.log('[Seed] Creating messages...')
    await remult.repo(Message).insert([
      { contactId: ID.contacts.parent1, messageType: MessageType.whatsapp, messageStatus: MessageStatus.sent, messageText: 'שלום יוסי, להזכירך שמחר יום ספורט בצהרון. נא להביא ביגוד מתאים.', sentDate: new Date(2026, 0, 25) },
      { contactId: ID.contacts.parent2, messageType: MessageType.sms, messageStatus: MessageStatus.sent, messageText: 'שלום מירב, נותר חוב של 900 ש"ח עבור חודש נובמבר. נא להסדיר.', sentDate: new Date(2025, 11, 15) },
      { contactId: ID.contacts.parent3, messageType: MessageType.email, messageStatus: MessageStatus.sent, messageText: 'הזמנה לערב הורים בצהרון הכרמל ביום שלישי הקרוב בשעה 19:00.', sentDate: new Date(2026, 0, 20) },
      { contactId: ID.contacts.biz1, messageType: MessageType.email, messageStatus: MessageStatus.sent, messageText: 'הצעת מחיר מעודכנת לגיבוש חברת TechCo - 60 משתתפים. מצורף קובץ.', sentDate: new Date(2026, 0, 28) },
      { contactId: ID.contacts.parent5, messageType: MessageType.whatsapp, messageStatus: MessageStatus.pending, messageText: 'שלום אברהם, הרישום לקייטנת קיץ נפתח! מקומות מוגבלים.', sentDate: new Date(2026, 1, 1) },
      { contactId: ID.contacts.parent6, messageType: MessageType.sms, messageStatus: MessageStatus.failed, messageText: 'אישור הזמנה ליום הולדת שירה', sentDate: new Date(2026, 0, 18) },
    ])
  } else {
    console.log('[Seed] Messages already exist, skipping.')
  }

  // === 26. Notes ===
  if (await remult.repo(Note).count() === 0) {
    console.log('[Seed] Creating notes...')
    await remult.repo(Note).insert([
      { entityType: 'children', entityId: ID.children.child1, text: 'ילד מצטיין, מאוד חברותי ומשתלב טוב בקבוצה' },
      { entityType: 'children', entityId: ID.children.child3, text: 'צריך תשומת לב מיוחדת בזמן ארוחת צהריים' },
      { entityType: 'events', entityId: ID.events.evt2, text: 'לקוח חוזר - חשוב לתת שירות מעולה' },
      { entityType: 'branches', entityId: ID.branches.tlv, text: 'יש לתאם עם העירייה חידוש רישיון פעילות' },
      { entityType: 'afternoons', entityId: ID.afternoons.tlv, text: 'הורים ביקשו להוסיף חוג רובוטיקה בימי רביעי' },
    ])
  } else {
    console.log('[Seed] Notes already exist, skipping.')
  }

  // === 27. Documents ===
  if (await remult.repo(Document).count() === 0) {
    console.log('[Seed] Creating documents...')
    await remult.repo(Document).insert([
      { entityType: 'children', entityId: ID.children.child1, name: 'אישור רפואי 2025', url: '/documents/medical-cert-child1.pdf', notes: 'בתוקף עד 09/2026' },
      { entityType: 'children', entityId: ID.children.child6, name: 'אישור רפואי 2025', url: '/documents/medical-cert-child6.pdf', notes: 'כולל פירוט אלרגיות' },
      { entityType: 'events', entityId: ID.events.evt2, name: 'הצעת מחיר - TechCo', url: '/documents/quote-techco.pdf', notes: 'גרסה מעודכנת' },
      { entityType: 'events', entityId: ID.events.evt2, name: 'חוזה - TechCo', url: '/documents/contract-techco.pdf', notes: 'חתום' },
      { entityType: 'branches', entityId: ID.branches.tlv, name: 'רישיון עסק 2025', url: '/documents/license-tlv.pdf' },
    ])
  } else {
    console.log('[Seed] Documents already exist, skipping.')
  }

  console.log('[Seed] Database seed completed successfully!')
  console.log('[Seed] Summary:')
  console.log('[Seed]   - 2 Users')
  console.log('[Seed]   - 3 Branches')
  console.log('[Seed]   - 6 Schools')
  console.log('[Seed]   - 9 Contacts (7 parents, 2 business)')
  console.log('[Seed]   - 12 Children')
  console.log('[Seed]   - 8 Employees')
  console.log('[Seed]   - 3 Afternoon Programs, 5 Groups, 10 Registrations')
  console.log('[Seed]   - Attendance records for recent days')
  console.log('[Seed]   - 14 Monthly Charges (various statuses)')
  console.log('[Seed]   - 3 Camps, 4 Cycles, 5 Groups, 10 Registrations, 8 Activities')
  console.log('[Seed]   - 4 Event Types, 5 Packages, 5 Events, 9 Staff, 9 Equipment')
  console.log('[Seed]   - 5 Medical Info, 10 Emergency Contacts')
  console.log('[Seed]   - 14 Payments (linked to charges), 6 Messages, 5 Notes, 5 Documents')
}
