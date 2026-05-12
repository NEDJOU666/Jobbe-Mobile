import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { AppEnv } from '@/types'
import auth          from '@/routes/auth'
import posts         from '@/routes/posts'
import jobs          from '@/routes/jobs'
import applications  from '@/routes/applications'
import profile       from '@/routes/profile'
import saved         from '@/routes/saved'
import notifications from '@/routes/notifications'
import documents     from '@/routes/documents'
import credits       from '@/routes/credits'
import stats         from '@/routes/stats'

const app = new Hono<AppEnv>().basePath('/api')

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006', 'exp://localhost:8081'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  }),
)

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.route('/auth',          auth)
app.route('/posts',         posts)
app.route('/jobs',          jobs)
app.route('/applications',  applications)
app.route('/profile',       profile)
app.route('/saved',         saved)
app.route('/notifications', notifications)
app.route('/documents',     documents)
app.route('/credits',       credits)
app.route('/stats',         stats)

app.onError((err, c) => {
  console.error(err)
  return c.json({ message: 'Internal server error' }, 500)
})

app.notFound((c) => c.json({ message: `Route ${c.req.path} not found` }, 404))

export default app
