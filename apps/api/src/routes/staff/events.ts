import { OpenAPIHono } from '@hono/zod-openapi'
import { finalizeEventScoreRoute } from '../../schemas/staff/events'
import { finalizeEventScores } from '../../repositories/staff/events'
import { createNotFoundResponse } from '../../utils/response'

export const staffEventRoutes = new OpenAPIHono()
  .openapi(finalizeEventScoreRoute, async (c) => {
    const { eventId } = c.req.valid('param')
    const result = await finalizeEventScores(eventId)

    if ('error' in result) {
      if (result.error === 'event_not_found') {
        return c.json(createNotFoundResponse('対象競技が見つかりません'), 404)
      }

      if (result.error === 'invalid_point_allocation') {
        return c.json(
          { message: '配点設定が API 仕様に準拠していません。ステージごとの順位キーは数値で指定してください' },
          422
        )
      }

      return c.json(
        { message: '得点確定に必要な試合結果または順位データが不足しています' },
        409
      )
    }

    return c.json(result, 200)
  })
