import { OpenAPIHono } from '@hono/zod-openapi'
import { appName } from '@sportsfest/shared'
import { getHealthStatusDoc, getServiceInfoDoc, postDebugPushTestDoc } from '../schemas/system'
import { type AuthSessionEnv } from '../middleware/staffAuth'
import { db } from '../db/client'
import { userSubscriptions } from '../db/schema'
import { eq } from 'drizzle-orm'
import webpush from 'web-push'
import { getCookie } from 'hono/cookie'
import { authSessionCookieName } from '../utils/auth'
import { getAuthSession } from '../repositories/auth/session'

webpush.setVapidDetails(
  process.env.MAIL_ADDRESS!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export const systemRoutes = new OpenAPIHono<AuthSessionEnv>()
  .openapi(getServiceInfoDoc, (c) => {
    return c.json(
      {
        name: appName,
        service: 'api',
        status: 'ok'
      },
      200
    )
  })
  .openapi(getHealthStatusDoc, (c) => {
    return c.json({ status: 'ok' }, 200)
  })
  .openapi(postDebugPushTestDoc, async (c) => {
    const token = getCookie(c, authSessionCookieName)
    if (!token) {
      return c.json({ message: '認証されていません' }, 401)
    }
    const session = await getAuthSession(token)
    if ('error' in session) {
      return c.json({ message: '認証されていません' }, 401)
    }
    if (session.account.role !== 'ADMIN') {
      return c.json({ message: '権限がありません' }, 403)
    }

    const payload = c.req.valid('json')
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.uuid, payload.uuid))
      .limit(1)

    if (!subscription) {
      return c.json({ message: '対象 UUID の購読が見つかりません' }, 404)
    }

    const title = payload.title ?? '通知テスト'
    const body = payload.body ?? 'デバッグAPIからのテスト通知です'

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify({
          title,
          body,
          url: payload.url ?? '/',
        }),
        {
          headers: {
            Urgency: 'high',
          },
        }
      )

      console.log('[PushDebug] manual test sent', {
        uuid: payload.uuid,
        subscriptionId: subscription.id,
      })

      return c.json(
        {
          ok: true,
          uuid: payload.uuid,
          subscriptionId: subscription.id,
          endpoint: subscription.endpoint,
          title,
          body,
        },
        200
      )
    } catch (error) {
      const err = error as { statusCode?: number; body?: unknown; message?: string }
      console.error('[PushDebug] manual test failed', {
        uuid: payload.uuid,
        subscriptionId: subscription.id,
        statusCode: err?.statusCode,
        body: err?.body ?? err?.message ?? 'unknown',
      })
      return c.json({ message: 'テスト通知の送信に失敗しました' }, 500)
    }
  })
