import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../../db/client'
import { matchParticipants, matchPlans } from '../../db/schema'
import type {
  StaffMatchResultReq,
  StaffMatchResultRes
} from '../../schemas/staff/matches'

type UpdateMatchResultMode = 'create' | 'edit'

type UpdateMatchResultError =
  | { error: 'match_not_found' }
  | { error: 'invalid_status' }
  | { error: 'dependency_unresolved' }
  | { error: 'participant_mismatch' }

export type UpdateMatchResultErrorCode = UpdateMatchResultError['error']

type UpdateMatchResultResult = StaffMatchResultRes | UpdateMatchResultError

const creatableStatuses = ['Finished'] as const
const editableStatuses = ['Finished', 'Completed'] as const

const mapAllowedStatuses = (mode: UpdateMatchResultMode) => {
  return new Set<string>(
    mode === 'create' ? creatableStatuses : editableStatuses
  )
}

export const updateStaffMatchResult = async (
  matchId: number,
  input: StaffMatchResultReq,
  mode: UpdateMatchResultMode
): Promise<UpdateMatchResultResult> => {
  const [match] = await db
    .select()
    .from(matchPlans)
    .where(eq(matchPlans.id, matchId))

  if (!match) {
    return { error: 'match_not_found' }
  }

  if (!mapAllowedStatuses(mode).has(match.status)) {
    return { error: 'invalid_status' }
  }

  const currentParticipants = await db
    .select()
    .from(matchParticipants)
    .where(eq(matchParticipants.matchPlanId, matchId))

  if (currentParticipants.some((participant) => participant.teamId === null)) {
    return { error: 'dependency_unresolved' }
  }

  const currentParticipantIds = currentParticipants
    .map((participant) => participant.id)
    .sort((a, b) => a - b)

  const inputParticipantIds = input.participants
    .map((participant) => participant.participantId)
    .sort((a, b) => a - b)

  if (
    currentParticipantIds.length !== inputParticipantIds.length ||
    currentParticipantIds.some((id, index) => id !== inputParticipantIds[index])
  ) {
    return { error: 'participant_mismatch' }
  }

  const participantsById = new Map(
    input.participants.map((participant) => [participant.participantId, participant])
  )

  return db.transaction(async (tx) => {
    const participantIds = input.participants.map(
      (participant) => participant.participantId
    )

    for (const participant of input.participants) {
      await tx
        .update(matchParticipants)
        .set({
          score: participant.score,
          rank: participant.rank,
          isDisqualified: participant.isDisqualified
        })
        .where(
          and(
            eq(matchParticipants.id, participant.participantId),
            eq(matchParticipants.matchPlanId, matchId)
          )
        )
    }

    await tx
      .update(matchPlans)
      .set({
        status: 'Completed',
        note: input.note ?? null
      })
      .where(eq(matchPlans.id, matchId))

    const updatedParticipants = await tx
      .select()
      .from(matchParticipants)
      .where(
        and(
          eq(matchParticipants.matchPlanId, matchId),
          inArray(matchParticipants.id, participantIds)
        )
      )

    return {
      matchId,
      status: 'Completed',
      note: input.note ?? null,
      participants: updatedParticipants
        .sort((a, b) => a.id - b.id)
        .map((participant) => {
          const payload = participantsById.get(participant.id)

          return {
            participantId: participant.id,
            teamId: participant.teamId,
            score: payload?.score ?? participant.score,
            rank: payload?.rank ?? participant.rank,
            isDisqualified: payload?.isDisqualified ?? participant.isDisqualified
          }
        })
    } satisfies StaffMatchResultRes
  })
}
