import { OpenAPIHono } from '@hono/zod-openapi'
import { TeamsRoutes } from './teams.js'
import { adminEventsRoutes } from './events'

export const publicRoutes = new OpenAPIHono()
  .route('/teams', TeamsRoutes)
  .route( '/events', adminEventsRoutes)

