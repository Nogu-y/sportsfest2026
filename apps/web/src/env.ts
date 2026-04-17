import { webEnvSchema } from '@sportsfest/shared'

export const webEnv = webEnvSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL
})
