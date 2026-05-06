import { createRoute, z } from '@hono/zod-openapi'
import { createResBody } from '../utils/schemaParser'

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

export type ServiceInfo = z.infer<typeof serviceInfoSchema>
export type HealthStatus = z.infer<typeof healthStatusSchema>
