import { OpenAPIHono } from '@hono/zod-openapi'
import { subscription } from '../../schemas/public/subscriptions'
import {
  createSubscription,
  updateSubscription,
} from '../../repositories/public/subscriptions'

export const SubscriptionRoutes = new OpenAPIHono()
  .openapi( subscription.post, async (c) => {
      const payload = c.req.valid('json')
      const subscription = await createSubscription(payload)
      console.log('[PushDebug] subscription upsert via POST', {
        uuid: payload.uuid,
        endpointLength: payload.endpoint.length,
      })

      if (!subscription) return c.json(
        { message: 'サブスクリプションの登録に失敗しました'}, 500)
      return c.json(subscription, 201)
  })
  .openapi( subscription.put, async (c) => {
      const payload = c.req.valid('json')
      const subscription = await updateSubscription(payload)
      console.log('[PushDebug] subscription update via PUT', {
        uuid: payload.uuid,
        endpointLength: payload.endpoint.length,
      })
      if (!subscription) return c.json(
        { message: '対象 UUID のサブスクリプションが見つかりません' }, 404)
      return c.json(subscription, 200)
  })
