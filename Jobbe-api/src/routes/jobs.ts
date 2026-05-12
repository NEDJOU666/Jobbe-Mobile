import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppEnv } from '@/types'
import { db } from '@/db'
import { authMiddleware } from '@/middleware/auth'

const jobs = new Hono<AppEnv>()

const firmSelect = {
  id: true,
  name: true,
  logo: true,
  city: true,
  country: true,
  domain_role: true,
  size: true,
  status: true,
}

// ─── GET /jobs — list published posts ────────────────────────────────────────

jobs.get(
  '/',
  zValidator('query', z.object({
    skip:   z.coerce.number().int().min(0).optional().default(0),
    take:   z.coerce.number().int().min(1).max(50).optional().default(20),
    search: z.string().optional(),
    type:   z.enum(['REMOTE', 'ONSITE', 'HYBRID']).optional(),
    emp:    z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  })),
  async (c) => {
    const { skip, take, search, type, emp } = c.req.valid('query')

    const where: any = { status: 'PUBLISHED' }
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (type) where.locationType = type
    if (emp)  where.employmentType = emp

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          firm: { select: firmSelect },
          _count: { select: { applications: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      db.post.count({ where }),
    ])

    return c.json({ data: posts, total, skip, take })
  },
)

// ─── GET /jobs/:id — post detail (increments viewCount) ──────────────────────

jobs.get('/:id', async (c) => {
  const id = c.req.param('id')

  const post = await db.post.findUnique({
    where: { id },
    include: {
      firm: { select: { ...firmSelect, description: true, website: true } },
      _count: { select: { applications: true } },
    },
  })

  if (!post) return c.json({ message: 'Post not found' }, 404)

  // Fire and forget
  db.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  return c.json(post)
})

// ─── GET /jobs/:id/saved — check if current user saved this post ──────────────

jobs.get('/:id/saved', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const postId = c.req.param('id')

  const saved = await db.savedPost.findUnique({
    where: { post_id_user_id: { post_id: postId, user_id: userId } },
  })

  return c.json({ saved: !!saved })
})

export default jobs
