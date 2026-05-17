import { createRoute, z } from '@hono/zod-openapi'
import {
  errorResponseSchema,
  positiveIntegerSchema,
  uuidSchema
} from '../common'
import {
  createErrResBody,
  createReqBody,
  createResBody
} from '../../utils/schemaParser'

export const WatchlistQuerySchema = z
  .object({
    uuid: uuidSchema
  })
  .openapi('PublicWatchlistQuery')

export const WatchlistReqSchema = z
  .object({
    uuid: uuidSchema,
    matchPlanIds: z.array(positiveIntegerSchema)
  })
  .openapi('PublicWatchlistReplaceRequest')
  .describe("ウォッチリスト更新時用データ")

export const WatchlistResSchema = z
  .object({
    uuid: uuidSchema,
    matchPlanIds: z.array(positiveIntegerSchema)
  })
  .openapi('PublicWatchlistResponse')
  .describe('ウォッチリスト対象試合一覧')

export const get = createRoute({
  path: '/',
  method: 'get',
  tags: ['public'],
  summary: 'ウォッチリスト対象試合一覧を返す',
  request: {
    query: WatchlistQuerySchema
  },
  responses: {
    200: createResBody(WatchlistResSchema, '取得成功'),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody('UUID が見つからない')
  }
})

export const post = createRoute({
  path: '/',
  method: 'post',
  tags: ['public'],
  summary: 'ウォッチリストに試合を追加する',
  request: createReqBody(WatchlistReqSchema, true),
  responses: {
    200: createResBody(WatchlistResSchema, '追加成功'),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody('UUID または試合が見つからない')
  }
})

export const del = createRoute({
  path: '/',
  method: 'delete',
  tags: ['public'],
  summary: 'ウォッチリストから試合を削除する',
  request: createReqBody(WatchlistReqSchema, true),
  responses: {
    200: createResBody(WatchlistResSchema, '削除成功'),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody('UUID が見つからない')
  }
})

export type WatchlistQuery = z.infer<typeof WatchlistQuerySchema>
export type WatchlistReq = z.infer<
  typeof WatchlistReqSchema
>
export type WatchlistRes = z.infer<typeof WatchlistResSchema>

export const Watchlist = {
  get,
  post,
  delete: del
}
