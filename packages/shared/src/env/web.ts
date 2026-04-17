import { z } from 'zod'

export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url()
})

export type WebEnv = z.infer<typeof webEnvSchema>
