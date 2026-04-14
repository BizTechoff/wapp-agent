import { ValueListFieldType } from 'remult'

@ValueListFieldType()
export class MessageType {
  static text = new MessageType('text', 'טקסט')
  static image = new MessageType('image', 'תמונה')
  static document = new MessageType('document', 'מסמך')
  static audio = new MessageType('audio', 'אודיו')
  static video = new MessageType('video', 'וידאו')
  static location = new MessageType('location', 'מיקום')
  static contact = new MessageType('contact', 'איש קשר')

  constructor(public id: string, public caption: string) {}
}
