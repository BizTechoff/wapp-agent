import { Entity, Fields, IdEntity, Relations, Validators, isBackend } from 'remult'
import { terms } from '../terms'
import { Roles } from '../users/roles'
import { Tenant } from '../tenants/tenant'
import { ProviderType } from '../../shared/enums/ProviderType'

@Entity<ProviderConfig>('provider-configs', {
  allowApiCrud: Roles.admin,
  defaultOrderBy: { createDate: 'desc' },
  saving: async (config) => {
    if (isBackend()) {
      if (config._.isNew()) {
        config.createDate = new Date()
      }
    }
  }
})
export class ProviderConfig extends IdEntity {
  @Fields.string({
    caption: terms.tenantId
  })
  tenantId = ''

  @Relations.toOne(() => Tenant, {
    caption: terms.tenant,
    field: 'tenantId'
  })
  tenant!: Tenant

  @Fields.object({
    caption: terms.providerType
  })
  providerType = ProviderType.greenApi

  @Fields.string({
    validate: [Validators.required(terms.requiredFiled)],
    caption: terms.instanceId
  })
  instanceId = ''

  @Fields.string({
    validate: [Validators.required(terms.requiredFiled)],
    caption: terms.apiToken,
    includeInApi: true
  })
  apiToken = ''

  @Fields.string({
    caption: terms.phoneNumber
  })
  phoneNumber = ''

  @Fields.string({
    caption: terms.displayName
  })
  displayName = ''

  @Fields.boolean({
    caption: terms.isDefault
  })
  isDefault = true

  @Fields.boolean({
    caption: terms.isActive
  })
  isActive = true

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate
  })
  createDate = new Date()
}
