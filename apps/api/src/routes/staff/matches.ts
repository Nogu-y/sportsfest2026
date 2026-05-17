import { OpenAPIHono } from '@hono/zod-openapi'
import {
  patchStaffMatchResultRoute,
  postStaffMatchResultRoute
} from '../../schemas/staff/matches'
import {
  updateStaffMatchResult,
  type UpdateMatchResultErrorCode
} from '../../repositories/staff/matches'

const mapResultError = (error: UpdateMatchResultErrorCode) => {
  switch (error) {
    case 'match_not_found':
      return {
        status: 404 as const,
        body: { message: '対象試合が見つかりません' }
      }
    case 'invalid_status':
      return {
        status: 409 as const,
        body: { message: '現在の試合ステータスでは結果を登録できません' }
      }
    case 'dependency_unresolved':
      return {
        status: 409 as const,
        body: { message: '勝ち上がりチームが未確定のため結果を登録できません' }
      }
    case 'participant_mismatch':
      return {
        status: 400 as const,
        body: { message: '対象試合の参加者情報とリクエスト内容が一致しません' }
      }
  }
}

export const staffMatchRoutes = new OpenAPIHono()
  .openapi(postStaffMatchResultRoute, async (c) => {
    const { matchId } = c.req.valid('param')
    const input = c.req.valid('json')
    const result = await updateStaffMatchResult(matchId, input, 'create')

    if ('error' in result) {
      const error = mapResultError(result.error)
      return c.json(error.body, error.status)
    }

    return c.json(result, 200)
  })
  .openapi(patchStaffMatchResultRoute, async (c) => {
    const { matchId } = c.req.valid('param')
    const input = c.req.valid('json')
    const result = await updateStaffMatchResult(matchId, input, 'edit')

    if ('error' in result) {
      const error = mapResultError(result.error)
      return c.json(error.body, error.status)
    }

    return c.json(result, 200)
  })
