import { $, OpenAPIHono } from '@hono/zod-openapi'
import { cors } from "hono/cors"
import { registerOpenAPIRoutes } from './openapi'
import { authRoutes } from './routes/auth'
import { publicRoutes } from './routes/public'
import { staffRoutes } from './routes/staff'
import { adminRoutes } from './routes/admin'
import { systemRoutes } from './routes/system'
import { serve } from '@hono/node-server'
import { apiEnv } from './env'

export const app = new OpenAPIHono()
  .use("/*", cors())
  .route('/api/system', systemRoutes)
  .route('/api/auth', authRoutes)
  .route('/api/public', publicRoutes)
  .route('/api/staff', staffRoutes)
  .route('/api/admin', adminRoutes)


registerOpenAPIRoutes($(app))

export type AppType = typeof app



const port = apiEnv.PORT || 8787

serve({
    fetch: app.fetch,
    // hostname: "0.0.0.0",
    port
  },
  () => {
    console.log(`api listening on http://localhost:${port}`)
  }
)
