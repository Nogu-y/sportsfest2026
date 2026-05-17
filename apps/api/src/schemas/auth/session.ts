import { createRoute, z } from '@hono/zod-openapi'
import { createErrResBody, createReqBody, createResBody } from '../../utils/schemaParser'
import { isoDateTimeSchema } from '../common'

// 認証 API で返すアカウント情報の最小単位。
export const authRoleSchema = z.enum(['ADMIN', 'STAFF']).openapi('AuthRole')

export const authAccountSchema = z
  .object({
    id: z.number().int().positive(),
    loginId: z.string(),
    displayName: z.string(),
    role: authRoleSchema
  })
  .openapi('AuthAccount')

export const loginReqSchema = z
  .object({
    loginId: z.string().trim().min(1).max(100),
    password: z.string().min(1).max(255)
  })
  .openapi('AuthLoginRequest')

// セッション確認 API とログイン API の共通レスポンス。
export const authSessionResSchema = z
  .object({
    authenticated: z.literal(true),
    account: authAccountSchema,
    expiresAt: isoDateTimeSchema
  })
  .openapi('AuthSessionResponse')

export const logoutResSchema = z
  .object({
    message: z.string()
  })
  .openapi('AuthLogoutResponse')

// ==========ここからRoute==========

export const loginRoute = createRoute({
  path: '/login',
  method: 'post',
  tags: ['auth'],
  summary: 'アカウントでログインする',
  request: createReqBody(loginReqSchema, true),
  responses: {
    200: createResBody(authSessionResSchema, 'ログイン成功'),
    400: createErrResBody('不正なリクエスト'),
    401: createErrResBody('認証に失敗')
  }
})

export const logoutRoute = createRoute({
  path: '/logout',
  method: 'post',
  tags: ['auth'],
  summary: 'セッションを破棄する',
  responses: {
    200: createResBody(logoutResSchema, 'ログアウト成功')
  }
})

export const sessionRoute = createRoute({
  path: '/session',
  method: 'get',
  tags: ['auth'],
  summary: '現在のセッションを取得する',
  responses: {
    200: createResBody(authSessionResSchema, '取得成功'),
    401: createErrResBody('認証されていません')
  }
})

export const authSessionRoutes = {
  login: loginRoute,
  logout: logoutRoute,
  session: sessionRoute
}
