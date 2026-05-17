import { OpenAPIHono } from '@hono/zod-openapi'
import { updateMatchStatus } from '../../repositories/staff/matches'
import { updateMatchStatusRoute } from '../../schemas/staff/matches'

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

export type StaffMatchesRoutes = typeof staffMatchesRoutes
