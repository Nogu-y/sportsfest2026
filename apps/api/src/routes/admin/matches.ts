import { OpenAPIHono } from '@hono/zod-openapi'
import {
  getMatchesRoute,
  createMatchRoute,
  updateMatchRoute,
  deleteMatchRoute,
} from '../../schemas/admin/matches'
import { getMatch, createMatch, updateMatch, deleteMatch } from '../../repositories/admin/matches'

export const adminMatchesRoutes = new OpenAPIHono()
  // --- POST ---
  .openapi(createMatchRoute, async (c) => {
    try {
      const body = c.req.valid('json')

      // DBに保存し、採番されたID付きのデータを取得
      const newMatch = await createMatch(body)

      // participants は空配列として付与して返す
      return c.json({ ...newMatch, participants: [] }, 201)
    } catch (error) {
      console.error(error)
      return c.json({ message: '試合計画の作成に失敗しました' }, 500)
    }
  })

  // --- PUT ---
  .openapi(updateMatchRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')

      // DBを部分更新
      const updatedMatch = await updateMatch(id, body)

      // 対象のIDが存在しなかった場合
      if (!updatedMatch) {
        return c.json({ message: '試合が見つかりません' }, 404)
      }

      // participants は空配列として付与して返す
      return c.json({ ...updatedMatch, participants: [] }, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: '試合計画の更新に失敗しました' }, 500)
    }
  })

  // --- DELETE ---
  .openapi(deleteMatchRoute, async (c) => {
    try {
      const { id } = c.req.valid('param')

      // DBから削除
      await deleteMatch(id)

      return c.body(null, 204)
    } catch (error) {
      console.error(error)
      return c.json({ message: '試合計画の削除に失敗しました' }, 500)
    }
  })

export type AdminMatchesRoutes = typeof adminMatchesRoutes
