import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { matchParticipants, matchPlans } from '../../db/schema'
import { mapParticipant } from '../../utils/mappers'
import type {
  CreateMatchRequest,
  MatchParticipantRequest,
  UpdateMatchRequest,
} from '../../schemas/admin/matches'

export async function getMatch() {
  const matches = await db.select().from(matchPlans)

  return matches.map((match) => ({
    ...match,
    participants: [],
  }))
}

function buildParticipantRows(matchPlanId: number, participants: MatchParticipantRequest[]) {
  return participants.map((participant) => ({
    matchPlanId,
    teamId: participant.teamId ?? null,
    prereqMatchId: participant.prereqMatchId ?? null,
    prereqBlockId: participant.prereqBlockId ?? null,
    prereqRank: participant.prereqRank ?? null,
    score: participant.score ?? null,
    rank: participant.rank ?? null,
    isDisqualified: participant.isDisqualified ?? false,
  }))
}

export const createMatch = async (data: CreateMatchRequest) => {
  const { participants = [], ...matchData } = data

  return await db.transaction(async (tx) => {
    const [newMatch] = await tx.insert(matchPlans).values(matchData).returning()

    const insertedParticipants = participants.length > 0
      ? await tx
          .insert(matchParticipants)
          .values(buildParticipantRows(newMatch.id, participants))
          .returning()
      : []

    return {
      ...newMatch,
      participants: insertedParticipants.map(mapParticipant),
    }
  })
}

export const updateMatch = async (id: number, data: UpdateMatchRequest) => {
  const { participants, ...matchData } = data

  return await db.transaction(async (tx) => {
    const [currentMatch] = await tx
      .select()
      .from(matchPlans)
      .where(eq(matchPlans.id, id))
      .limit(1)

    if (!currentMatch) return null

    const [updatedMatch] =
      Object.keys(matchData).length > 0
        ? await tx
            .update(matchPlans)
            .set(matchData)
            .where(eq(matchPlans.id, id))
            .returning()
        : [currentMatch]

    let currentParticipants = await tx
      .select()
      .from(matchParticipants)
      .where(eq(matchParticipants.matchPlanId, id))

    if (participants !== undefined) {
      await tx.delete(matchParticipants).where(eq(matchParticipants.matchPlanId, id))

      currentParticipants = participants.length > 0
        ? await tx
            .insert(matchParticipants)
            .values(buildParticipantRows(id, participants))
            .returning()
        : []
    }

    return {
      ...updatedMatch,
      participants: currentParticipants.map(mapParticipant),
    }
  })
}

export const deleteMatch = async (id: number) => {
  await db.delete(matchPlans).where(eq(matchPlans.id, id))
}
