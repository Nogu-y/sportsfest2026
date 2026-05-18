import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { getAuthSession } from '../repositories/auth/session'
import { authSessionCookieName } from '../utils/auth'
import type { AuthAccountRole } from '../repositories/auth/accountAdmin'

export type AuthSessionEnv = {
  Variables: {
    authSession: Awaited<ReturnType<typeof getAuthSession>>
  }
}

const createRequireRoleMiddleware = (allowedRoles: AuthAccountRole[]) =>
  createMiddleware<AuthSessionEnv>(async (c, next) => {
    const token = getCookie(c, authSessionCookieName)

    if (!token) {
      return c.json({ message: '認証されていません' }, 401)
    }

    const session = await getAuthSession(token)

    if ('error' in session) {
      return c.json({ message: '認証されていません' }, 401)
    }

    c.set('authSession', session)

    if (!allowedRoles.includes(session.account.role)) {
      return c.json({ message: '権限がありません' }, 403)
    }

    await next()
  })

export const requireAdminRole = createRequireRoleMiddleware(['ADMIN'])

export const requireStaffRole = createRequireRoleMiddleware(['ADMIN', 'STAFF'])
