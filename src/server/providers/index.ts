// Provider Factory

import { IProviderAdapter } from '../../shared/providers/provider.interface'
import { GreenApiAdapter } from './greenapi.adapter'
import { ProviderType } from '../../shared/enums/ProviderType'

export function createProviderAdapter(
  providerType: ProviderType,
  instanceId: string,
  apiToken: string
): IProviderAdapter {

  switch (providerType.id) {
    case ProviderType.greenApi.id:
      return new GreenApiAdapter(instanceId, apiToken)

    // Future:
    // case ProviderType.metaApi.id:
    //   return new MetaApiAdapter(instanceId, apiToken)

    default:
      throw new Error(`Unknown provider: ${providerType.id}`)
  }
}
