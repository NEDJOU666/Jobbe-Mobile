import { Hono } from 'hono'
import type { AppEnv } from '@/types'
import { db } from '@/db'
import { authMiddleware } from '@/middleware/auth'

const stats = new Hono<AppEnv>()

stats.use('*', authMiddleware)

// ─── GET /stats — user stats dashboard ───────────────────────────────────────

stats.get('/', async (c) => {
  const userId = c.get('userId')

  const [applications, savedCount, profileViews] = await Promise.all([
    db.application.findMany({
      where:   { user_id: userId },
      select:  { status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.savedPost.count({ where: { user_id: userId } }),
    // Profile view count placeholder (not tracked yet)
    Promise.resolve(0),
  ])

  const total = applications.length

  // Current status of each application (last element in status array)
  const statusCounts: Record<string, number> = {}
  for (const app of applications) {
    const current = app.status[app.status.length - 1] as string
    statusCounts[current] = (statusCounts[current] ?? 0) + 1
  }

  const interviews = statusCounts['INTERVIEW'] ?? 0
  const offers = statusCounts['OFFER'] ?? 0
  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0

  // Recent activity (last 7 applications)
  const recent = applications.slice(0, 7).map((a) => ({
    status: a.status[a.status.length - 1],
    date:   a.createdAt,
  }))

  return c.json({
    applied: total,
    interviews,
    offers,
    saved: savedCount,
    profileViews,
    interviewRate,
    statusCounts,
    recentActivity: recent,
  })
})

export default stats
