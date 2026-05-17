import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { getAuthSession } from '../repositories/auth/session'
import { authSessionCookieName } from '../utils/auth'

export type AuthSessionEnv = {
  Variables: {
    authSession: Awaited<ReturnType<typeof getAuthSession>>
  }
}

// 後続の protected route で再利用する認証チェック用 Middleware。
export const requireAuthSession = createMiddleware<AuthSessionEnv>(async (c, next) => {
  const token = getCookie(c, authSessionCookieName)

  if (!token) {
    return c.json({ message: '認証されていません' }, 401)
  }

  const session = await getAuthSession(token)

  if ('error' in session) {
    return c.json({ message: '認証されていません' }, 401)
  }

  // ハンドラ側でログイン中アカウント情報を参照できるようにする。
  c.set('authSession', session)

  await next()
})
