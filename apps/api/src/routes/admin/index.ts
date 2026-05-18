import { OpenAPIHono } from '@hono/zod-openapi'
import { TeamsRoutes } from './teams.js'
import { adminEventsRoutes } from './events'
import { adminEventBlocksRoutes } from './eventBlocks'
import { adminMatchesRoutes } from './matches'
import { adminLocationsRoutes } from './locations'

export const adminRoutes = new OpenAPIHono()
  .route('/events', adminEventsRoutes)
  .route('/event-blocks', adminEventBlocksRoutes)
  .route('/matches', adminMatchesRoutes)
  .route('/locations', adminLocationsRoutes)
  .route('/teams', TeamsRoutes)
