import { Entity, Fields, IdEntity, Relations, Validators, isBackend } from 'remult'
import { terms } from '../terms'
import { MessageRequest } from './message-request'
import { FileType } from '../../shared/enums/FileType'

@Entity<MessageFile>('message-files', {
  allowApiCrud: true,
  defaultOrderBy: { createDate: 'desc' },
  saving: async (file) => {
    if (isBackend()) {
      if (file._.isNew()) {
        file.createDate = new Date()
      }
    }
  }
})
export class MessageFile extends IdEntity {
  @Fields.string({
    caption: terms.messageRequestId
  })
  messageRequestId = ''

  @Relations.toOne(() => MessageRequest, {
    caption: terms.message
  })
  messageRequest!: MessageRequest

  @Fields.object({
    caption: terms.fileType
  })
  fileType = FileType.image

  @Fields.string({
    validate: [Validators.required(terms.requiredFiled)],
    caption: 'URL'
  })
  url = ''

  @Fields.string({
    caption: terms.name
  })
  fileName = ''

  @Fields.number({
    caption: 'גודל קובץ'
  })
  fileSize = 0

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate
  })
  createDate = new Date()
}
