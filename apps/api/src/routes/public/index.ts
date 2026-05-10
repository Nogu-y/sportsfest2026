import { OpenAPIHono } from '@hono/zod-openapi'
import { publicLiveRoutes } from './live'
import { publicMasterRoutes } from './master'
import { SubscriptionRoutes } from './subscriptions'
import { publicWatchlistRoutes } from './watchlist'

export const publicRoutes = new OpenAPIHono()
  .route('/master', publicMasterRoutes)
  .route('/live', publicLiveRoutes)
  .route('/subscriptions', SubscriptionRoutes)
  .route('/watchlist', publicWatchlistRoutes)
