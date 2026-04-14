import { Component, OnInit } from '@angular/core'
import { remult } from 'remult'
import { ProviderConfig } from '../provider-config'
import { ProvidersService } from '../providers.service'
import { UIToolsService } from '../../common/UIToolsService'
import { terms } from '../../terms'

@Component({
  selector: 'app-provider-list',
  standalone: false,
  templateUrl: './provider-list.component.html',
  styleUrls: ['./provider-list.component.scss']
})
export class ProviderListComponent implements OnInit {
  terms = terms
  ProviderConfig = ProviderConfig
  providers: ProviderConfig[] = []
  loading = true
  statusMap: Map<string, { connected: boolean; phone?: string }> = new Map()

  constructor(
    private providersService: ProvidersService,
    private ui: UIToolsService
  ) {}

  async ngOnInit() {
    await this.loadProviders()
  }

  async loadProviders() {
    this.loading = true
    try {
      this.providers = await this.providersService.getAll()
      // Load status for each provider
      for (const provider of this.providers) {
        this.loadStatus(provider.id)
      }
    } finally {
      this.loading = false
    }
  }

  async loadStatus(providerId: string) {
    try {
      const status = await this.providersService.getStatus(providerId)
      this.statusMap.set(providerId, status)
    } catch {
      this.statusMap.set(providerId, { connected: false })
    }
  }

  getStatus(providerId: string) {
    return this.statusMap.get(providerId)
  }

  async addProvider() {
    const changed = await this.ui.openProviderDetails()
    if (changed) {
      await this.loadProviders()
    }
  }

  async editProvider(provider: ProviderConfig) {
    const changed = await this.ui.openProviderDetails(provider.id)
    if (changed) {
      await this.loadProviders()
    }
  }

  async deleteProvider(provider: ProviderConfig) {
    if (await this.ui.confirmDelete(provider.displayName || provider.instanceId)) {
      await this.providersService.delete(provider)
      await this.loadProviders()
    }
  }

  async setAsDefault(provider: ProviderConfig) {
    await this.providersService.setAsDefault(provider.id)
    await this.loadProviders()
    this.ui.info('הוגדר כברירת מחדל')
  }
}
