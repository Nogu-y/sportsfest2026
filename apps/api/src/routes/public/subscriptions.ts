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

      if (!subscription) return c.json(
        { message: '同じ UUID のサブスクリプションがすでに存在します'}, 409)
      return c.json(subscription, 201)
  })
  .openapi( subscription.put, async (c) => {
      const payload = c.req.valid('json')
      const subscription = await updateSubscription(payload)
      if (!subscription) return c.json(
        { message: '対象 UUID のサブスクリプションが見つかりません' }, 404)
      return c.json(subscription, 200)
  })