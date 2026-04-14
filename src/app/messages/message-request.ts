import { Entity, Fields, IdEntity, Relations, Validators, isBackend } from 'remult'
import { terms } from '../terms'
import { Tenant } from '../tenants/tenant'
import { MessageStatus } from '../../shared/enums/MessageStatus'
import { ProviderType } from '../../shared/enums/ProviderType'

@Entity<MessageRequest>('message-requests', {
  allowApiCrud: true,
  defaultOrderBy: { createDate: 'desc' },
  saving: async (message) => {
    if (isBackend()) {
      if (message._.isNew()) {
        message.createDate = new Date()
      }
    }
  }
})
export class MessageRequest extends IdEntity {
  @Fields.string({
    caption: terms.tenantId
  })
  tenantId = ''

  @Relations.toOne(() => Tenant, {
    caption: terms.tenant,
    field: 'tenantId'
  })
  tenant!: Tenant

  @Fields.string({
    validate: [Validators.required(terms.requiredFiled)],
    caption: terms.mobile
  })
  mobile = ''

  @Fields.string({
    caption: terms.messageText
  })
  text = ''

  @Fields.object({
    caption: terms.providerType
  })
  providerType = ProviderType.greenApi

  @Fields.string({
    caption: terms.batchId
  })
  batchId = ''

  @Fields.object({
    caption: terms.status
  })
  status = MessageStatus.queued

  @Fields.string({
    caption: terms.providerMessageId
  })
  providerMessageId = ''

  @Fields.string({
    caption: terms.errorMessage
  })
  errorMessage = ''

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate
  })
  createDate = new Date()

  @Fields.date({
    caption: terms.sentDate
  })
  sentDate?: Date

  @Fields.date({
    caption: terms.deliveredDate
  })
  deliveredDate?: Date

  @Fields.date({
    caption: terms.readDate
  })
  readDate?: Date
}
