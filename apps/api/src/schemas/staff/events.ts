import { createRoute, z } from '@hono/zod-openapi'
import { positiveIntegerSchema } from '../common'
import { createErrResBody, createResBody } from '../../utils/schemaParser'

const eventScoreParamsSchema = z
  .object({
    eventId: positiveIntegerSchema
  })
  .openapi('StaffEventScoreParams')

const eventScoreItemSchema = z.object({
  eventId: positiveIntegerSchema,
  teamId: positiveIntegerSchema,
  points: z.number(),
  reason: z.string().nullable()
})

export const finalizeEventScoreResSchema = z
  .object({
    eventId: positiveIntegerSchema,
    isCompleted: z.boolean(),
    scores: z.array(eventScoreItemSchema)
  })
  .openapi('StaffFinalizeEventScoreResponse')
  .describe('競技ごとの最終得点確定結果')

export const finalizeEventScoreRoute = createRoute({
  path: '/:eventId/score',
  method: 'post',
  tags: ['staff'],
  summary: '競技ごとの最終得点を確定する',
  request: {
    params: eventScoreParamsSchema
  },
  responses: {
    200: createResBody(finalizeEventScoreResSchema, '得点確定成功'),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody('競技が見つからない'),
    409: createErrResBody('得点確定に必要な結果が不足している')
  }
})

export type FinalizeEventScoreResponse = z.infer<typeof finalizeEventScoreResSchema>
