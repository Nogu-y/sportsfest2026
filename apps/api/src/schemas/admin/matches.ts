import { z } from '@hono/zod-openapi'
import { createRoute } from '@hono/zod-openapi'
import { stageEnum, matchStatusEnum } from '../../db/enums'
import { createReqBody, createResBody, createErrResBody } from '../../utils/schemaParser'

// zodのenumスキーマを生成する
const StageSchema = z.enum(stageEnum.enumValues)
const StatusSchema = z.enum(matchStatusEnum.enumValues)

export const MatchParticipantResponseSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  teamId: z.number().nullable().openapi({ example: 1 }),
  prereqMatchId: z.number().nullable().openapi({ example: null }),
  prereqBlockId: z.number().nullable().openapi({ example: null }),
  prereqRank: z.number().int().nullable().openapi({ example: null }),
  score: z.number().int().nullable().openapi({ example: null }),
  rank: z.number().int().nullable().openapi({ example: null }),
  isDisqualified: z.boolean().openapi({ example: false }),
})

export const MatchParticipantRequestSchema = MatchParticipantResponseSchema.omit({
  id: true,
}).extend({
  teamId: z.number().nullable().optional().default(null),
  prereqMatchId: z.number().nullable().optional().default(null),
  prereqBlockId: z.number().nullable().optional().default(null),
  prereqRank: z.number().int().nullable().optional().default(null),
  score: z.number().int().nullable().optional().default(null),
  rank: z.number().int().nullable().optional().default(null),
  isDisqualified: z.boolean().optional().default(false),
})

// MatchPlanのレスポンス用スキーマ
// 仕様書と順番が異なるのに注意(まあ基本困ることないと思うが)
export const MatchPlanSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  eventBlockId: z.number().openapi({ example: 2 }),
  locationId: z.number().nullable().openapi({ example: 3 }),
  name: z.string().nullable().openapi({ example: 'A-1' }),
  description: z.string().nullable().openapi({ example: '決勝戦' }),
  stage: StageSchema.openapi({ example: 'FINAL' }),
  status: StatusSchema.openapi({ example: 'Waiting' }),
  scheduledStartTime: z.coerce.date().openapi({ example: '2026-05-12T09:00:00Z' }),
  scheduledEndTime: z.coerce.date().openapi({ example: '2026-05-12T09:30:00Z' }),
  startedAt: z.coerce.date().nullable().openapi({ example: null }),
  endedAt: z.coerce.date().nullable().openapi({ example: null }),
  note: z.string().nullable().openapi({ example: '雨天時は体育館へ変更' }),
  participants: z.array(MatchParticipantResponseSchema).openapi({ example: [] }),
})

export const CreateMatchRequestSchema = MatchPlanSchema.omit({
  id: true,
  participants: true,
  startedAt: true,
  endedAt: true,
}).extend({
  status: StatusSchema.optional().default('Waiting'),
  participants: z.array(MatchParticipantRequestSchema).optional().default([]),
})

export const MatchIdParamSchema = z.object({
  id: z.coerce.number().openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  }),
})

export const UpdateMatchRequestSchema = MatchPlanSchema.omit({
  id: true,
  participants: true,
}).partial().extend({
  participants: z.array(MatchParticipantRequestSchema).optional(),
})

const tags = ['admin']

// --- POST ---
export const createMatchRoute = createRoute({
  method: 'post',
  path: '/',
  tags,
  summary: '試合計画新規作成',
  request: {
    ...createReqBody(CreateMatchRequestSchema),
  },
  responses: {
    201: createResBody(MatchPlanSchema, '試合計画の作成に成功'),
    400: createErrResBody('バリデーションエラー'),
    500: createErrResBody('サーバーエラー'),
  },
})

export type MatchParticipantRequest = z.infer<typeof MatchParticipantRequestSchema>
export type CreateMatchRequest = z.infer<typeof CreateMatchRequestSchema>
export type UpdateMatchRequest = z.infer<typeof UpdateMatchRequestSchema>
// --- PUT ---
export const updateMatchRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags,
  summary: '試合計画更新',
  request: {
    params: MatchIdParamSchema,
    ...createReqBody(UpdateMatchRequestSchema),
  },
  responses: {
    200: createResBody(MatchPlanSchema, '試合計画の更新に成功'),
    400: createErrResBody('バリデーションエラー'),
    404: createErrResBody('試合が見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})

// --- DELETE ---
export const deleteMatchRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  summary: '試合計画削除',
  request: {
    params: MatchIdParamSchema,
  },
  responses: {
    204: { description: '試合計画の削除に成功 (No Content)' },
    404: createErrResBody('試合が見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})
