import { OpenAPIHono } from '@hono/zod-openapi'
import {
  getBlockRankingsRoute,
  replaceBlockRankingsRoute,
} from '../../schemas/admin/blockRankings'
import {
  countExistingTeams,
  existsEventBlock,
  getBlockRankings,
  replaceBlockRankingsByBlock,
} from '../../repositories/admin/blockRankings'

export const adminBlockRankingsRoutes = new OpenAPIHono()
  .openapi(getBlockRankingsRoute, async (c) => {
    try {
      const rows = await getBlockRankings()
      return c.json(rows, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'ブロック順位の取得に失敗しました' }, 500)
    }
  })

  .openapi(replaceBlockRankingsRoute, async (c) => {
    try {
      const { eventBlockId } = c.req.valid('param')
      const body = c.req.valid('json')

      if (!(await existsEventBlock(eventBlockId))) {
        return c.json({ message: 'イベントブロックが見つかりません' }, 404)
      }

      const teamIds = body.rankings.map((row) => row.teamId)
      const ranks = body.rankings.map((row) => row.rank)
      const uniqueTeamIds = new Set(teamIds)
      const uniqueRanks = new Set(ranks)

      if (uniqueTeamIds.size !== teamIds.length || uniqueRanks.size !== ranks.length) {
        return c.json({ message: '同じブロック内で teamId または rank が重複しています' }, 409)
      }

      if (teamIds.length > 0) {
        const existingTeamCount = await countExistingTeams([...uniqueTeamIds])
        if (existingTeamCount !== uniqueTeamIds.size) {
          return c.json({ message: '存在しない teamId が含まれています' }, 404)
        }
      }

      const updatedRows = await replaceBlockRankingsByBlock(
        eventBlockId,
        body.rankings.map((row) => ({
          teamId: row.teamId,
          rank: row.rank,
          points: row.points ?? 0,
          note: row.note ?? null,
        })),
      )

      return c.json(updatedRows, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'ブロック順位の更新に失敗しました' }, 500)
    }
  })

export type AdminBlockRankingsRoutes = typeof adminBlockRankingsRoutes
