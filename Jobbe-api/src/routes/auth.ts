import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import bcrypt from 'bcryptjs'
import type { AppEnv } from '@/types'
import { db } from '@/db'
import { env } from '@/env'
import { tokenService, sha256 } from '@/services/token'
import { emailService } from '@/services/email'
import { authMiddleware } from '@/middleware/auth'

const auth = new Hono<AppEnv>()

// ─── Helpers ────────────────────────────────────────────────────────────────

async function issueTokenPair(userId: string) {
  const [accessToken, refreshToken] = await Promise.all([
    tokenService.signAccessToken(userId),
    tokenService.signRefreshToken(userId),
  ])

  await db.refreshToken.create({
    data: {
      tokenHash: sha256(refreshToken),
      userId,
      expiresAt: tokenService.getRefreshExpiry(),
    },
  })

  return { accessToken, refreshToken }
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isEmailVerified: true,
  newsletter: true,
  avatar: true,
  createdAt: true,
} as const

// ─── POST /auth/signup ───────────────────────────────────────────────────────

auth.post(
  '/signup',
  zValidator('json', z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    newsletter: z.boolean().optional(),
  })),
  async (c) => {
    const { name, email, password, newsletter } = c.req.valid('json')

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return c.json({ message: 'Email already in use' }, 409)
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: { name, email, password: hashedPassword, newsletter: newsletter ?? false },
      select: userSelect,
    })

    const tokens = await issueTokenPair(user.id)

    // Auto-send email verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const codeHash = await bcrypt.hash(otp, 10)
    await db.otpCode.create({
      data: { codeHash, userId: user.id, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    })
    emailService.sendVerificationOtp(email, name, otp).catch((err) => {
      console.error('[signup] verification OTP send failed:', err?.message ?? err)
    })
    emailService.sendWelcome(email, name).catch((err) => {
      console.error('[signup] welcome email send failed:', err?.message ?? err)
    })

    return c.json({ ...tokens, user }, 201)
  },
)

// ─── POST /auth/login ────────────────────────────────────────────────────────

auth.post(
  '/login',
  zValidator('json', z.object({
    email: z.string().email(),
    password: z.string(),
  })),
  async (c) => {
    const { email, password } = c.req.valid('json')

    const user = await db.user.findUnique({
      where: { email },
      select: { ...userSelect, password: true },
    })

    if (!user || !user.password) {
      return c.json({ message: 'Invalid email or password' }, 401)
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return c.json({ message: 'Invalid email or password' }, 401)
    }

    const tokens = await issueTokenPair(user.id)
    const { password: _, ...safeUser } = user

    return c.json({ ...tokens, user: safeUser })
  },
)

// ─── POST /auth/refresh ──────────────────────────────────────────────────────
// Frontend sends: Authorization: Bearer <refreshToken>

auth.post('/refresh', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'No refresh token provided' }, 401)
  }

  const rawToken = authHeader.slice(7)

  let payload: { sub: string }
  try {
    payload = await tokenService.verifyRefreshToken(rawToken)
  } catch {
    return c.json({ message: 'Invalid refresh token' }, 401)
  }

  const tokenHash = sha256(rawToken)
  const stored = await db.refreshToken.findUnique({ where: { tokenHash } })

  if (!stored || stored.expiresAt < new Date()) {
    return c.json({ message: 'Refresh token expired or revoked' }, 401)
  }

  // Rotate: delete old token, issue new pair
  await db.refreshToken.delete({ where: { tokenHash } })

  const [accessToken, refreshToken] = await Promise.all([
    tokenService.signAccessToken(payload.sub),
    tokenService.signRefreshToken(payload.sub),
  ])

  await db.refreshToken.create({
    data: {
      tokenHash: sha256(refreshToken),
      userId: payload.sub,
      expiresAt: tokenService.getRefreshExpiry(),
    },
  })

  return c.json({ accessToken, refreshToken })
})

// ─── POST /auth/logout ───────────────────────────────────────────────────────

auth.post('/logout', authMiddleware, async (c) => {
  const userId = c.get('userId')
  // Revoke all sessions for this user
  await db.refreshToken.deleteMany({ where: { userId } })
  return c.json({ message: 'Logged out successfully' })
})

// ─── GET /auth/me ────────────────────────────────────────────────────────────

auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const user = await db.user.findUnique({ where: { id: userId }, select: userSelect })
  if (!user) return c.json({ message: 'User not found' }, 404)
  return c.json(user)
})

// ─── POST /auth/send-verification ───────────────────────────────────────────
// Rate-limited: max 5 OTP sends per hour (from existing backend)

auth.post('/send-verification', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, isEmailVerified: true },
  })

  if (!user) return c.json({ message: 'User not found' }, 404)
  if (user.isEmailVerified) return c.json({ message: 'Email already verified' }, 400)

  // Rate limit: max 5 OTPs per hour
  const recentCount = await db.otpCode.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  })
  if (recentCount >= 5) {
    return c.json({ message: 'Too many verification attempts. Try again in an hour.' }, 429)
  }

  // Invalidate all previous unused OTPs
  await db.otpCode.updateMany({
    where: { userId, used: false },
    data: { used: true, usedAt: new Date() },
  })

  // Generate 6-digit OTP and store as bcrypt hash
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const codeHash = await bcrypt.hash(otp, 10)

  await db.otpCode.create({
    data: {
      codeHash,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  })

  await emailService.sendVerificationOtp(user.email, user.name, otp)

  return c.json({ message: 'Verification code sent to your email' })
})

// ─── POST /auth/verify-email ─────────────────────────────────────────────────

auth.post(
  '/verify-email',
  authMiddleware,
  zValidator('json', z.object({ otp: z.string().length(6) })),
  async (c) => {
    const userId = c.get('userId')
    const { otp } = c.req.valid('json')

    // Find all valid (unused, non-expired) OTPs for this user
    const validOtps = await db.otpCode.findMany({
      where: { userId, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    if (validOtps.length === 0) {
      return c.json({ message: 'Invalid or expired code' }, 400)
    }

    // Compare against each stored hash (usually just 1)
    let matched: (typeof validOtps)[0] | null = null
    for (const record of validOtps) {
      const ok = await bcrypt.compare(otp, record.codeHash)
      if (ok) { matched = record; break }
    }

    if (!matched) {
      return c.json({ message: 'Invalid or expired code' }, 400)
    }

    await Promise.all([
      db.otpCode.update({ where: { id: matched.id }, data: { used: true, usedAt: new Date() } }),
      db.user.update({ where: { id: userId }, data: { isEmailVerified: true, emailVerifiedAt: new Date() } }),
    ])

    return c.json({ message: 'Email verified successfully' })
  },
)

// ─── POST /auth/forgot-password ──────────────────────────────────────────────

auth.post(
  '/forgot-password',
  zValidator('json', z.object({ email: z.string().email() })),
  async (c) => {
    const { email } = c.req.valid('json')

    // Always respond the same to prevent email enumeration
    const genericMsg = { message: 'If that email is registered, a reset link has been sent' }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    })
    if (!user) return c.json(genericMsg)

    // Invalidate previous unused reset codes
    await db.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true, usedAt: new Date() },
    })

    // Generate 6-digit OTP, store as bcrypt hash (15-min expiry)
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString()
    const resetHash = await bcrypt.hash(resetOtp, 10)

    await db.passwordReset.create({
      data: {
        codeHash: resetHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    })

    console.log(`[forgot-password] OTP for ${user.email}: ${resetOtp}`)
    emailService.sendPasswordReset(user.email, user.name, resetOtp).catch((err) => {
      console.error('[forgot-password] email send failed:', err?.message ?? err)
    })

    return c.json(genericMsg)
  },
)

// ─── POST /auth/reset-password ───────────────────────────────────────────────

auth.post(
  '/reset-password',
  zValidator('json', z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    newPassword: z.string().min(8),
  })),
  async (c) => {
    const { email, otp, newPassword } = c.req.valid('json')

    const user = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) return c.json({ message: 'Invalid or expired code' }, 400)

    // Find valid (unused, non-expired) reset records for this user
    const validResets = await db.passwordReset.findMany({
      where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    let matched: (typeof validResets)[0] | null = null
    for (const record of validResets) {
      const ok = await bcrypt.compare(otp, record.codeHash)
      if (ok) { matched = record; break }
    }

    if (!matched) return c.json({ message: 'Invalid or expired code' }, 400)

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await Promise.all([
      db.passwordReset.update({ where: { id: matched.id }, data: { used: true, usedAt: new Date() } }),
      db.user.update({ where: { id: user.id }, data: { password: hashedPassword } }),
      db.refreshToken.deleteMany({ where: { userId: user.id } }),
    ])

    return c.json({ message: 'Password reset successfully. Please log in again.' })
  },
)

// ─── OAuth: Google ───────────────────────────────────────────────────────────

auth.get('/google', (c) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
    return c.json({ message: 'Google OAuth not configured' }, 501)
  }
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
  })
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

auth.get('/google/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')

  if (error || !code || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    return c.redirect(`${env.FRONTEND_URL}?error=oauth_failed`)
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        code,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenRes.json() as { access_token: string }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const googleUser = await userRes.json() as { id: string; email: string; name: string; picture?: string }

    const user = await findOrCreateOAuthUser({
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture,
      googleId: googleUser.id,
    })

    const tokens = await issueTokenPair(user.id)
    return c.redirect(
      `${env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${encodeURIComponent(tokens.refreshToken)}`,
    )
  } catch (err) {
    console.error('Google OAuth error:', err)
    return c.redirect(`${env.FRONTEND_URL}?error=oauth_failed`)
  }
})

// ─── OAuth: GitHub ───────────────────────────────────────────────────────────

auth.get('/github', (c) => {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CALLBACK_URL) {
    return c.json({ message: 'GitHub OAuth not configured' }, 501)
  }
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: 'read:user user:email',
  })
  return c.redirect(`https://github.com/login/oauth/authorize?${params}`)
})

auth.get('/github/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')

  if (error || !code || !env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_CALLBACK_URL) {
    return c.redirect(`${env.FRONTEND_URL}?error=oauth_failed`)
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_CALLBACK_URL,
      }),
    })
    const tokenData = await tokenRes.json() as { access_token: string }

    const [userRes, emailRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'JobFinder' },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'JobFinder' },
      }),
    ])

    const githubUser = await userRes.json() as { id: number; name: string; login: string; avatar_url?: string }
    const emails = await emailRes.json() as Array<{ email: string; primary: boolean; verified: boolean }>
    const primaryEmail = emails.find((e) => e.primary && e.verified)?.email

    if (!primaryEmail) {
      return c.redirect(`${env.FRONTEND_URL}?error=no_verified_email`)
    }

    const user = await findOrCreateOAuthUser({
      email: primaryEmail,
      name: githubUser.name || githubUser.login,
      avatar: githubUser.avatar_url,
      githubId: String(githubUser.id),
    })

    const tokens = await issueTokenPair(user.id)
    return c.redirect(
      `${env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${encodeURIComponent(tokens.refreshToken)}`,
    )
  } catch (err) {
    console.error('GitHub OAuth error:', err)
    return c.redirect(`${env.FRONTEND_URL}?error=oauth_failed`)
  }
})

// ─── OAuth helper ────────────────────────────────────────────────────────────

async function findOrCreateOAuthUser(dto: {
  email: string
  name: string
  avatar?: string
  googleId?: string
  githubId?: string
}) {
  const existing = await db.user.findUnique({ where: { email: dto.email }, select: userSelect })

  if (existing) {
    // Link OAuth provider ID if not already linked
    const updates: Record<string, string | undefined> = {}
    if (dto.googleId) updates.googleId = dto.googleId
    if (dto.githubId) updates.githubId = dto.githubId
    if (Object.keys(updates).length) {
      await db.user.update({ where: { id: existing.id }, data: updates })
    }
    return existing
  }

  return db.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      avatar: dto.avatar,
      googleId: dto.googleId,
      githubId: dto.githubId,
      isEmailVerified: true, // OAuth providers verify emails
      emailVerifiedAt: new Date(),
    },
    select: userSelect,
  })
}

export default auth
