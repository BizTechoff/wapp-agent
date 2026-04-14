import { ValueListFieldType } from 'remult'

@ValueListFieldType()
export class FileType {
  static image = new FileType('image', 'תמונה')
  static document = new FileType('document', 'מסמך')
  static audio = new FileType('audio', 'אודיו')
  static video = new FileType('video', 'וידאו')

  constructor(public id: string, public caption: string) {}
}
