import { OpenAPIHono } from '@hono/zod-openapi'
import { staffEventRoutes } from './events'
import { staffMatchesRoutes } from './matches'
import { requireStaffRole } from '../../middleware/staffAuth'

export const staffRoutes = new OpenAPIHono()
  .use('/*', requireStaffRole)
  .route('/events', staffEventRoutes)
  .route('/matches', staffMatchesRoutes)
