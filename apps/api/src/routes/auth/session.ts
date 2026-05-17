import { OpenAPIHono } from '@hono/zod-openapi'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { authSessionRoutes } from '../../schemas/auth/session'
import {
  deleteAuthSession,
  getAuthSession,
  loginAccount
} from '../../repositories/auth/session'
import {
  authSessionCookieName,
  createSessionCookieOptions
} from '../../utils/auth'

// セッション無効時に Cookie を確実に削除する。
const clearAuthSessionCookie = (c: Parameters<typeof deleteCookie>[0]) => {
  deleteCookie(c, authSessionCookieName, {
    path: '/'
  })
}

export const authSessionRoute = new OpenAPIHono()
  .openapi(authSessionRoutes.login, async (c) => {
    // 検証済みの認証情報を受け取り、成功時だけ Cookie を発行する。
    const { loginId, password } = c.req.valid('json')
    const result = await loginAccount(loginId, password)

    if ('error' in result) {
      return c.json({ message: 'ログインIDまたはパスワードが正しくありません' }, 401)
    }

    setCookie(
      c,
      authSessionCookieName,
      result.token,
      createSessionCookieOptions(new Date(result.expiresAt))
    )

    return c.json(
      {
        authenticated: result.authenticated,
        account: result.account,
        expiresAt: result.expiresAt
      },
      200
    )
  })
  .openapi(authSessionRoutes.logout, async (c) => {
    // Cookie が残っていれば対応するサーバー側セッションも破棄する。
    const token = getCookie(c, authSessionCookieName)

    if (token) {
      await deleteAuthSession(token)
    }

    clearAuthSessionCookie(c)

    return c.json({ message: 'ログアウトしました' }, 200)
  })
  .openapi(authSessionRoutes.session, async (c) => {
    // クライアントが持つ Cookie から現在のログイン状態を復元する。
    const token = getCookie(c, authSessionCookieName)

    if (!token) {
      clearAuthSessionCookie(c)
      return c.json({ message: '認証されていません' }, 401)
    }

    const result = await getAuthSession(token)

    if ('error' in result) {
      clearAuthSessionCookie(c)
      return c.json({ message: '認証されていません' }, 401)
    }

    return c.json(result, 200)
  })
