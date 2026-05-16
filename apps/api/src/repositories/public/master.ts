import {
    blockRankings,
    eventBlocks,
    events,
    locations,
    maps,
    matchParticipants,
    matchPlans,
    scores,
    systemInfo,
    teams
} from '../../db/schema'
import {db} from '../../db/client'
import {asc, inArray} from "drizzle-orm"
import type {LiveResponse} from "../../schemas/public/live"
import type {PublicMasterResponse} from "../../schemas/public/master"
import {
    mapBlockRanking,
    mapEvent,
    mapLocation,
    mapMap,
    mapMatch,
    mapParticipant,
    mapScore,
    mapSystemInfo,
    mapTeam
} from "../../utils/mappers"

/**
 * 一般公開向けのマスタデータを全テーブルから並列取得し, 型安全なレスポンス形式にマッピングして返却する.
 */
export async function getMasterData(): Promise<PublicMasterResponse> {

    const [
        systemInfoRows,
        mapRows,
        locationRows,
        teamRows,
        eventRows,
        blockRows, // 将来的に拡張･利用する際のために保持
        matchRows,
        rankingRows,
        scoreRows
    ] = await Promise.all([
        db.select().from(systemInfo),
        db.select().from(maps),
        db.select().from(locations),
        db.select().from(teams),
        db.select().from(events),
        db.select().from(eventBlocks),
        db.select().from(matchPlans),
        db.select().from(blockRankings),
        db.select().from(scores)
    ])

    // systemInfoのレコード存在チェック
    const currentSystemInfo = systemInfoRows[0]
    if (!currentSystemInfo) {
        throw new Error("SystemInfoのレコードがありません.")
    }

    // 取得した全試合のIDから, 各試合に紐づく参加枠(participants)を一括取得（N+1問題の防止）
    const matchIds = matchRows.map((match) => match.id)
    const participantRows = matchIds.length === 0
        ? []
        : await db
            .select()
            .from(matchParticipants)
            .where(inArray(matchParticipants.matchPlanId, matchIds))
            .orderBy(asc(matchParticipants.matchPlanId), asc(matchParticipants.id))

    // マッピング効率化のため, matchPlanId をキーとしたハッシュマップに詰め替え
    const participantsByMatchId = new Map<
        number,
        LiveResponse['matches'][number]['participants']
    >()

    for (const participant of participantRows) {
        const participants = participantsByMatchId.get(participant.matchPlanId) ?? []
        participants.push(mapParticipant(participant))
        participantsByMatchId.set(participant.matchPlanId, participants)
    }

    // 前回修正した MasterResSchema の構造に逐一適合させて返却
    return {
        systemInfo: mapSystemInfo(currentSystemInfo),
        matches: matchRows.map((match) =>
            mapMatch(match, participantsByMatchId.get(match.id) ?? [])
        ),
        blockRankings: rankingRows.map(mapBlockRanking),
        scores: scoreRows.map(mapScore),
        // 不足していた静的マスタの配列マッピングを適用
        maps: mapRows.map(mapMap),
        locations: locationRows.map(mapLocation),
        teams: teamRows.map(mapTeam),
        events: eventRows.map(mapEvent)
    }
}