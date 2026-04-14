import { BackendMethod, Controller, remult } from 'remult'
import { Roles } from '../../app/users/roles'
import { ProviderConfig } from '../../app/providers/provider-config'
import { ProviderStatus } from '../providers/provider.interface'
import { config } from '../config'

@Controller('providers')
export class ProvidersController {

  // Delegate for getting provider status - will be set by server
  static getStatusDelegate: (instanceId: string, apiToken: string) => Promise<ProviderStatus>

  @BackendMethod({ allowed: true })
  static async getProviderStatus(configId: string): Promise<ProviderStatus> {
    if (config.showDebugLogs) console.log('getProviderStatus called with configId:', configId)

    if (!configId) {
      if (config.showDebugLogs) console.log('getProviderStatus: no configId')
      return { connected: false }
    }

    const providerConfig = await remult.repo(ProviderConfig).findId(configId)
    if (!providerConfig) {
      if (config.showDebugLogs) console.log('getProviderStatus: config not found')
      return { connected: false }
    }
    if (config.showDebugLogs) console.log('getProviderStatus: config found', providerConfig.instanceId)

    if (!ProvidersController.getStatusDelegate) {
      if (config.showDebugLogs) console.log('getProviderStatus: delegate not registered!')
      return { connected: false }
    }

    try {
      if (config.showDebugLogs) console.log('getProviderStatus: calling delegate...')
      const result = await ProvidersController.getStatusDelegate(providerConfig.instanceId, providerConfig.apiToken)
      if (config.showDebugLogs) console.log('getProviderStatus: delegate result', result)
      return {
        connected: result.connected,
        phone: providerConfig.phoneNumber || result.phone
      }
    } catch (err) {
      if (config.showDebugLogs) console.log('getProviderStatus: delegate error', err)
      return { connected: false }
    }
  }

  @BackendMethod({ allowed: Roles.admin })
  static async setAsDefault(configId: string): Promise<void> {
    const config = await remult.repo(ProviderConfig).findId(configId)
    if (!config) {
      throw new Error('Provider config not found')
    }

    // Remove default from other configs for same tenant
    const otherConfigs = await remult.repo(ProviderConfig).find({
      where: {
        tenantId: config.tenantId,
        isDefault: true
      }
    })

    for (const other of otherConfigs) {
      if (other.id !== configId) {
        other.isDefault = false
        await other.save()
      }
    }

    // Set this one as default
    config.isDefault = true
    await config.save()
  }

  @BackendMethod({ allowed: true })
  static async getDefaultConfig(tenantId: string): Promise<ProviderConfig | null> {
    return await remult.repo(ProviderConfig).findFirst({
      tenantId,
      isActive: true,
      isDefault: true
    }) ?? null
  }
}
