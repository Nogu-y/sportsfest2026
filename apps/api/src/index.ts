import { $, OpenAPIHono } from '@hono/zod-openapi'
import { cors } from "hono/cors"
import { registerOpenAPIRoutes } from './openapi'
import { publicRoutes } from './routes/public'
import { systemRoutes } from './routes/system'
import { serve } from '@hono/node-server'
import { apiEnv } from './env'

export const app = $(
  new OpenAPIHono()
  .use("/*", cors())
  .route('/api/system', systemRoutes)
  .route('/api/public', publicRoutes)
)

registerOpenAPIRoutes(app)

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
