import { OpenAPIHono } from '@hono/zod-openapi'
import { adminEventsRoutes } from './events'
import { adminMatchesRoutes } from './matches'

export const adminRoutes = new OpenAPIHono()
  .route('/events', adminEventsRoutes)
  .route('/matches', adminMatchesRoutes)

