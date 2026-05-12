import { Hono } from 'hono'
import type { AppEnv } from '@/types'
import { db } from '@/db'
import { authMiddleware } from '@/middleware/auth'

const notifications = new Hono<AppEnv>()

notifications.use('*', authMiddleware)

// ─── GET /notifications — recent notifications + unread count ─────────────────

notifications.get('/', async (c) => {
  const userId = c.get('userId')

  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where:   { user_id: userId },
      orderBy: { createdAt: 'desc' },
      take:    50,
    }),
    db.notification.count({ where: { user_id: userId, isRead: false } }),
  ])

  return c.json({ data: items, unreadCount })
})

// ─── PATCH /notifications/:id/read ────────────────────────────────────────────

notifications.patch('/:id/read', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  await db.notification.updateMany({
    where: { id, user_id: userId },
    data:  { isRead: true },
  })

  return c.json({ ok: true })
})

// ─── POST /notifications/read-all ────────────────────────────────────────────

notifications.post('/read-all', async (c) => {
  const userId = c.get('userId')

  await db.notification.updateMany({
    where: { user_id: userId, isRead: false },
    data:  { isRead: true },
  })

  return c.json({ ok: true })
})

export default notifications
