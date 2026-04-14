import compression from 'compression'
import session from 'cookie-session'
import { config } from 'dotenv'
import express from 'express'
import fs from 'fs'
import helmet from 'helmet'
import sslRedirect from 'heroku-ssl-redirect'
import path from 'path'
config()

import { api } from './api'
import { handleGreenApiWebhook } from './webhooks/greenapi.webhook'
import { MessagesController } from '../shared/controllers/MessagesController'

async function startup() {
  const app = express()

  app.use(sslRedirect())
  app.use(compression())
  app.use(helmet({ contentSecurityPolicy: false }))
  app.use(express.json())

  // Session for /api routes
  app.use(
    '/api',
    session({
      secret:
        process.env['NODE_ENV'] === 'production'
          ? process.env['SESSION_SECRET']!
          : process.env['SESSION_SECRET_DEV'] || 'wapp-agent-secret-dev-key',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    })
  )

  // Explicit send endpoint (before Remult)
  app.post('/api/send', async (req, res) => {
    console.log('=== /api/send called ===', req.body)
    try {
      const result = await MessagesController.sendMessage(req.body)
      res.json(result)
    } catch (error: any) {
      console.error('Send error:', error.message)
      res.status(400).json({ error: error.message })
    }
  })

  // Green-API Webhook endpoint
  app.post('/api/wapp/received', async (req, res) => {
    // Step 1: Respond immediately (don't block webhook)
    res.status(200).send('OK')
    console.log('WOWWW', JSON.stringify(req.body))

    // Step 2: Process asynchronously
    setImmediate(async () => {
      try {
        await handleGreenApiWebhook(req.body)
      } catch (error) {
        console.error('Webhook processing error:', error)
      }
    })
  })

  // Remult API (mounted on /api)
  app.use(api)
  // Note: withRemult provides context for async operations outside request cycle

  // Serve Angular app
  let dist = path.resolve('dist/wapp-agent/browser')
  if (!fs.existsSync(dist)) {
    dist = path.resolve('../wapp-agent/browser')
  }
  app.use(express.static(dist))
  app.use('/*', async (req, res) => {
    if (req.headers.accept?.includes('json')) {
      res.status(404).json('missing route: ' + req.originalUrl)
      return
    }
    try {
      res.sendFile(dist + '/index.html')
    } catch (err) {
      res.sendStatus(500)
    }
  })

  const port = process.env['PORT'] || 3002
  app.listen(port, () => {
    console.log(`wapp.agent server running on port ${port}`)
  })
}

startup()
