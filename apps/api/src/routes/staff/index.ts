import { OpenAPIHono } from '@hono/zod-openapi'
import { staffMatchesRoutes } from './matches'

export const staffRoutes = new OpenAPIHono()
  .route('/matches', staffMatchesRoutes)
