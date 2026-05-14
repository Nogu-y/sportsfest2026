import { OpenAPIHono } from '@hono/zod-openapi'
import { TeamsRoutes } from './teams.js'

export const publicRoutes = new OpenAPIHono()
  .route('/teams', TeamsRoutes)