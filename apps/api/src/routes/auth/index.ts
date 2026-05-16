import { OpenAPIHono } from '@hono/zod-openapi'
import { authSessionRoute } from './session'

// 認証系エンドポイントを `/api/auth/*` にまとめる。
export const authRoutes = new OpenAPIHono()
  .route('/', authSessionRoute)
