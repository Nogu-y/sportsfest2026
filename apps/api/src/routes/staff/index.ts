import { OpenAPIHono } from '@hono/zod-openapi'
import { staffEventRoutes } from './events'
import { staffMatchesRoutes } from './matches'

export const staffRoutes = new OpenAPIHono()
  .route('/events', staffEventRoutes)
  .route('/matches', staffMatchesRoutes)
