import { createRoute, z } from '@hono/zod-openapi'
import { createErrResBody, createReqBody, createResBody } from '../../utils/schemaParser'
import { positiveIntegerSchema } from '../common'

export const BlockRankingSchema = z.object({
  id: positiveIntegerSchema.openapi({ example: 1 }),
  eventBlockId: positiveIntegerSchema.openapi({ example: 12 }),
  teamId: positiveIntegerSchema.openapi({ example: 4 }),
  rank: z.number().int().min(1).openapi({ example: 1 }),
  points: z.number().int().openapi({ example: 0 }),
  note: z.string().nullable().openapi({ example: null }),
})

export const EventBlockIdParamSchema = z.object({
  eventBlockId: z.coerce.number().int().min(1).openapi({
    param: { name: 'eventBlockId', in: 'path' },
    example: 12,
  }),
})

export const ReplaceBlockRankingsRequestSchema = z.object({
  rankings: z.array(
    z.object({
      teamId: positiveIntegerSchema,
      rank: z.number().int().min(1),
      points: z.number().int().optional().default(0),
      note: z.string().nullable().optional().default(null),
    }),
  ),
})

const tags = ['admin']

export const getBlockRankingsRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: 'ブロック順位一覧取得',
  responses: {
    200: createResBody(z.array(BlockRankingSchema), 'ブロック順位一覧の取得に成功'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const replaceBlockRankingsRoute = createRoute({
  method: 'put',
  path: '/block/{eventBlockId}',
  tags,
  summary: '指定 EventBlock の順位を置き換える',
  request: {
    params: EventBlockIdParamSchema,
    ...createReqBody(ReplaceBlockRankingsRequestSchema),
  },
  responses: {
    200: createResBody(z.array(BlockRankingSchema), 'ブロック順位の更新に成功'),
    400: createErrResBody('バリデーションエラー'),
    404: createErrResBody('イベントブロックまたはチームが見つかりません'),
    409: createErrResBody('順位またはチームが重複しています'),
    500: createErrResBody('サーバーエラー'),
  },
})
