import { sign, verify } from 'hono/jwt'
import { createHash } from 'crypto'
import { env } from '@/env'

function parseExpiryToSeconds(expiry: string): number {
  const unit = expiry.slice(-1)
  const value = parseInt(expiry.slice(0, -1), 10)
  switch (unit) {
    case 'm': return value * 60
    case 'h': return value * 3600
    case 'd': return value * 86400
    default: return value
  }
}

export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

export const tokenService = {
  async signAccessToken(userId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    return sign(
      { sub: userId, iat: now, exp: now + parseExpiryToSeconds(env.JWT_ACCESS_EXPIRY) },
      env.JWT_ACCESS_SECRET,
      'HS256',
    )
  },

  async signRefreshToken(userId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    return sign(
      { sub: userId, iat: now, exp: now + parseExpiryToSeconds(env.JWT_REFRESH_EXPIRY) },
      env.JWT_REFRESH_SECRET,
      'HS256',
    )
  },

  async verifyAccessToken(token: string): Promise<{ sub: string }> {
    return verify(token, env.JWT_ACCESS_SECRET, 'HS256') as Promise<{ sub: string }>
  },

  async verifyRefreshToken(token: string): Promise<{ sub: string }> {
    return verify(token, env.JWT_REFRESH_SECRET, 'HS256') as Promise<{ sub: string }>
  },

  getRefreshExpiry(): Date {
    return new Date(Date.now() + parseExpiryToSeconds(env.JWT_REFRESH_EXPIRY) * 1000)
  },
}
