import { apiEnvSchema } from '@sportsfest/shared'

export const apiEnv = apiEnvSchema.parse({
  PORT: process.env.PORT,
  WEB_ORIGIN: process.env.WEB_ORIGIN,
  POSTGRES_DB: process.env.POSTGRES_DB,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_PASSWORD_PEPPER: process.env.AUTH_PASSWORD_PEPPER,
  AUTH_SESSION_COOKIE_NAME: process.env.AUTH_SESSION_COOKIE_NAME
})
