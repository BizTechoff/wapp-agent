import { BackendMethod, Controller, remult } from 'remult'
import { Roles } from '../../app/users/roles'
import { Tenant } from '../../app/tenants/tenant'

@Controller('tenants')
export class TenantsController {

  @BackendMethod({ allowed: Roles.admin })
  static async generateNewApiKey(tenantId: string): Promise<string> {
    const tenant = await remult.repo(Tenant).findId(tenantId)
    if (!tenant) {
      throw new Error('Tenant not found')
    }

    tenant.apiKey = crypto.randomUUID()
    await tenant.save()

    return tenant.apiKey
  }

  @BackendMethod({ allowed: Roles.admin })
  static async resetMessageCount(tenantId: string): Promise<void> {
    const tenant = await remult.repo(Tenant).findId(tenantId)
    if (!tenant) {
      throw new Error('Tenant not found')
    }

    tenant.messagesSent = 0
    await tenant.save()
  }

  @BackendMethod({ allowed: true })
  static async validateApiKey(apiKey: string): Promise<Tenant | null> {
    if (!apiKey) return null

    return await remult.repo(Tenant).findFirst({
      apiKey,
      isActive: true
    }) ?? null
  }

  @BackendMethod({ allowed: Roles.admin })
  static async getTenantStats(tenantId: string): Promise<TenantStats> {
    const tenant = await remult.repo(Tenant).findId(tenantId)
    if (!tenant) {
      throw new Error('Tenant not found')
    }

    return {
      messagesSent: tenant.messagesSent,
      messageQuota: tenant.messageQuota,
      quotaUsedPercent: tenant.messageQuota > 0
        ? Math.round((tenant.messagesSent / tenant.messageQuota) * 100)
        : 0,
      canSend: tenant.canSend,
      canReceive: tenant.canReceive,
      isActive: tenant.isActive
    }
  }
}

interface TenantStats {
  messagesSent: number
  messageQuota: number
  quotaUsedPercent: number
  canSend: boolean
  canReceive: boolean
  isActive: boolean
}
