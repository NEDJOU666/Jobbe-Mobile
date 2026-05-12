import type { Context, Next } from 'hono'
import type { AppEnv } from '@/types'
import { tokenService } from '@/services/token'

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  try {
    const token = authHeader.slice(7)
    const payload = await tokenService.verifyAccessToken(token)
    c.set('userId', payload.sub)
    await next()
  } catch {
    return c.json({ message: 'Invalid or expired token' }, 401)
  }
}
