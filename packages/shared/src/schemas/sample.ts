import { z } from 'zod'

export const sampleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1)
})

export type Sample = z.infer<typeof sampleSchema>
