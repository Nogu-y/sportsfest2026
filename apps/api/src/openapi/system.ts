import { describeRoute, resolver } from 'hono-openapi'
import { healthStatusSchema, serviceInfoSchema } from '../schemas/system'

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
