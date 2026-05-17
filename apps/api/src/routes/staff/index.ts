import { OpenAPIHono } from '@hono/zod-openapi'
import { staffEventRoutes } from './events'
import { staffMatchRoutes } from './matches'
export const staffRoutes = new OpenAPIHono()
  .route('/events', staffEventRoutes)
  .route('/matches', staffMatchRoutes)
