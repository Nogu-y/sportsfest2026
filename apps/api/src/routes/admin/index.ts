import { OpenAPIHono } from '@hono/zod-openapi'
import { adminEventsRoutes } from './events'

export const adminRoutes = new OpenAPIHono().route( '/events', adminEventsRoutes)

