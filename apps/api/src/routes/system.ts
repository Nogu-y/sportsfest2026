import { Hono } from 'hono'
import { appName } from '@sportsfest/shared'
import { getHealthStatusDoc, getServiceInfoDoc } from '../openapi/system'

export const systemRoutes = new Hono()
  .get('/', getServiceInfoDoc, (c) => {
      return c.json({
        name: appName,
        service: 'api',
        status: 'ok'
      })
    }
  )
  .get('/health', getHealthStatusDoc, (c) => {
      return c.json({ status: 'ok' })
    }
  )
