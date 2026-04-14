import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { remult } from 'remult'
import { ProviderConfig } from '../provider-config'
import { Tenant } from '../../tenants/tenant'
import { ProvidersService } from '../providers.service'
import { TenantsService } from '../../tenants/tenants.service'
import { UIToolsService } from '../../common/UIToolsService'
import { ProviderType } from '../../../shared/enums/ProviderType'
import { terms } from '../../terms'

@Component({
  selector: 'app-provider-details',
  standalone: false,
  templateUrl: './provider-details.component.html',
  styleUrls: ['./provider-details.component.scss']
})
export class ProviderDetailsComponent implements OnInit {
  terms = terms
  config!: ProviderConfig
  tenants: Tenant[] = []
  providerTypes = [ProviderType.greenApi, ProviderType.metaApi]
  isNew = true
  changed = false
  connectionStatus: { connected: boolean; phone?: string } | null = null
  args: { providerId: string } = { providerId: '' }

  constructor(
    private dialogRef: MatDialogRef<ProviderDetailsComponent>,
    private providersService: ProvidersService,
    private tenantsService: TenantsService,
    private ui: UIToolsService
  ) {}

  async ngOnInit() {
    // Load tenants for dropdown
    this.tenants = await this.tenantsService.getAll()

    if (this.args.providerId) {
      this.config = (await this.providersService.getById(this.args.providerId))!
      this.isNew = false
      await this.checkConnection()
    } else {
      this.config = remult.repo(ProviderConfig).create()
      this.config.providerType = ProviderType.greenApi
      this.isNew = true
    }
  }

  async checkConnection() {
    if (this.config.id) {
      try {
        this.connectionStatus = await this.providersService.getStatus(this.config.id)
      } catch {
        this.connectionStatus = { connected: false }
      }
    }
  }

  async save() {
    try {
      await this.providersService.save(this.config)
      this.changed = true
      this.dialogRef.close()
    } catch (error: any) {
      this.ui.error(error)
    }
  }

  close() {
    this.dialogRef.close()
  }

  compareById(a: any, b: any): boolean {
    return a?.id === b?.id
  }
}
