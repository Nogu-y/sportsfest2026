import { z } from '@hono/zod-openapi'
import { errorResponseSchema } from '../schemas/common'

export const createReqBody = <T extends z.ZodTypeAny>(schema: T, required = false) => (
  {
    body: {
      required,
      content: {
        'application/json': {
          schema,
        },
      },
    },
  } as const
)

export const createResBody = <T extends z.ZodTypeAny>(schema: T, desc = '') => (
  {
    description: desc,
    content: {
      'application/json': {
        schema,
      },
    },
  } as const
)

export const createErrResBody = (desc = '') => (
  {
    description: desc,
    content: {
      'application/json': {
        schema: errorResponseSchema,
      },
    },
  } as const
)