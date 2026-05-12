import 'dotenv/config'
import app from './app'
import { env } from './env'

// Bun runtime
if (typeof Bun !== 'undefined') {
  const server = Bun.serve({ fetch: app.fetch, port: env.PORT })
  console.log(`JobFinder API (Bun) → http://localhost:${server.port}`)
} else {
  // Node.js fallback via @hono/node-server
  const { serve } = await import('@hono/node-server')
  serve({ fetch: app.fetch, port: env.PORT }, () => {
    console.log(`JobFinder API (Node) → http://localhost:${env.PORT}`)
  })
}
