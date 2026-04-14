import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { remult } from 'remult'
import { Tenant } from '../tenant'
import { TenantsService } from '../tenants.service'
import { UIToolsService } from '../../common/UIToolsService'
import { terms } from '../../terms'

@Component({
  selector: 'app-tenant-details',
  standalone: false,
  templateUrl: './tenant-details.component.html',
  styleUrls: ['./tenant-details.component.scss']
})
export class TenantDetailsComponent implements OnInit {
  terms = terms
  tenant!: Tenant
  isNew = true
  changed = false
  args: { tenantId: string } = { tenantId: '' }

  constructor(
    private dialogRef: MatDialogRef<TenantDetailsComponent>,
    private tenantsService: TenantsService,
    private ui: UIToolsService
  ) {}

  async ngOnInit() {
    if (this.args.tenantId) {
      this.tenant = (await this.tenantsService.getById(this.args.tenantId))!
      this.isNew = false
    } else {
      this.tenant = remult.repo(Tenant).create()
      this.isNew = true
    }
  }

  async save() {
    try {
      await this.tenantsService.save(this.tenant)
      this.changed = true
      this.dialogRef.close()
    } catch (error: any) {
      this.ui.error(error)
    }
  }

  async generateApiKey() {
    if (!this.isNew && this.tenant.id) {
      const confirmed = await this.ui.yesNoQuestion('האם ליצור מפתח API חדש? המפתח הישן יפסיק לעבוד.', true)
      if (confirmed) {
        this.tenant.apiKey = await this.tenantsService.generateNewApiKey(this.tenant.id)
        this.ui.info('מפתח API חדש נוצר')
      }
    } else {
      this.tenant.apiKey = crypto.randomUUID()
    }
  }

  async resetMessageCount() {
    const confirmed = await this.ui.yesNoQuestion('האם לאפס את מספר ההודעות שנשלחו?', true)
    if (confirmed && this.tenant.id) {
      await this.tenantsService.resetMessageCount(this.tenant.id)
      this.tenant.messagesSent = 0
      this.ui.info('מונה ההודעות אופס')
    }
  }

  copyApiKey() {
    navigator.clipboard.writeText(this.tenant.apiKey)
    this.ui.info('מפתח API הועתק ללוח')
  }

  close() {
    this.dialogRef.close()
  }
}
