import { and, asc, gte, inArray, lt } from 'drizzle-orm'
import { db } from '../../db/client'
import {
  blockRankings,
  matchParticipants,
  matchPlans,
  scores
} from '../../db/schema'
import type { LiveResponse } from '../../schemas/public/live'
import { toIsoString } from '../../utils/dates'

const liveMatchStatuses = ['Finished', 'Completed', 'Cancelled'] as const

const getJstDayRange = (base = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(base)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('failed to resolve JST date')
  }

  const start = new Date(`${year}-${month}-${day}T00:00:00+09:00`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  return { start, end }
}

const mapParticipant = (
  participant: typeof matchParticipants.$inferSelect
): LiveResponse['matches'][number]['participants'][number] => ({
  id: participant.id,
  teamId: participant.teamId,
  prereqMatchId: participant.prereqMatchId,
  prereqBlockId: participant.prereqBlockId,
  prereqRank: participant.prereqRank,
  score: participant.score,
  rank: participant.rank,
  isDisqualified: participant.isDisqualified
})

const mapMatch = (
  match: typeof matchPlans.$inferSelect,
  participants: LiveResponse['matches'][number]['participants']
): LiveResponse['matches'][number] => ({
  id: match.id,
  eventBlockId: match.eventBlockId,
  locationId: match.locationId,
  name: match.name,
  description: match.description,
  stage: match.stage,
  status: match.status,
  scheduledStartTime: match.scheduledStartTime.toISOString(),
  scheduledEndTime: match.scheduledEndTime.toISOString(),
  startedAt: toIsoString(match.startedAt),
  endedAt: toIsoString(match.endedAt),
  note: match.note,
  participants
})

const mapBlockRanking = (
  ranking: typeof blockRankings.$inferSelect
): LiveResponse['blockRankings'][number] => ({
  eventBlockId: ranking.eventBlockId,
  teamId: ranking.teamId,
  rank: ranking.rank,
  points: ranking.points,
  note: ranking.note
})

const mapScore = (
  score: typeof scores.$inferSelect
): LiveResponse['scores'][number] => ({
  eventId: score.eventId,
  teamId: score.teamId,
  points: score.points,
  reason: score.reason
})

export const fetchPublicLiveData = async (): Promise<LiveResponse> => {
  const { start, end } = getJstDayRange()

  const [matchRows, rankingRows, scoreRows] = await Promise.all([
    db
      .select()
      .from(matchPlans)
      .where(
        and(
          inArray(matchPlans.status, liveMatchStatuses),
          gte(matchPlans.scheduledStartTime, start),
          lt(matchPlans.scheduledStartTime, end)
        )
      )
      .orderBy(asc(matchPlans.scheduledStartTime), asc(matchPlans.id)),
    db
      .select()
      .from(blockRankings)
      .orderBy(asc(blockRankings.eventBlockId), asc(blockRankings.rank)),
    db
      .select()
      .from(scores)
      .orderBy(asc(scores.eventId), asc(scores.teamId))
  ])

  const matchIds = matchRows.map((match) => match.id)
  const participantRows = matchIds.length === 0
    ? []
    : await db
        .select()
        .from(matchParticipants)
        .where(inArray(matchParticipants.matchPlanId, matchIds))
        .orderBy(asc(matchParticipants.matchPlanId), asc(matchParticipants.id))

  const participantsByMatchId = new Map<
    number,
    LiveResponse['matches'][number]['participants']
  >()

  for (const participant of participantRows) {
    const participants = participantsByMatchId.get(participant.matchPlanId) ?? []
    participants.push(mapParticipant(participant))
    participantsByMatchId.set(participant.matchPlanId, participants)
  }

  return {
    matches: matchRows.map((match) =>
      mapMatch(match, participantsByMatchId.get(match.id) ?? [])
    ),
    blockRankings: rankingRows.map(mapBlockRanking),
    scores: scoreRows.map(mapScore)
  }
}
