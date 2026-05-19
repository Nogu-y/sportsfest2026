import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../../db/client'
import { matchParticipants, matchPlans } from '../../db/schema'
import type {
  CreateMatchResultReq,
  UpdateMatchResultRes,
  UpdateMatchStatusReq,
  UpdateMatchStatusRes
} from '../../schemas/staff/matches'
import { toIsoString } from '../../utils/dates'

type UpdateMatchResultError =
  | 'match_not_found'
  | 'unresolved_participants'
  | 'invalid_participant_ids'

const mapMatchStatus = (
  match: typeof matchPlans.$inferSelect
): UpdateMatchStatusRes => ({
  id: match.id,
  status: match.status,
  startedAt: toIsoString(match.startedAt),
  endedAt: toIsoString(match.endedAt)
})

const mapMatchResult = (
  match: typeof matchPlans.$inferSelect,
  participants: Array<typeof matchParticipants.$inferSelect>
): UpdateMatchResultRes => ({
  id: match.id,
  status: match.status,
  startedAt: toIsoString(match.startedAt),
  endedAt: toIsoString(match.endedAt),
  participants: participants.map((participant) => ({
    id: participant.id,
    teamId: participant.teamId,
    score: participant.score,
    rank: participant.rank,
    isDisqualified: participant.isDisqualified
  }))
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

export const updateMatchResult = async (
  matchId: number,
  input: CreateMatchResultReq
) => {
  return db.transaction(async (tx) => {
    const [match] = await tx
      .select()
      .from(matchPlans)
      .where(eq(matchPlans.id, matchId))
      .limit(1)

    if (!match) {
      return { error: 'match_not_found' as UpdateMatchResultError }
    }

    const participants = await tx
      .select()
      .from(matchParticipants)
      .where(eq(matchParticipants.matchPlanId, matchId))

    if (participants.some((participant) => participant.teamId === null)) {
      return { error: 'unresolved_participants' as UpdateMatchResultError }
    }

    const dbIds = new Set(participants.map((participant) => participant.id))
    const inputIds = input.participants.map((participant) => participant.participantId)
    const uniqueInputIds = new Set(inputIds)

    const hasInvalidId = inputIds.some((id) => !dbIds.has(id)) || uniqueInputIds.size !== inputIds.length
    if (hasInvalidId) {
      return { error: 'invalid_participant_ids' as UpdateMatchResultError }
    }

    for (const item of input.participants) {
      await tx
        .update(matchParticipants)
        .set({
          score: item.score,
          rank: item.rank,
          isDisqualified: item.isDisqualified ?? false
        })
        .where(
          and(
            eq(matchParticipants.id, item.participantId),
            eq(matchParticipants.matchPlanId, matchId)
          )
        )
    }

    const [updatedMatch] = await tx
      .update(matchPlans)
      .set({
        status: 'Completed',
        endedAt: match.endedAt ?? new Date()
      })
      .where(eq(matchPlans.id, matchId))
      .returning()

    const participantIds = Array.from(uniqueInputIds)
    const updatedParticipants = participantIds.length === 0
      ? []
      : await tx
          .select()
          .from(matchParticipants)
          .where(inArray(matchParticipants.id, participantIds))

    return mapMatchResult(updatedMatch, updatedParticipants)
  })
}
