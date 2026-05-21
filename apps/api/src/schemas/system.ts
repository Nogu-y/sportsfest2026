import { createRoute, z } from '@hono/zod-openapi'
import { createErrResBody, createReqBody, createResBody } from '../utils/schemaParser'
import { uuidSchema } from './common'

export const serviceInfoSchema = z
  .object({
    name: z.string(),
    service: z.literal('api'),
    status: z.literal('ok')
  })
  .openapi('ServiceInfo')
  .describe('API の基本稼働情報')

export const healthStatusSchema = z
  .object({
    status: z.literal('ok')
  })
  .openapi('HealthStatus')
  .describe('API のヘルスチェック結果')

export const getServiceInfoDoc = createRoute({
  path: '/',
  method: 'get',
  tags: ['system'],
  summary: 'API の稼働状態を返す',
  responses: {
    200: createResBody(serviceInfoSchema, 'API が正常に応答している')
  }
})

export const getHealthStatusDoc = createRoute({
  path: '/health',
  method: 'get',
  tags: ['system'],
  summary: 'ヘルスチェック結果を返す',
  responses: {
    200: createResBody(healthStatusSchema, 'API が正常稼働している')
  }
})

export const debugPushTestReqSchema = z
  .object({
    uuid: uuidSchema,
    title: z.string().min(1).max(100).optional(),
    body: z.string().min(1).max(200).optional(),
    url: z.string().min(1).optional()
  })
  .openapi('DebugPushTestRequest')

export const debugPushTestResSchema = z
  .object({
    ok: z.boolean(),
    uuid: uuidSchema,
    subscriptionId: z.number().int().positive(),
    endpoint: z.string(),
    title: z.string(),
    body: z.string()
  })
  .openapi('DebugPushTestResponse')

export const postDebugPushTestDoc = createRoute({
  path: '/debug/push/test',
  method: 'post',
  tags: ['system'],
  summary: '指定 UUID の購読先へテスト通知を即時送信する（ADMIN限定）',
  request: createReqBody(debugPushTestReqSchema, true),
  responses: {
    200: createResBody(debugPushTestResSchema, '送信成功'),
    401: createErrResBody('認証されていません'),
    403: createErrResBody('権限がありません'),
    404: createErrResBody('対象 UUID の購読が見つかりません'),
    500: createErrResBody('送信失敗'),
  }
})

export type ServiceInfo = z.infer<typeof serviceInfoSchema>
export type HealthStatus = z.infer<typeof healthStatusSchema>
export type DebugPushTestReq = z.infer<typeof debugPushTestReqSchema>
