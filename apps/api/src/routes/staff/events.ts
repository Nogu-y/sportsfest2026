import { OpenAPIHono } from '@hono/zod-openapi'
import {
  finalizeBlockRankingsRoute,
  finalizeEventScoreRoute,
  resolveEventParticipantsRoute
} from '../../schemas/staff/events'
import {
  finalizeEventBlockRankings,
  finalizeEventScores,
  resolveEventParticipants
} from '../../repositories/staff/events'
import { createNotFoundResponse } from '../../utils/response'

export const staffEventRoutes = new OpenAPIHono()
  .openapi(finalizeBlockRankingsRoute, async (c) => {
    const { eventId } = c.req.valid('param')
    const result = await finalizeEventBlockRankings(eventId)

    if ('error' in result) {
      if (result.error === 'event_not_found') {
        return c.json(createNotFoundResponse('対象競技が見つかりません'), 404)
      }

      return c.json(
        {
          message: '順位確定に必要な試合結果が不足しています',
          detail: result.detail ?? null
        },
        409
      )
    }

    return c.json(result, 200)
  })
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
  .openapi(resolveEventParticipantsRoute, async (c) => {
    const { eventId } = c.req.valid('param')
    const result = await resolveEventParticipants(eventId)

    if ('error' in result) {
      if (result.error === 'event_not_found') {
        return c.json(createNotFoundResponse('対象競技が見つかりません'), 404)
      }

      return c.json(
        {
          message: '勝ち上がり元の結果または順位が不足しているため反映できません',
          detail: result.detail ?? null
        },
        409
      )
    }

    return c.json(result, 200)
  })
