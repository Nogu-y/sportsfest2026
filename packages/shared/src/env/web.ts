import { z } from 'zod'

export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
})

export type WebEnv = z.infer<typeof webEnvSchema>
