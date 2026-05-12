import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppEnv } from '@/types'
import { db } from '@/db'
import { authMiddleware } from '@/middleware/auth'

const documents = new Hono<AppEnv>()

documents.use('*', authMiddleware)

// ─── GET /documents — list user's documents ───────────────────────────────────

documents.get('/', async (c) => {
  const userId = c.get('userId')
  const docs = await db.userDocument.findMany({
    where:   { user_id: userId },
    orderBy: { createdAt: 'desc' },
  })
  return c.json(docs)
})

// ─── POST /documents — add document metadata ──────────────────────────────────

documents.post(
  '/',
  zValidator('json', z.object({
    name:         z.string().min(1).max(200),
    documentType: z.enum(['RESUME', 'COVER_LETTER', 'CERTIFICATE', 'OTHER']).default('RESUME'),
    size:         z.string().optional(),
    url:          z.string().optional(),
  })),
  async (c) => {
    const userId = c.get('userId')
    const { name, documentType, size, url } = c.req.valid('json')

    const doc = await db.userDocument.create({
      data: { user_id: userId, name, documentType, size, url },
    })

    return c.json(doc, 201)
  },
)

// ─── PATCH /documents/:id/default — set as default resume ────────────────────

documents.patch('/:id/default', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const doc = await db.userDocument.findUnique({ where: { id } })
  if (!doc || doc.user_id !== userId) return c.json({ message: 'Document not found' }, 404)

  // Unset all resumes, then set this one
  await db.$transaction([
    db.userDocument.updateMany({
      where: { user_id: userId, documentType: 'RESUME' },
      data:  { isDefault: false },
    }),
    db.userDocument.update({
      where: { id },
      data:  { isDefault: true },
    }),
  ])

  return c.json({ ok: true })
})

// ─── DELETE /documents/:id ────────────────────────────────────────────────────

documents.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const doc = await db.userDocument.findUnique({ where: { id } })
  if (!doc || doc.user_id !== userId) return c.json({ message: 'Document not found' }, 404)

  await db.userDocument.delete({ where: { id } })
  return c.json({ ok: true })
})

export default documents
