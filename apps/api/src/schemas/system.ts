import { describeRoute, resolver } from 'hono-openapi'
import * as v from 'valibot'

export const serviceInfoSchema = v.pipe(
  v.object({
    name: v.string(),
    service: v.literal('api'),
    status: v.literal('ok')
  }),
  v.description('API の基本稼働情報'),
  v.metadata({ ref: 'ServiceInfo' })
)

export const healthStatusSchema = v.pipe(
  v.object({
    status: v.literal('ok')
  }),
  v.description('API のヘルスチェック結果'),
  v.metadata({ ref: 'HealthStatus' })
)

export const getServiceInfoDoc = describeRoute({
  tags: ['system'],
  summary: 'API の稼働状態を返す',
  responses: {
    200: {
      description: 'API が正常に応答している',
      content: {
        'application/json': {
          schema: resolver(serviceInfoSchema)
        }
      }
    }
  }
})

export const getHealthStatusDoc = describeRoute({
  tags: ['system'],
  summary: 'ヘルスチェック結果を返す',
  responses: {
    200: {
      description: 'API が正常稼働している',
      content: {
        'application/json': {
          schema: resolver(healthStatusSchema)
        }
      }
    }
  }
})

export type ServiceInfo = v.InferOutput<typeof serviceInfoSchema>
export type HealthStatus = v.InferOutput<typeof healthStatusSchema>
