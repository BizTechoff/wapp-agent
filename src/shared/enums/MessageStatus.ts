import { ValueListFieldType } from 'remult'

@ValueListFieldType()
export class MessageStatus {
  static queued = new MessageStatus('queued', 'בתור')
  static sending = new MessageStatus('sending', 'בשליחה')
  static sent = new MessageStatus('sent', 'נשלח')
  static delivered = new MessageStatus('delivered', 'הגיע')
  static read = new MessageStatus('read', 'נקרא')
  static failed = new MessageStatus('failed', 'נכשל')

  constructor(public id: string, public caption: string) {}
}
