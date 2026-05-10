import { createRoute, z } from '@hono/zod-openapi'
import {
  isoDateTimeSchema,
  positiveIntegerSchema,
  uuidSchema,
} from '../common'
import {
  createErrResBody,
  createReqBody,
  createResBody,
} from '../../utils/schemaParser'

export const SubscriptionUpsertReqSchema = z.object({
  uuid: uuidSchema,
  endpoint: z.string(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  })
}).openapi('PublicSubscriptionUpsertRequest')

export const SubscriptionResSchema = z
  .object({
    id: positiveIntegerSchema,
    uuid: z.string(),
    endpoint: z.string(),
    expirationTime: z.number().nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .openapi('PublicSubscriptionResponse')
  .describe('Push 通知サブスクリプション')

export const post = createRoute({
  path: '/',
  method: 'post',
  tags: ['public'],
  summary: 'Push 通知サブスクリプションを作成する',
  request: createReqBody(SubscriptionUpsertReqSchema,true),
  responses: {
    201: createResBody(SubscriptionResSchema, '作成成功'),
    400: createErrResBody('不正なリクエスト'),
    409: createErrResBody('同じ UUID のサブスクリプションがすでに存在する'),
  },
})

export const put = createRoute({
  path: '/',
  method: 'put',
  tags: ['public'],
  summary: 'Push 通知サブスクリプションを更新する',
  request: createReqBody(SubscriptionUpsertReqSchema),
  responses: {
    200: createResBody(SubscriptionResSchema, '更新成功'),
    400: createErrResBody('不正なリクエスト'),
    404: createErrResBody('対象 UUID のサブスクリプションが存在しない'),
  },
})

export type SubscriptionUpsertReq = z.infer<
  typeof SubscriptionUpsertReqSchema
>

export type SubscriptionRes = z.infer<
  typeof SubscriptionResSchema
>

export const subscription = { post, put }