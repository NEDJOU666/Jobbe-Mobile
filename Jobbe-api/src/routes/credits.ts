import { Hono } from 'hono'
import type { AppEnv } from '@/types'
import { db } from '@/db'
import { authMiddleware } from '@/middleware/auth'

const credits = new Hono<AppEnv>()

credits.use('*', authMiddleware)

// ─── GET /credits — balance + transaction history ─────────────────────────────

credits.get('/', async (c) => {
  const userId = c.get('userId')

  const [account, transactions] = await Promise.all([
    db.userCredit.findUnique({ where: { user_id: userId } }),
    db.creditTransaction.findMany({
      where:   { user_id: userId },
      orderBy: { createdAt: 'desc' },
      take:    50,
    }),
  ])

  return c.json({
    balance: account?.balance ?? 0,
    transactions,
  })
})

// ─── POST /credits/init — create credit account if missing ───────────────────

credits.post('/init', async (c) => {
  const userId = c.get('userId')

  const account = await db.userCredit.upsert({
    where:  { user_id: userId },
    create: { user_id: userId, balance: 0 },
    update: {},
  })

  return c.json(account)
})

export default credits
