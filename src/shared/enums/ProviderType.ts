import { ValueListFieldType } from 'remult'

@ValueListFieldType()
export class ProviderType {
  static greenApi = new ProviderType('green-api', 'Green-API')
  static metaApi = new ProviderType('meta-api', 'Meta WhatsApp API')

  constructor(public id: string, public caption: string) {}
}
