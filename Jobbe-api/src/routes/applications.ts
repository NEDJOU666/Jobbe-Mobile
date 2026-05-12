import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppEnv } from '@/types'
import { db } from '@/db'
import { authMiddleware } from '@/middleware/auth'

const applications = new Hono<AppEnv>()

applications.use('*', authMiddleware)

const postSelect = {
  id: true,
  title: true,
  location: true,
  locationType: true,
  employmentType: true,
  applicationDeadline: true,
  applyType: true,
  properties: true,
}

const firmSelect = {
  id: true,
  name: true,
  logo: true,
  city: true,
  country: true,
}

// ─── GET /applications/me — user's applications ───────────────────────────────

applications.get('/me', async (c) => {
  const userId = c.get('userId')

  const apps = await db.application.findMany({
    where: { user_id: userId },
    include: {
      post: { select: postSelect },
      firm: { select: firmSelect },
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json(apps)
})

// ─── POST /applications/post/:postId — apply ─────────────────────────────────

applications.post(
  '/post/:postId',
  zValidator('json', z.object({
    coverLetter: z.string().max(1000).optional(),
    resumeName:  z.string().optional(),
    documents:   z.any().optional(),
  })),
  async (c) => {
    const userId = c.get('userId')
    const postId = c.req.param('postId')
    const { coverLetter, resumeName, documents } = c.req.valid('json')

    const post = await db.post.findUnique({ where: { id: postId } })
    if (!post) return c.json({ message: 'Post not found' }, 404)
    if (post.status !== 'PUBLISHED') return c.json({ message: 'This post is no longer accepting applications' }, 400)

    const existing = await db.application.findUnique({
      where: { post_id_user_id: { post_id: postId, user_id: userId } },
    })
    if (existing) return c.json({ message: 'You already applied to this post' }, 409)

    // Credit check for paid posts
    let creditSpent = 0
    if (post.isPaid && post.creditCost > 0) {
      const credit = await db.userCredit.findUnique({ where: { user_id: userId } })
      if (!credit || credit.balance < post.creditCost) {
        return c.json({ message: 'Insufficient credits to apply for this job' }, 402)
      }

      await db.$transaction([
        db.userCredit.update({
          where: { user_id: userId },
          data: { balance: { decrement: post.creditCost } },
        }),
        db.creditTransaction.create({
          data: {
            user_id: userId,
            amount: post.creditCost,
            type: 'SPEND',
            description: `Applied to: ${post.title}`,
          },
        }),
      ])
      creditSpent = post.creditCost
    }

    const application = await db.application.create({
      data: {
        post_id: postId,
        user_id: userId,
        firm_id: post.company_id,
        coverLetter,
        documents: documents ?? (resumeName ? { resumeName } : undefined),
        status: ['PENDING_REVIEW'],
        creditSpent,
      },
      include: {
        post: { select: postSelect },
        firm: { select: firmSelect },
      },
    })

    // Notify user
    await db.notification.create({
      data: {
        user_id: userId,
        type: 'APPLICATION_SUBMITTED',
        title: 'Application Submitted',
        message: `Your application for ${post.title} has been received.`,
      },
    }).catch(() => {})

    return c.json(application, 201)
  },
)

// ─── DELETE /applications/:id/withdraw ────────────────────────────────────────

applications.delete('/:id/withdraw', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const app = await db.application.findUnique({
    where: { id },
    include: { post: { select: { title: true } } },
  })

  if (!app || app.user_id !== userId) return c.json({ message: 'Application not found' }, 404)

  const current = app.status[app.status.length - 1]
  if (current !== 'PENDING_REVIEW' && current !== 'REVIEWING') {
    return c.json({ message: 'Cannot withdraw an application at this stage' }, 403)
  }

  // Refund credits
  if (app.creditSpent > 0) {
    await db.$transaction([
      db.userCredit.update({
        where: { user_id: userId },
        data: { balance: { increment: app.creditSpent } },
      }),
      db.creditTransaction.create({
        data: {
          user_id: userId,
          amount: app.creditSpent,
          type: 'REFUND',
          referenceId: app.id,
          description: `Refund: withdrawn from ${app.post.title}`,
        },
      }),
    ])
  }

  await db.application.delete({ where: { id } })

  return c.json({ message: 'Application withdrawn successfully' })
})

export default applications
