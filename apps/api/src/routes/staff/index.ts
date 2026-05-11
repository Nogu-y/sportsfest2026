import { OpenAPIHono } from '@hono/zod-openapi'
import { staffEventRoutes } from './events'

export const staffRoutes = new OpenAPIHono()
  .route('/events', staffEventRoutes)
