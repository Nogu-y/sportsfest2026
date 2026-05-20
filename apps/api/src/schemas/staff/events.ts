import { createRoute, z } from '@hono/zod-openapi'
import { positiveIntegerSchema } from '../common'
import { createErrResBody, createResBody } from '../../utils/schemaParser'

const eventScoreParamsSchema = z
  .object({
    eventId: z.coerce.number().int().min(1).openapi({
      param: { name: 'eventId', in: 'path' },
      example: 1
    })
  })
  .openapi('StaffEventScoreParams')

const eventScoreItemSchema = z.object({
  eventId: positiveIntegerSchema,
  teamId: positiveIntegerSchema,
  points: z.number(),
  reason: z.string().nullable()
})

export const resolveEventParticipantsResSchema = z
  .object({
    eventId: positiveIntegerSchema,
    updatedParticipants: z.number().int().min(0),
    updatedMatches: z.number().int().min(0),
    unresolvedParticipants: z.number().int().min(0)
  })
  .openapi('StaffResolveEventParticipantsResponse')
  .describe('予選結果に基づく勝ち上がり参加チーム反映結果')

const blockRankingItemSchema = z.object({
  eventBlockId: positiveIntegerSchema,
  teamId: positiveIntegerSchema,
  rank: z.number().int().min(1),
  points: z.number().int(),
  note: z.string().nullable()
})

export const finalizeBlockRankingsResSchema = z
  .object({
    eventId: positiveIntegerSchema,
    processedBlocks: z.number().int().min(0),
    rankings: z.array(blockRankingItemSchema)
  })
  .openapi('StaffFinalizeBlockRankingsResponse')
  .describe('予選リーグ順位の確定結果')

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
    409: createErrResBody('得点確定に必要な結果が不足している'),
    422: createErrResBody('配点設定が不正')
  }
})

export const resolveEventParticipantsRoute = createRoute({
  path: '/:eventId/advance',
  method: 'post',
  tags: ['staff'],
  summary: '予選結果をもとに決勝トーナメント参加チームを反映する',
  request: {
    params: eventScoreParamsSchema
  },
  responses: {
    200: createResBody(resolveEventParticipantsResSchema, '勝ち上がり反映成功'),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody('競技が見つからない'),
    409: createErrResBody('勝ち上がり元の順位または結果が不足している'),
    500: createErrResBody('反映失敗')
  }
})

export const finalizeBlockRankingsRoute = createRoute({
  path: '/:eventId/rankings',
  method: 'post',
  tags: ['staff'],
  summary: '予選リーグ順位を確定する',
  request: {
    params: eventScoreParamsSchema
  },
  responses: {
    200: createResBody(finalizeBlockRankingsResSchema, '予選順位確定成功'),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody('競技が見つからない'),
    409: createErrResBody('順位確定に必要な結果が不足している'),
    500: createErrResBody('順位確定失敗')
  }
})

export type FinalizeEventScoreResponse = z.infer<typeof finalizeEventScoreResSchema>
export type ResolveEventParticipantsResponse = z.infer<typeof resolveEventParticipantsResSchema>
export type FinalizeBlockRankingsResponse = z.infer<typeof finalizeBlockRankingsResSchema>
