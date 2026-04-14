import { BackendMethod, Controller, ControllerBase, remult } from 'remult'
import { CampRegistration } from '../../app/camp-registrations/camp-registration'
import { Child } from '../../app/children/child'

export interface GetCampRegistrationsRequest {
  filter?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface GetCampRegistrationsResponse {
  campRegistrations: CampRegistration[]
  totalRecords: number
}

@Controller('camp-registrations')
export class CampRegistrationsController extends ControllerBase {

  @BackendMethod({ allowed: true })
  static async getCampRegistrations(request: GetCampRegistrationsRequest): Promise<GetCampRegistrationsResponse> {
    const {
      filter = '',
      sortField,
      sortDirection = 'asc',
      page = 1,
      pageSize = 30
    } = request

    let where: any = {}
    if (filter) {
      // Find children matching the search text, then filter registrations by those childIds
      const matchingChildren = await remult.repo(Child).find({
        where: {
          $or: [
            { firstName: { $contains: filter } },
            { lastName: { $contains: filter } }
          ]
        }
      })
      const childIds = matchingChildren.map(c => c.id)
      where = childIds.length > 0 ? { childId: childIds } : { childId: '' }
    }

    const queryOptions: any = {
      where,
      page,
      limit: pageSize,
      include: { child: true, campCycle: true }
    }

    if (sortField) {
      queryOptions.orderBy = { [sortField]: sortDirection }
    }

    const campRegistrations = await remult.repo(CampRegistration).find(queryOptions)
    const totalRecords = await remult.repo(CampRegistration).count(where)

    return {
      campRegistrations,
      totalRecords
    }
  }

  @BackendMethod({ allowed: true })
  static async deleteCampRegistration(campRegistrationId: string): Promise<void> {
    await remult.repo(CampRegistration).delete(campRegistrationId)
  }

  @BackendMethod({ allowed: true })
  static async createCampRegistration(campRegistrationData: {
    campCycleId: string
    childId: string
    registrationStatus: any
    registrationDate: Date
    price: number
    chargeStatus: any
    notes: string
  }): Promise<CampRegistration> {
    const campRegistration = remult.repo(CampRegistration).create()
    campRegistration.campCycleId = campRegistrationData.campCycleId
    campRegistration.childId = campRegistrationData.childId
    campRegistration.registrationStatus = campRegistrationData.registrationStatus
    campRegistration.registrationDate = campRegistrationData.registrationDate
    campRegistration.price = campRegistrationData.price
    campRegistration.chargeStatus = campRegistrationData.chargeStatus
    campRegistration.notes = campRegistrationData.notes
    await campRegistration.save()
    return campRegistration
  }

  @BackendMethod({ allowed: true })
  static async updateCampRegistration(
    campRegistrationId: string,
    campRegistrationData: {
      campCycleId: string
      childId: string
      registrationStatus: any
      registrationDate: Date
      price: number
      chargeStatus: any
      notes: string
    }
  ): Promise<CampRegistration> {
    const campRegistration = await remult.repo(CampRegistration).findId(campRegistrationId)
    if (!campRegistration) {
      throw new Error('רישום לא נמצא')
    }
    campRegistration.campCycleId = campRegistrationData.campCycleId
    campRegistration.childId = campRegistrationData.childId
    campRegistration.registrationStatus = campRegistrationData.registrationStatus
    campRegistration.registrationDate = campRegistrationData.registrationDate
    campRegistration.price = campRegistrationData.price
    campRegistration.chargeStatus = campRegistrationData.chargeStatus
    campRegistration.notes = campRegistrationData.notes
    await campRegistration.save()
    return campRegistration
  }
}
