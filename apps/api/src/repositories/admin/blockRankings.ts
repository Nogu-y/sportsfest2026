import { asc, eq, inArray } from 'drizzle-orm'
import { db } from '../../db/client'
import { blockRankings, eventBlocks, teams } from '../../db/schema'

type ReplaceInputRow = {
  teamId: number
  rank: number
  points: number
  note: string | null
}

export async function getBlockRankings() {
  return await db.select().from(blockRankings).orderBy(asc(blockRankings.eventBlockId), asc(blockRankings.rank), asc(blockRankings.id))
}

export async function existsEventBlock(eventBlockId: number) {
  const [row] = await db
    .select({ id: eventBlocks.id })
    .from(eventBlocks)
    .where(eq(eventBlocks.id, eventBlockId))
    .limit(1)

  return Boolean(row)
}

export async function countExistingTeams(teamIds: number[]) {
  if (teamIds.length === 0) return 0

  const rows = await db
    .select({ id: teams.id })
    .from(teams)
    .where(inArray(teams.id, teamIds))

  return rows.length
}

export async function replaceBlockRankingsByBlock(eventBlockId: number, rankings: ReplaceInputRow[]) {
  return await db.transaction(async (tx) => {
    await tx.delete(blockRankings).where(eq(blockRankings.eventBlockId, eventBlockId))

    if (rankings.length === 0) {
      return []
    }

    return await tx
      .insert(blockRankings)
      .values(
        rankings.map((row) => ({
          eventBlockId,
          teamId: row.teamId,
          rank: row.rank,
          points: row.points,
          note: row.note,
        })),
      )
      .returning()
  })
}
