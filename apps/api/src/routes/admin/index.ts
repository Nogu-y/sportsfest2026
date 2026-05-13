import { OpenAPIHono } from '@hono/zod-openapi'
import { adminEventsRoutes } from './events'
import { adminLocationsRoutes } from './locations'

export const adminRoutes = new OpenAPIHono()
    .route( '/events', adminEventsRoutes)
    .route('/events', adminEventsRoutes)
    .route('/locations', adminLocationsRoutes)