import { Hono } from 'hono'
import type { AppEnv } from '@/types'
import { db } from '@/db'
import { authMiddleware } from '@/middleware/auth'

const posts = new Hono<AppEnv>()

// ─── GET /posts/firm/:firmId ─────────────────────────────────────────────────

posts.get('/firm/:firmId', authMiddleware, async (c) => {
  const firmId = c.req.param('firmId')
  const userId = c.get('userId')

  const membership = await db.memberShip.findUnique({
    where: { user_id_firm_id: { user_id: userId, firm_id: firmId } },
  })

  if (!membership) {
    return c.json({ message: 'Forbidden: not a member of this firm' }, 403)
  }

  const firmPosts = await db.post.findMany({
    where: { company_id: firmId },
    orderBy: { createdAt: 'desc' },
  })

  return c.json(firmPosts)
})

export default posts
