import { OpenAPIHono } from '@hono/zod-openapi'
import { updateMatchResult, updateMatchStatus } from '../../repositories/staff/matches'
import {
  createMatchResultRoute,
  patchMatchResultRoute,
  updateMatchStatusRoute
} from '../../schemas/staff/matches'

export const staffMatchesRoutes = new OpenAPIHono()
  .openapi(updateMatchStatusRoute, async (c) => {
    try {
      const { matchId } = c.req.valid('param')
      const input = c.req.valid('json')
      const match = await updateMatchStatus(matchId, input)

      if (!match) {
        return c.json({ message: '試合が見つかりません' }, 404)
      }

      return c.json(match, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: '試合ステータスの更新に失敗しました' }, 500)
    }
  })
  .openapi(createMatchResultRoute, async (c) => {
    try {
      const { matchId } = c.req.valid('param')
      const input = c.req.valid('json')
      const result = await updateMatchResult(matchId, input)

      if ('error' in result) {
        if (result.error === 'match_not_found') {
          return c.json({ message: '試合が見つかりません' }, 404)
        }

        if (result.error === 'unresolved_participants') {
          return c.json({ message: '勝ち上がりチームが未確定のため結果入力できません' }, 409)
        }

        return c.json({ message: 'participantId または入力値が不正です' }, 422)
      }

      return c.json(result, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: '試合結果の登録に失敗しました' }, 500)
    }
  })
  .openapi(patchMatchResultRoute, async (c) => {
    try {
      const { matchId } = c.req.valid('param')
      const input = c.req.valid('json')
      const result = await updateMatchResult(matchId, input)

      if ('error' in result) {
        if (result.error === 'match_not_found') {
          return c.json({ message: '試合が見つかりません' }, 404)
        }

        if (result.error === 'unresolved_participants') {
          return c.json({ message: '勝ち上がりチームが未確定のため結果入力できません' }, 409)
        }

        return c.json({ message: 'participantId または入力値が不正です' }, 422)
      }

      return c.json(result, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: '試合結果の修正に失敗しました' }, 500)
    }
  })

export type StaffMatchesRoutes = typeof staffMatchesRoutes
