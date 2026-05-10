import { OpenAPIHono } from '@hono/zod-openapi'
import { Watchlist } from '../../schemas/public/watchlist'
import {
  addWatchlistMatch,
  deleteWatchlistMatch,
  getWatchlist
} from '../../repositories/public/watchlist'
import { createNotFoundResponse } from '../../utils/response'

export const publicWatchlistRoutes = new OpenAPIHono()
  .openapi(Watchlist.get, async (c) => {
    const { uuid } = c.req.valid('query')
    const result = await getWatchlist(uuid)

    if ('error' in result) {
      return c.json(
        createNotFoundResponse('対象 UUID のサブスクリプションが見つかりません'),
        404
      )
    }

    return c.json(result, 200)
  })

  .openapi(Watchlist.post, async (c) => {
    const { uuid, matchPlanIds } = c.req.valid('json')
    const result = await addWatchlistMatch(uuid, matchPlanIds)

    if ('error' in result) {
      if (result.error === 'subscription_not_found') {
        return c.json(createNotFoundResponse('対象 UUID のサブスクリプションが見つかりません'), 404)
      }
      return c.json(createNotFoundResponse('対象試合が見つかりません'), 404)
    }
    return c.json(result, 200)
  })

  .openapi(Watchlist.delete, async (c) => {
    const { uuid, matchPlanIds } = c.req.valid('json')
    const result = await deleteWatchlistMatch(uuid, matchPlanIds)
    if ('error' in result) {
      return c.json(createNotFoundResponse('対象 UUID のサブスクリプションが見つかりません'), 404)
    }
    return c.json(result, 200)
  })
