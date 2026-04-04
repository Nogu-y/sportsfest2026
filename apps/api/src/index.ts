import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { appName } from '@sportsfest/shared'

const app = new Hono()

app.get('/', (c) => {
  return c.json({
    name: appName,
    service: 'api',
    status: 'ok'
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

const port = Number(process.env.PORT ?? 8787)

serve(
  {
    fetch: app.fetch,
    port
  },
  () => {
    console.log(`api listening on http://localhost:${port}`)
  }
)
