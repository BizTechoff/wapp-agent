import { BackendMethod, Controller, ControllerBase, remult } from 'remult'
import { Payment } from '../../app/payments/payment'
import { MonthlyCharge } from '../../app/monthly-charges/monthly-charge'
import { CampRegistration } from '../../app/camp-registrations/camp-registration'
import { ChargeStatus } from '../enums/ChargeStatus'

export interface GetPaymentsRequest {
  filter?: string
  monthlyChargeId?: string
  campRegistrationId?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface GetPaymentsResponse {
  payments: Payment[]
  totalRecords: number
}

@Controller('payments')
export class PaymentsController extends ControllerBase {

  @BackendMethod({ allowed: true })
  static async getPayments(request: GetPaymentsRequest): Promise<GetPaymentsResponse> {
    const {
      filter = '',
      monthlyChargeId,
      campRegistrationId,
      sortField,
      sortDirection = 'asc',
      page = 1,
      pageSize = 30
    } = request

    const where: any = {}
    if (filter) {
      where.contactId = { $contains: filter }
    }
    if (monthlyChargeId) {
      where.monthlyChargeId = monthlyChargeId
    }
    if (campRegistrationId) {
      where.campRegistrationId = campRegistrationId
    }

    const queryOptions: any = {
      where,
      page,
      limit: pageSize,
    }

    if (sortField) {
      queryOptions.orderBy = { [sortField]: sortDirection }
    }

    const payments = await remult.repo(Payment).find(queryOptions)
    const totalRecords = await remult.repo(Payment).count(where)

    return {
      payments,
      totalRecords
    }
  }

  @BackendMethod({ allowed: true })
  static async deletePayment(paymentId: string): Promise<void> {
    const payment = await remult.repo(Payment).findId(paymentId)
    if (!payment) throw new Error('תשלום לא נמצא')

    const { monthlyChargeId, campRegistrationId } = payment
    await remult.repo(Payment).delete(paymentId)

    // Recalculate linked charge after deletion
    if (monthlyChargeId) {
      await PaymentsController.recalculateMonthlyCharge(monthlyChargeId)
    }
    if (campRegistrationId) {
      await PaymentsController.recalculateCampRegistration(campRegistrationId)
    }
  }

  @BackendMethod({ allowed: true })
  static async createPayment(data: {
    contactId: string
    amount: number
    paymentDate: Date
    paymentMethod: any
    monthlyChargeId?: string
    campRegistrationId?: string
    notes: string
  }): Promise<Payment> {
    const payment = remult.repo(Payment).create()
    payment.contactId = data.contactId
    payment.amount = data.amount
    payment.paymentDate = data.paymentDate
    payment.paymentMethod = data.paymentMethod
    payment.monthlyChargeId = data.monthlyChargeId || ''
    payment.campRegistrationId = data.campRegistrationId || ''
    payment.notes = data.notes
    await payment.save()

    // Recalculate linked charge
    if (payment.monthlyChargeId) {
      await PaymentsController.recalculateMonthlyCharge(payment.monthlyChargeId)
    }
    if (payment.campRegistrationId) {
      await PaymentsController.recalculateCampRegistration(payment.campRegistrationId)
    }

    return payment
  }

  @BackendMethod({ allowed: true })
  static async updatePayment(
    paymentId: string,
    data: {
      contactId: string
      amount: number
      paymentDate: Date
      paymentMethod: any
      monthlyChargeId?: string
      campRegistrationId?: string
      notes: string
    }
  ): Promise<Payment> {
    const payment = await remult.repo(Payment).findId(paymentId)
    if (!payment) {
      throw new Error('תשלום לא נמצא')
    }

    // Track old links for recalculation
    const oldMonthlyChargeId = payment.monthlyChargeId
    const oldCampRegistrationId = payment.campRegistrationId

    payment.contactId = data.contactId
    payment.amount = data.amount
    payment.paymentDate = data.paymentDate
    payment.paymentMethod = data.paymentMethod
    payment.monthlyChargeId = data.monthlyChargeId || ''
    payment.campRegistrationId = data.campRegistrationId || ''
    payment.notes = data.notes
    await payment.save()

    // Recalculate old links if changed
    if (oldMonthlyChargeId && oldMonthlyChargeId !== payment.monthlyChargeId) {
      await PaymentsController.recalculateMonthlyCharge(oldMonthlyChargeId)
    }
    if (oldCampRegistrationId && oldCampRegistrationId !== payment.campRegistrationId) {
      await PaymentsController.recalculateCampRegistration(oldCampRegistrationId)
    }

    // Recalculate new links
    if (payment.monthlyChargeId) {
      await PaymentsController.recalculateMonthlyCharge(payment.monthlyChargeId)
    }
    if (payment.campRegistrationId) {
      await PaymentsController.recalculateCampRegistration(payment.campRegistrationId)
    }

    return payment
  }

  /** Recalculate a MonthlyCharge's paidAmount and chargeStatus from its linked payments */
  static async recalculateMonthlyCharge(monthlyChargeId: string): Promise<void> {
    const charge = await remult.repo(MonthlyCharge).findId(monthlyChargeId)
    if (!charge) return

    const payments = await remult.repo(Payment).find({
      where: { monthlyChargeId }
    })
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

    charge.paidAmount = totalPaid
    if (totalPaid >= charge.amount) {
      charge.chargeStatus = ChargeStatus.paid
    } else if (totalPaid > 0) {
      charge.chargeStatus = ChargeStatus.partial
    } else {
      charge.chargeStatus = ChargeStatus.pending
    }
    await charge.save()
  }

  /** Recalculate a CampRegistration's paidAmount and chargeStatus from its linked payments */
  static async recalculateCampRegistration(campRegistrationId: string): Promise<void> {
    const reg = await remult.repo(CampRegistration).findId(campRegistrationId)
    if (!reg) return

    const payments = await remult.repo(Payment).find({
      where: { campRegistrationId }
    })
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

    reg.paidAmount = totalPaid
    if (reg.price > 0 && totalPaid >= reg.price) {
      reg.chargeStatus = ChargeStatus.paid
    } else if (totalPaid > 0) {
      reg.chargeStatus = ChargeStatus.partial
    } else {
      reg.chargeStatus = ChargeStatus.pending
    }
    await reg.save()
  }
}
