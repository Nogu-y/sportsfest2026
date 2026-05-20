import {and, asc, gte, inArray, lt} from 'drizzle-orm'
import {db} from '../../db/client'
import {blockRankings, matchParticipants, matchPlans, scores} from '../../db/schema'
import type {LiveResponse} from '../../schemas/public/live'
import {mapBlockRanking, mapMatch, mapParticipant, mapScore} from "../../utils/mappers";

const liveMatchStatuses = ['Preparing', 'Playing', 'Finished', 'Completed', 'Cancelled'] as const

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

    return {start, end}
}

export const fetchPublicLiveData = async (): Promise<LiveResponse> => {
    const {start, end} = getJstDayRange()

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
