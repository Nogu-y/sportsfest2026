import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { matchPlans } from '../../db/schema'
import type {
  UpdateMatchStatusReq,
  UpdateMatchStatusRes
} from '../../schemas/staff/matches'
import { toIsoString } from '../../utils/dates'

const mapMatchStatus = (
  match: typeof matchPlans.$inferSelect
): UpdateMatchStatusRes => ({
  id: match.id,
  status: match.status,
  startedAt: toIsoString(match.startedAt),
  endedAt: toIsoString(match.endedAt)
})

export const updateMatchStatus = async (
  matchId: number,
  input: UpdateMatchStatusReq
) => {
  const [currentMatch] = await db
    .select()
    .from(matchPlans)
    .where(eq(matchPlans.id, matchId))
    .limit(1)

  if (!currentMatch) {
    return null
  }

  const now = new Date()
  const values: Partial<typeof matchPlans.$inferInsert> = {
    status: input.status
  }

  if (input.status === 'Playing') {
    values.startedAt = currentMatch.startedAt ?? now
    values.endedAt = null
  }

  if (input.status === 'Finished') {
    values.endedAt = currentMatch.endedAt ?? now
  }

  const [updatedMatch] = await db
    .update(matchPlans)
    .set(values)
    .where(eq(matchPlans.id, matchId))
    .returning()

  return mapMatchStatus(updatedMatch)
}