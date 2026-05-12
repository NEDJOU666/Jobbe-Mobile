import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppEnv } from '@/types'
import { db } from '@/db'
import { authMiddleware } from '@/middleware/auth'

const profile = new Hono<AppEnv>()

profile.use('*', authMiddleware)

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  isEmailVerified: true,
  createdAt: true,
}

// ─── GET /profile — full profile (user + profile) ────────────────────────────

profile.get('/', async (c) => {
  const userId = c.get('userId')

  const [user, prof] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: userSelect }),
    db.userProfile.findUnique({ where: { user_id: userId } }),
  ])

  if (!user) return c.json({ message: 'User not found' }, 404)

  return c.json({ ...user, profile: prof })
})

// ─── PATCH /profile — update basic info ──────────────────────────────────────

profile.patch(
  '/',
  zValidator('json', z.object({
    name:     z.string().min(2).max(100).optional(),
    headline: z.string().max(120).optional(),
    bio:      z.string().max(500).optional(),
    location: z.string().max(100).optional(),
    phone:    z.string().max(30).optional(),
    website:  z.string().url().optional().or(z.literal('')),
    linkedin: z.string().optional(),
    github:   z.string().optional(),
    skills:   z.array(z.string()).optional(),
    languages:z.array(z.string()).optional(),
    experience: z.any().optional(),
    education:  z.any().optional(),
    openToWork:     z.boolean().optional(),
    profileVisible: z.boolean().optional(),
    showSalary:     z.boolean().optional(),
  })),
  async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')

    const { name, ...profileFields } = body

    const updates: Promise<any>[] = []

    if (name) {
      updates.push(db.user.update({ where: { id: userId }, data: { name } }))
    }

    if (Object.keys(profileFields).length > 0) {
      updates.push(
        db.userProfile.upsert({
          where:  { user_id: userId },
          create: { user_id: userId, ...profileFields },
          update: profileFields,
        }),
      )
    }

    await Promise.all(updates)

    const [user, prof] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: userSelect }),
      db.userProfile.findUnique({ where: { user_id: userId } }),
    ])

    return c.json({ ...user, profile: prof })
  },
)

export default profile
