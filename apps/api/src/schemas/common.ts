import { z } from "@hono/zod-openapi"

export const errorResponseSchema = z.object({
    message: z.string(),
})

export const uuidSchema = z
  .string()
  .trim()
  .min(1)

export const positiveIntegerSchema = z
  .number()
  .int()
  .min(1)

export const isoDateTimeSchema = z
  .string()
  .datetime()

// 型が必要なら
export type ErrorResponse = z.infer<typeof errorResponseSchema>