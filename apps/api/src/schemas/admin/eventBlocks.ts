import { createRoute, z } from '@hono/zod-openapi'
import { blockTypeEnum, stageEnum } from '../../db/enums'
import { positiveIntegerSchema } from '../common'
import { createErrResBody, createReqBody, createResBody } from '../../utils/schemaParser'

const BlockTypeSchema = z.enum(blockTypeEnum.enumValues)
const StageSchema = z.enum(stageEnum.enumValues)

export const EventBlockSchema = z.object({
  id: positiveIntegerSchema.openapi({ example: 1 }),
  eventId: positiveIntegerSchema.openapi({ example: 2 }),
  name: z.string().max(100).openapi({ example: 'Aブロック' }),
  type: BlockTypeSchema.openapi({ example: 'LEAGUE' }),
  stage: StageSchema.openapi({ example: 'QUALIFIER' }),
})

export const CreateEventBlockRequestSchema = EventBlockSchema.omit({ id: true })

export const EventBlockIdParamSchema = z.object({
  id: z.coerce.number().int().min(1).openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  }),
})

export const UpdateEventBlockRequestSchema = CreateEventBlockRequestSchema.partial()

const tags = ['admin']

export const getEventBlocksRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: 'イベントブロック一覧取得',
  responses: {
    200: createResBody(z.array(EventBlockSchema), 'イベントブロック一覧の取得に成功'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const createEventBlockRoute = createRoute({
  method: 'post',
  path: '/',
  tags,
  summary: 'イベントブロック新規作成',
  request: {
    ...createReqBody(CreateEventBlockRequestSchema),
  },
  responses: {
    201: createResBody(EventBlockSchema, 'イベントブロックの作成に成功'),
    400: createErrResBody('バリデーションエラー'),
    404: createErrResBody('紐づけ先のイベントが見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const updateEventBlockRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags,
  summary: 'イベントブロック更新',
  request: {
    params: EventBlockIdParamSchema,
    ...createReqBody(UpdateEventBlockRequestSchema),
  },
  responses: {
    200: createResBody(EventBlockSchema, 'イベントブロックの更新に成功'),
    400: createErrResBody('バリデーションエラー'),
    404: createErrResBody('イベントブロックまたは紐づけ先イベントが見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})

export const deleteEventBlockRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  summary: 'イベントブロック削除',
  request: {
    params: EventBlockIdParamSchema,
  },
  responses: {
    204: { description: 'イベントブロックの削除に成功 (No Content)' },
    404: createErrResBody('イベントブロックが見つかりません'),
    500: createErrResBody('サーバーエラー'),
  },
})
