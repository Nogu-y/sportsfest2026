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

export type ServiceInfo = v.InferOutput<typeof serviceInfoSchema>
export type HealthStatus = v.InferOutput<typeof healthStatusSchema>
