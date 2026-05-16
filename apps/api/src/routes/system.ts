import { OpenAPIHono } from '@hono/zod-openapi'
import { appName } from '@sportsfest/shared'
import { getHealthStatusDoc, getServiceInfoDoc } from '../schemas/system'

export const systemRoutes = new OpenAPIHono()
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
