import { OpenAPIHono } from '@hono/zod-openapi'
import { staffMatchRoutes } from './matches'

export const staffRoutes = new OpenAPIHono()
  .route('/matches', staffMatchRoutes)
