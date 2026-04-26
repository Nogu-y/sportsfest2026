import { Hono } from 'hono'
import { registerOpenAPIRoutes } from './openapi'
import { systemRoutes } from './routes/system'
import { serve } from '@hono/node-server'
import { apiEnv } from './env'

export const app = new Hono()

app.route('/', systemRoutes)

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