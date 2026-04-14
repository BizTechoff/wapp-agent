import { remultApi } from 'remult/remult-express'
import { createPostgresConnection } from 'remult/postgres'
import { config } from '../shared/config'

// Users (kept from original)
import { User } from '../app/users/user'
import { SignInController, getUser } from '../app/users/SignInController'
import { UpdatePasswordController } from '../app/users/UpdatePasswordController'
import { UsersController } from '../shared/controllers/UsersController'

// wapp.agent Entities
import { Tenant } from '../app/tenants/tenant'
import { ProviderConfig } from '../app/providers/provider-config'
import { MessageRequest } from '../app/messages/message-request'
import { MessageFile } from '../app/messages/message-file'
import { IncomingMessage } from '../app/messages/incoming-message'

// wapp.agent Controllers
import { TenantsController } from '../shared/controllers/TenantsController'
import { ProvidersController } from '../shared/controllers/ProvidersController'
import { MessagesController } from '../shared/controllers/MessagesController'

// Provider setup
import { createProviderAdapter } from './providers'
import { FairMessageQueueService } from '../shared/services/fair-queue.service'
import { remult } from 'remult'

export const entities = [
  User,
  Tenant,
  ProviderConfig,
  MessageRequest,
  MessageFile,
  IncomingMessage
]

export const api = remultApi({
  admin: true,
  controllers: [
    SignInController,
    UpdatePasswordController,
    UsersController,
    TenantsController,
    ProvidersController,
    MessagesController
  ],
  entities,
  getUser,
  dataProvider: async () => {
    const provider = await createPostgresConnection({
      sslInDev: !(process.env['DEV_MODE'] === 'DEV')
    })
    return provider
  },
  initApi: async r => {
    console.info('[API] Config loaded:', { showDebugLogs: config.showDebugLogs })

    // Register delegates for message sending
    FairMessageQueueService.sendDelegate = async (tenantId, message) => {
      const config = await remult.repo(ProviderConfig).findFirst({
        tenantId,
        isActive: true,
        isDefault: true
      })

      if (!config) {
        return { success: false, error: 'No provider config' }
      }

      const adapter = createProviderAdapter(
        config.providerType,
        config.instanceId,
        config.apiToken
      )

      return await adapter.sendText({
        mobile: message.mobile,
        text: message.text,
        replyToMessageId: message.replyToMessageId
      })
    }
    console.info('FairMessageQueueService.sendDelegate registered.')

    // Register delegate for provider status
    ProvidersController.getStatusDelegate = async (instanceId, apiToken) => {
      const adapter = createProviderAdapter(
        (await import('../shared/enums/ProviderType')).ProviderType.greenApi,
        instanceId,
        apiToken
      )
      return await adapter.getInstanceStatus()
    }
    console.info('ProvidersController.getStatusDelegate registered.')

    // Seed if needed
    // const { seed } = await import('./seed')
    // await seed()
  }
})
