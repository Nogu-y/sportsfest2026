import { z } from 'zod'

export const apiEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  DATABASE_URL: z.string().url()
})

export type ApiEnv = z.infer<typeof apiEnvSchema>
