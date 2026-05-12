import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3001),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  RESEND_API_KEY: z.string(),
  EMAIL_FROM: z.string(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),

  FRONTEND_URL: z.string().default('http://localhost:3000'),
})

try {
  schema.parse(process.env)
} catch (err: any) {
  console.error('Invalid environment variables:', err.flatten?.().fieldErrors ?? err.message)
  process.exit(1)
}

export const env = schema.parse(process.env)
