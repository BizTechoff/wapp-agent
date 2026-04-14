import { Injectable } from '@angular/core'
import { remult } from 'remult'
import { Tenant } from './tenant'
import { TenantsController } from '../../shared/controllers/TenantsController'

@Injectable({
  providedIn: 'root'
})
export class TenantsService {
  repo = remult.repo(Tenant)

  async getAll() {
    return await this.repo.find({
      orderBy: { name: 'asc' }
    })
  }

  async getById(id: string) {
    return await this.repo.findId(id)
  }

  async save(tenant: Tenant) {
    return await this.repo.save(tenant)
  }

  async delete(tenant: Tenant) {
    return await this.repo.delete(tenant)
  }

  async generateNewApiKey(tenantId: string) {
    return await TenantsController.generateNewApiKey(tenantId)
  }

  async resetMessageCount(tenantId: string) {
    return await TenantsController.resetMessageCount(tenantId)
  }

  async getTenantStats(tenantId: string) {
    return await TenantsController.getTenantStats(tenantId)
  }
}
