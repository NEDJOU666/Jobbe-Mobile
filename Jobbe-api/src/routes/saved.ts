import { Hono } from 'hono'
import type { AppEnv } from '@/types'
import { db } from '@/db'
import { authMiddleware } from '@/middleware/auth'

const saved = new Hono<AppEnv>()

saved.use('*', authMiddleware)

const postInclude = {
  firm: { select: { id: true, name: true, logo: true, city: true, country: true } },
  _count: { select: { applications: true } },
}

// ─── GET /saved — list saved posts ───────────────────────────────────────────

saved.get('/', async (c) => {
  const userId = c.get('userId')

  const rows = await db.savedPost.findMany({
    where:   { user_id: userId },
    include: { post: { include: postInclude } },
    orderBy: { createdAt: 'desc' },
  })

  return c.json(rows.map((r) => r.post))
})

// ─── POST /saved/:postId — toggle save ───────────────────────────────────────

saved.post('/:postId', async (c) => {
  const userId = c.get('userId')
  const postId = c.req.param('postId')

  const post = await db.post.findUnique({ where: { id: postId }, select: { id: true } })
  if (!post) return c.json({ message: 'Post not found' }, 404)

  const existing = await db.savedPost.findUnique({
    where: { post_id_user_id: { post_id: postId, user_id: userId } },
  })

  if (existing) {
    await db.savedPost.delete({ where: { id: existing.id } })
    return c.json({ saved: false })
  }

  await db.savedPost.create({ data: { post_id: postId, user_id: userId } })
  return c.json({ saved: true }, 201)
})

export default saved
