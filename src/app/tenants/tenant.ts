import { Entity, Fields, IdEntity, Validators, isBackend } from 'remult'
import { terms } from '../terms'
import { Roles } from '../users/roles'

@Entity<Tenant>('tenants', {
  allowApiCrud: Roles.admin,
  defaultOrderBy: { name: 'asc' },
  saving: async (tenant) => {
    if (isBackend()) {
      if (tenant._.isNew()) {
        tenant.createDate = new Date()
        if (!tenant.apiKey) {
          tenant.apiKey = crypto.randomUUID()
        }
      }
    }
  }
})
export class Tenant extends IdEntity {
  @Fields.string({
    validate: [Validators.required(terms.requiredFiled)],
    caption: terms.tenantName
  })
  name = ''

  @Fields.string({
    validate: [Validators.required(terms.requiredFiled), Validators.uniqueOnBackend(terms.uniqueFiled)],
    caption: terms.apiKey
  })
  apiKey = ''

  @Fields.boolean({
    caption: terms.isActive
  })
  isActive = true

  @Fields.number({
    caption: terms.messageQuota
  })
  messageQuota = 1000

  @Fields.number({
    caption: terms.messagesSent
  })
  messagesSent = 0

  @Fields.boolean({
    caption: terms.canSend
  })
  canSend = true

  @Fields.boolean({
    caption: terms.canReceive
  })
  canReceive = false

  @Fields.string({
    caption: terms.incomingWebhookUrl
  })
  incomingWebhookUrl = ''

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate
  })
  createDate = new Date()
}
