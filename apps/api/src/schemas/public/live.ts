import { createRoute, z } from '@hono/zod-openapi'
import {
  isoDateTimeSchema,
  positiveIntegerSchema
} from '../common'
import { createErrResBody, createResBody } from '../../utils/schemaParser'

const liveParticipantSchema = z.object({
  id: positiveIntegerSchema,
  teamId: positiveIntegerSchema.nullable(),
  prereqMatchId: positiveIntegerSchema.nullable(),
  prereqBlockId: positiveIntegerSchema.nullable(),
  prereqRank: z.number().nullable(),
  score: z.number().nullable(),
  rank: z.number().nullable(),
  isDisqualified: z.boolean()
})

const liveMatchSchema = z.object({
  id: positiveIntegerSchema,
  eventBlockId: positiveIntegerSchema,
  locationId: positiveIntegerSchema.nullable(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  stage: z.string(),
  status: z.string(),
  scheduledStartTime: isoDateTimeSchema,
  scheduledEndTime: isoDateTimeSchema,
  startedAt: isoDateTimeSchema.nullable(),
  endedAt: isoDateTimeSchema.nullable(),
  note: z.string().nullable(),
  participants: z.array(liveParticipantSchema)
})

const liveBlockRankingSchema = z.object({
  eventBlockId: positiveIntegerSchema,
  teamId: positiveIntegerSchema,
  rank: z.number(),
  points: z.number(),
  note: z.string().nullable()
})

const liveScoreSchema = z.object({
  eventId: positiveIntegerSchema,
  teamId: positiveIntegerSchema,
  points: z.number(),
  reason: z.string().nullable()
})

export const LiveResSchema = z
  .object({
    matches: z.array(liveMatchSchema),
    blockRankings: z.array(liveBlockRankingSchema),
    scores: z.array(liveScoreSchema)
  })
  .openapi('PublicLiveResponse')
  .describe('一般公開向けライブデータ')

export const getLiveDoc = createRoute({
  path: '/',
  method: 'get',
  tags: ['public'],
  summary: '一般公開向けライブデータを返す',
  responses: {
    200: createResBody(LiveResSchema, 'ライブデータ取得成功'),
    304: {
      description: 'レスポンス内容に変更なし'
    },
    500: createErrResBody('取得失敗')
  }
})

export type LiveResponse = z.infer<typeof LiveResSchema>
