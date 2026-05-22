import { OpenAPIHono } from '@hono/zod-openapi'
import { TeamsRoutes } from './teams.js'
import { adminEventsRoutes } from './events'
import { adminEventBlocksRoutes } from './eventBlocks'
import { adminMatchesRoutes } from './matches'
import { adminLocationsRoutes } from './locations'
import { adminMapsRoutes } from './maps'
import { adminUsersRoutes } from './users'
import { adminBlockRankingsRoutes } from './blockRankings'
import { requireAdminRole } from '../../middleware/staffAuth'

export const adminRoutes = new OpenAPIHono()
  .use('/*', requireAdminRole)
  .route('/maps', adminMapsRoutes)
  .route('/events', adminEventsRoutes)
  .route('/event-blocks', adminEventBlocksRoutes)
  .route('/matches', adminMatchesRoutes)
  .route('/locations', adminLocationsRoutes)
  .route('/users', adminUsersRoutes)
  .route('/teams', TeamsRoutes)
  .route('/block-rankings', adminBlockRankingsRoutes)
