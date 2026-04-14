import { Component, OnInit } from '@angular/core'
import { remult } from 'remult'
import { Tenant } from '../tenant'
import { TenantsService } from '../tenants.service'
import { UIToolsService } from '../../common/UIToolsService'
import { terms } from '../../terms'

@Component({
  selector: 'app-tenant-list',
  standalone: false,
  templateUrl: './tenant-list.component.html',
  styleUrls: ['./tenant-list.component.scss']
})
export class TenantListComponent implements OnInit {
  terms = terms
  Tenant = Tenant
  tenants: Tenant[] = []
  loading = true

  constructor(
    private tenantsService: TenantsService,
    private ui: UIToolsService
  ) {}

  async ngOnInit() {
    await this.loadTenants()
  }

  async loadTenants() {
    this.loading = true
    try {
      this.tenants = await this.tenantsService.getAll()
    } finally {
      this.loading = false
    }
  }

  async addTenant() {
    const changed = await this.ui.openTenantDetails()
    if (changed) {
      await this.loadTenants()
    }
  }

  async editTenant(tenant: Tenant) {
    const changed = await this.ui.openTenantDetails(tenant.id)
    if (changed) {
      await this.loadTenants()
    }
  }

  async deleteTenant(tenant: Tenant) {
    if (await this.ui.confirmDelete(tenant.name)) {
      await this.tenantsService.delete(tenant)
      await this.loadTenants()
    }
  }
}
