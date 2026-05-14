import { z } from '@hono/zod-openapi'
import { createRoute } from '@hono/zod-openapi'
import { rankingOrderEnum, eventFormatEnum } from '../../db/enums'
import { createReqBody, createResBody, createErrResBody } from '../../utils/schemaParser'

// zodのenumスキーマを生成する
const RankingOrderSchema = z.enum(rankingOrderEnum.enumValues)
const EventFormatSchema = z.enum(eventFormatEnum.enumValues)

// 一応わかりやすいようにモックデータより、exampleを定義(mockと繋げたわけではない点に注意)
export const EventSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  name: z.string().openapi({ example: 'バスケットボール' }),
  description: z.string().nullable().openapi({ example: '8チームによる決勝トーナメント' }),
  color: z.string().nullable().openapi({ example: '#D9480F' }),
  ruleMd: z.string().nullable().openapi({ example: '# ルール\n...' }),

  rankingOrder: RankingOrderSchema.openapi({ example: 'DESC' }),
  format: EventFormatSchema.openapi({ example: 'TOURNAMENT' }),

  pointAllocation: z.record(z.string(), z.any()).openapi({ example: {} }),
  isCompleted: z.boolean().openapi({ example: false }),
})

// POSTリクエスト用のスキーマ
export const CreateEventRequestSchema = EventSchema.omit({ id: true }).extend({
  isCompleted: z.boolean().optional().default(false),
})

// イベントのURLの値から数値を取り出す
export const EventIdParamSchema = z.object({
  // 文字列を数値に変換
  id: z.coerce.number().openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  }),
})

export const UpdateEventRequestSchema = CreateEventRequestSchema.partial()

// 以下引越し

const tags = ['admin']

// --- GET ---
export const getEventsRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: 'イベント一覧取得',
  responses: {
    200: createResBody(z.array(EventSchema), 'イベント一覧の取得に成功'),
    500: createErrResBody('サーバーエラー'),
  },
})

// --- POST ---
export const createEventRoute = createRoute({
  method: 'post',
  path: '/',
  tags,
  summary: 'イベント新規作成',
  request: {
    ...createReqBody(CreateEventRequestSchema),
  },
  responses: {
    201: createResBody(EventSchema, 'イベントの作成に成功'),
    400: createErrResBody('バリデーションエラー'),
    500: createErrResBody('サーバーエラー'),
  },
})

// --- PUT ---
export const updateEventRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags,
  summary: 'イベント更新',
  request: {
    params: EventIdParamSchema,
    ...createReqBody(UpdateEventRequestSchema),
  },
  responses: {
    200: createResBody(EventSchema, 'イベントの更新に成功'),
    400: createErrResBody('バリデーションエラー'),
    404: createErrResBody('イベントが見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})

// --- DELETE ---
export const deleteEventRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  summary: 'イベント削除',
  request: {
    params: EventIdParamSchema,
  },
  responses: {
    // ※ 204 は "No Content" (ボディがない) ため、createResBody は使わずに直接書くのが正解です <- hoe
    204: { description: 'イベントの削除に成功 (No Content)' },
    404: createErrResBody('イベントが見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})

