import { createRoute, z } from '@hono/zod-openapi'
import { positiveIntegerSchema } from '../common'
import {
  createErrResBody,
  createReqBody,
  createResBody,
} from '../../utils/schemaParser'
import {dayEnumSchema} from "../sportsData";

export const MapSchema = z.object({
  id: positiveIntegerSchema.openapi({ example: 1 }),
  filePath: z.string().min(1).max(255).openapi({ example: '/img/map/campus.svg' }),
  displayName: z.string().min(1).max(100).openapi({ example: '校内マップ' }),
  width: positiveIntegerSchema.openapi({ example: 700 }),
  height: positiveIntegerSchema.openapi({ example: 550 }),
  day: dayEnumSchema.openapi({ example: "both" }),
})

export const CreateMapRequestSchema = MapSchema.omit({ id: true })

export const UpdateMapRequestSchema =
  CreateMapRequestSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    { message: '少なくとも1項目を指定してください' },
  )

export const MapIdParamSchema = z.object({
  id: z.coerce.number().int().min(1).openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  }),
})

const tags = ['admin']

export const getMapsRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: 'マップ一覧取得',
  responses: {
    200: createResBody(z.array(MapSchema), 'マップ一覧の取得に成功'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const createMapRoute = createRoute({
  method: 'post',
  path: '/',
  tags,
  summary: 'マップ新規作成',
  request: createReqBody(CreateMapRequestSchema, true),
  responses: {
    201: createResBody(MapSchema, 'マップの作成に成功'),
    400: createErrResBody('バリデーションエラー'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const updateMapRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags,
  summary: 'マップ更新',
  request: {
    params: MapIdParamSchema,
    ...createReqBody(UpdateMapRequestSchema, true),
  },
  responses: {
    200: createResBody(MapSchema, 'マップの更新に成功'),
    400: createErrResBody('バリデーションエラー'),
    404: createErrResBody('マップが見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const deleteMapRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  summary: 'マップ削除',
  request: {
    params: MapIdParamSchema,
  },
  responses: {
    204: { description: 'マップの削除に成功 (No Content)' },
    404: createErrResBody('マップが見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})

export type MapResponse = z.infer<typeof MapSchema>
export type CreateMapRequest = z.infer<typeof CreateMapRequestSchema>
export type UpdateMapRequest = z.infer<typeof UpdateMapRequestSchema>
