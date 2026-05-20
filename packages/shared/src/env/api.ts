import { z } from 'zod'

export const apiEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  DATABASE_URL: z.string().url(),
  AUTH_PASSWORD_PEPPER: z.string().min(16),
  AUTH_SESSION_COOKIE_NAME: z.string().min(1).default('sportsfest_session'),
  MAIL_ADDRESS: z.string().startsWith('mailto:'),
  VAPID_PUBLIC_KEY: z.string().min(32),
  VAPID_PRIVATE_KEY: z.string().min(32)
})

export type ApiEnv = z.infer<typeof apiEnvSchema>
