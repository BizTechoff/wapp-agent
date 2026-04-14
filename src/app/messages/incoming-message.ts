import { Entity, Fields, IdEntity, Relations, isBackend } from 'remult'
import { terms } from '../terms'
import { Tenant } from '../tenants/tenant'
import { MessageType } from '../../shared/enums/MessageType'

@Entity<IncomingMessage>('incoming-messages', {
  allowApiCrud: true,
  defaultOrderBy: { receivedDate: 'desc' },
  saving: async (message) => {
    if (isBackend()) {
      if (message._.isNew()) {
        message.receivedDate = new Date()
      }
    }
  }
})
export class IncomingMessage extends IdEntity {
  @Fields.string({
    caption: terms.tenantId
  })
  tenantId = ''

  @Relations.toOne(() => Tenant, {
    caption: terms.tenant
  })
  tenant!: Tenant

  @Fields.string({
    caption: terms.mobile
  })
  mobile = ''

  @Fields.string({
    caption: terms.messageText
  })
  text = ''

  @Fields.object({
    caption: terms.messageType
  })
  messageType = MessageType.text

  @Fields.string({
    caption: 'Media URL'
  })
  mediaUrl = ''

  @Fields.string({
    caption: terms.providerMessageId
  })
  providerMessageId = ''

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.receivedDate
  })
  receivedDate = new Date()

  @Fields.boolean({
    caption: terms.callbackSent
  })
  callbackSent = false

  @Fields.date({
    caption: terms.callbackSentDate
  })
  callbackSentDate?: Date

  @Fields.string({
    caption: terms.callbackError
  })
  callbackError = ''

  @Fields.boolean({
    caption: terms.isRead
  })
  isRead = false
}
