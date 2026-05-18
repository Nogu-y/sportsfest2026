import { createRoute, z } from '@hono/zod-openapi'
import { positiveIntegerSchema } from '../common'
import {
  createErrResBody,
  createReqBody,
  createResBody,
} from '../../utils/schemaParser'

const ratioSchema = z.number().int().min(1).max(100)

export const LocationSchema = z.object({
  id: positiveIntegerSchema.openapi({ example: 1 }),
  mapId: positiveIntegerSchema.openapi({ example: 1 }),
  name: z.string().min(1).max(100).openapi({ example: '第一体育館 Aコート' }),
  xRatio: ratioSchema.openapi({ example: 42 }),
  yRatio: ratioSchema.openapi({ example: 65 }),
})

export const CreateLocationRequestSchema = LocationSchema.omit({ id: true })

export const UpdateLocationRequestSchema =
  CreateLocationRequestSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    { message: '少なくとも1項目を指定してください' },
  )

export const LocationIdParamSchema = z.object({
  id: z.coerce.number().int().min(1).openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  }),
})

const tags = ['admin']

export const getLocationsRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: '会場一覧取得',
  responses: {
    200: createResBody(z.array(LocationSchema), '会場一覧の取得に成功'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const createLocationRoute = createRoute({
  method: 'post',
  path: '/',
  tags,
  summary: '会場新規作成',
  request: createReqBody(CreateLocationRequestSchema, true),
  responses: {
    201: createResBody(LocationSchema, '会場の作成に成功'),
    400: createErrResBody('バリデーションエラー'),
    404: createErrResBody('指定されたマップが見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const updateLocationRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags,
  summary: '会場更新',
  request: {
    params: LocationIdParamSchema,
    ...createReqBody(UpdateLocationRequestSchema, true),
  },
  responses: {
    200: createResBody(LocationSchema, '会場の更新に成功'),
    400: createErrResBody('バリデーションエラー'),
    404: createErrResBody('会場または指定されたマップが見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const deleteLocationRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  summary: '会場削除',
  request: {
    params: LocationIdParamSchema,
  },
  responses: {
    204: { description: '会場の削除に成功 (No Content)' },
    404: createErrResBody('会場が見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})

export type LocationResponse = z.infer<typeof LocationSchema>
export type CreateLocationRequest = z.infer<typeof CreateLocationRequestSchema>
export type UpdateLocationRequest = z.infer<typeof UpdateLocationRequestSchema>