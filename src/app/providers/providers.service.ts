import { Injectable } from '@angular/core'
import { remult } from 'remult'
import { ProviderConfig } from './provider-config'
import { ProvidersController } from '../../shared/controllers/ProvidersController'

@Injectable({
  providedIn: 'root'
})
export class ProvidersService {
  repo = remult.repo(ProviderConfig)

  async getAll() {
    return await this.repo.find({
      include: { tenant: true },
      orderBy: { createDate: 'desc' }
    })
  }

  async getByTenant(tenantId: string) {
    return await this.repo.find({
      where: { tenantId },
      orderBy: { isDefault: 'desc', createDate: 'desc' }
    })
  }

  async getById(id: string) {
    return await this.repo.findId(id)
  }

  async save(config: ProviderConfig) {
    return await this.repo.save(config)
  }

  async delete(config: ProviderConfig) {
    return await this.repo.delete(config)
  }

  async getStatus(configId: string) {
    return await ProvidersController.getProviderStatus(configId)
  }

  async setAsDefault(configId: string) {
    return await ProvidersController.setAsDefault(configId)
  }
}
