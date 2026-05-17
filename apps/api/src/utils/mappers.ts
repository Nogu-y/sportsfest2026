import type {LiveResponse} from "../schemas/public/live";
import {
    blockRankings, eventBlocks,
    events,
    locations,
    maps,
    matchParticipants,
    matchPlans,
    scores,
    systemInfo,
    teams
} from "../db/schema";
import {toIsoString} from "./dates";
import type {PublicMasterResponse} from "../schemas/public/master";

export const mapParticipant = (
    participant: typeof matchParticipants.$inferSelect
): LiveResponse['matches'][number]['participants'][number]|
    PublicMasterResponse['matches'][number]['participants'][number]=> ({
    id: participant.id,
    teamId: participant.teamId,
    prereqMatchId: participant.prereqMatchId,
    prereqBlockId: participant.prereqBlockId,
    prereqRank: participant.prereqRank,
    score: participant.score,
    rank: participant.rank,
    isDisqualified: participant.isDisqualified
})

export const mapMatch = (
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

export const mapBlockRanking = (
    ranking: typeof blockRankings.$inferSelect
): LiveResponse['blockRankings'][number] => ({
    eventBlockId: ranking.eventBlockId,
    teamId: ranking.teamId,
    rank: ranking.rank,
    points: ranking.points,
    note: ranking.note
})

export const mapScore = (
    score: typeof scores.$inferSelect
): LiveResponse['scores'][number] => ({
    id: score.id,
    eventId: score.eventId,
    teamId: score.teamId,
    points: score.points,
    reason: score.reason
})


export const mapSystemInfo = (
    system: typeof systemInfo.$inferSelect
): PublicMasterResponse['systemInfo'] => ({
    day1: system.day1.toISOString(),
    day2: system.day2.toISOString(),
    masterVersion: system.masterVersion
})

export const mapMap = (
    m: typeof maps.$inferSelect
): PublicMasterResponse['maps'][number] => ({
    id: m.id,
    filePath: m.filePath,
    displayName: m.displayName,
    width: m.width,
    height: m.height
});

export const mapLocation = (
    l: typeof locations.$inferSelect
): PublicMasterResponse['locations'][number] => ({
    id: l.id,
    mapId: l.mapId,
    name: l.name,
    xRatio: l.xRatio,
    yRatio: l.yRatio
});

export const mapTeam = (
    t: typeof teams.$inferSelect
): PublicMasterResponse['teams'][number] => ({
    id: t.id,
    name: t.name,
});

export const mapEvent = (
    e: typeof events.$inferSelect
): PublicMasterResponse['events'][number] => ({
    id: e.id,
    name: e.name,
    description: e.description,
    color: e.color,
    ruleMd: e.ruleMd,
    rankingOrder: e.rankingOrder as 'ASC' | 'DESC',
    format: e.format as 'TOURNAMENT' | 'LEAGUE_TO_TOURNAMENT' | 'HEATS_AND_FINAL',
    pointAllocation: e.pointAllocation as any,
    isCompleted: e.isCompleted
});


export const mapEventBlocks = (
    block: typeof eventBlocks.$inferSelect,
    rankings: typeof blockRankings.$inferSelect[] = []
): PublicMasterResponse['blocks'][number] => ({
    id: block.id,
    eventId: block.eventId,
    name: block.name,
    type: block.type,
    stage: block.stage,
    rankings: rankings
        .filter((ranking) => ranking.eventBlockId === block.id)
        .map(mapBlockRanking)
})
