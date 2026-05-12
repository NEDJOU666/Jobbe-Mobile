import { Resend } from 'resend'
import { env } from '@/env'

const resend = new Resend(env.RESEND_API_KEY)

export const emailService = {
  async sendVerificationOtp(to: string, name: string, otp: string): Promise<void> {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'Your JobFinder verification code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#14A800">Verify your email</h2>
          <p>Hi ${name}, here is your one-time verification code:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#0D0D0D;
                      background:#F7F7F7;padding:24px;text-align:center;border-radius:8px">
            ${otp}
          </div>
          <p style="color:#666;font-size:14px">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    })
  },

  async sendWelcome(to: string, name: string): Promise<void> {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'Welcome to JobFinder!',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#14A800">Welcome to JobFinder, ${name}!</h2>
          <p>Your account is ready. Start exploring thousands of opportunities.</p>
          <a href="${env.FRONTEND_URL}" style="display:inline-block;background:#14A800;color:#fff;
             padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
            Find your next job
          </a>
        </div>
      `,
    })
  },

  async sendPasswordReset(to: string, name: string, otp: string): Promise<void> {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'Your JobFinder password reset code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#14A800">Password reset request</h2>
          <p>Hi ${name}, your password reset code is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#0D0D0D;
                      background:#F7F7F7;padding:24px;text-align:center;border-radius:8px">
            ${otp}
          </div>
          <p style="color:#666;font-size:14px">This code expires in 15 minutes. Do not share it with anyone.</p>
          <p style="color:#666;font-size:14px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })
  },
}
