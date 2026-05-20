import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '../../db/client'
import type { PointAllocation } from '../../db/enums'
import {
  blockRankings,
  eventBlocks,
  events,
  matchParticipants,
  matchPlans,
  scores
} from '../../db/schema'
import type { FinalizeEventScoreResponse } from '../../schemas/staff/events'
import type { ResolveEventParticipantsResponse } from '../../schemas/staff/events'
import type { FinalizeBlockRankingsResponse } from '../../schemas/staff/events'

type FinalizeEventScoresError =
  | 'event_not_found'
  | 'incomplete_score_sources'
  | 'invalid_point_allocation'

type ResolveEventParticipantsError =
  | 'event_not_found'
  | 'incomplete_prerequisites'

type FinalizeBlockRankingsError =
  | 'event_not_found'
  | 'incomplete_match_results'

type ResolveEventParticipantsErrorResult = {
  error: ResolveEventParticipantsError
  detail?: {
    unresolvedParticipants: number
    missingFromBlocks: Array<{ blockId: number; rank: number }>
    missingFromMatches: Array<{ matchId: number; rank: number }>
  }
}

type FinalizeBlockRankingsErrorResult = {
  error: FinalizeBlockRankingsError
  detail?: {
    incompleteBlockIds: number[]
  }
}

type ScoreRecord = FinalizeEventScoreResponse['scores'][number]

// `reason` に使う stage 名は enum のままだと運用上読みづらいため、
// ここで日本語ラベルへ寄せておく
const stageLabelMap: Record<string, string> = {
  FINAL: '決勝',
  THIRD_PLACE: '3位決定戦',
  SEMIFINAL: '準決勝',
  QUARTERFINAL: '準々決勝',
  ROUND_2: '2回戦',
  ROUND_1: '1回戦',
  QUALIFIER: '予選',
  CONSOLATION: '敗者戦'
}

// PointAllocation は optional な入れ子構造なので、
// 未定義時でも安全にループできるように共通化する
const getRuleEntries = (rules: Partial<Record<string, Record<string, number>>> | undefined) => {
  return Object.entries(rules ?? {})
}

const getStageLabel = (stage: string) => stageLabelMap[stage] ?? stage

const parseRankKey = (value: string) => {
  const rank = Number(value)
  if (!Number.isInteger(rank) || rank < 1) return null
  return rank
}

// Score.reason は仕様上「競技名 + どの順位で加点されたか」が追える形にする
const createReason = (eventName: string, stage: string, rank: number) => {
  return `${eventName} ${getStageLabel(stage)}${rank}位`
}

// 同じ入力なら同じ順序で返るように並び順を固定しておく。
// teamId を主軸にしつつ、同一チームの複数加点も安定順にする。
const sortScores = (rows: ScoreRecord[]) => {
  return [...rows].sort((left, right) => {
    if (left.teamId !== right.teamId) {
      return left.teamId - right.teamId
    }

    if (left.points !== right.points) {
      return right.points - left.points
    }

    return (left.reason ?? '').localeCompare(right.reason ?? '', 'ja')
  })
}

// MATCH 配点は試合結果から直接加点する。
// 例: 決勝の 1 位に 30 点、2 位に 20 点、のような設定を
// matchParticipants.rank を使って score レコードへ変換する。
const buildMatchScores = ({
  eventId,
  eventName,
  pointAllocation,
  matches
}: {
  eventId: number
  eventName: string
  pointAllocation: PointAllocation
  matches: Array<{
    id: number
    stage: string
    status: string
    participants: Array<{
      teamId: number | null
      rank: number | null
    }>
  }>
}) => {
  const scoreRows: ScoreRecord[] = []

  // 配点定義にある stage ごとに対象試合を集めて処理する
  for (const [stage, rankPoints] of getRuleEntries(pointAllocation.MATCH)) {
    const stageMatches = matches.filter((match) => match.stage === stage)

    // ルールが存在するのに対象試合が 1 件も無い場合、
    // マスタ設定か入力データがまだ揃っていない
    if (stageMatches.length === 0) {
      return { error: 'incomplete_score_sources' as const }
    }

    for (const match of stageMatches) {
      // 最終得点は試合完了後にのみ確定できる。
      // 途中の Playing / Finished を許すと後で順位が変わり得るため弾く。
      if (match.status !== 'Completed') {
        return { error: 'incomplete_score_sources' as const }
      }

      // `rankPoints` は { "1": 30, "2": 20 } のような形なので、
      // キーを順位として participant を 1 件ずつ対応付ける
      for (const [rankKey, points] of Object.entries(rankPoints ?? {})) {
        const rank = parseRankKey(rankKey)
        if (rank === null || !Number.isFinite(points)) {
          return { error: 'invalid_point_allocation' as const }
        }
        const participant = match.participants.find(
          (item) => item.rank === rank && item.teamId !== null
        )

        // 配点対象順位の participant がいなければ、
        // 結果未入力または整合性崩れなので確定を止める
        if (!participant?.teamId) {
          return { error: 'incomplete_score_sources' as const }
        }

        scoreRows.push({
          eventId,
          teamId: participant.teamId,
          points,
          reason: createReason(eventName, stage, rank)
        })
      }
    }
  }

  return { scores: scoreRows }
}

// BLOCK 配点はブロック順位から加点する。
// 例: 予選ブロック 1 位に 3 点、2 位に 1 点、のような設定を
// blockRankings の確定順位から score レコードへ変換する。
const buildBlockScores = ({
  eventId,
  eventName,
  pointAllocation,
  rankingsByBlockId,
  blocks
}: {
  eventId: number
  eventName: string
  pointAllocation: PointAllocation
  rankingsByBlockId: Map<number, Array<{ teamId: number; rank: number }>>
  blocks: Array<{ id: number; stage: string }>
}) => {
  const scoreRows: ScoreRecord[] = []

  // 配点定義にある stage ごとに対象ブロックを集めて処理する
  for (const [stage, rankPoints] of getRuleEntries(pointAllocation.BLOCK)) {
    const stageBlocks = blocks.filter((block) => block.stage === stage)

    // ルールが存在するのに対象ブロックが無ければ、
    // この時点では最終得点を確定できない
    if (stageBlocks.length === 0) {
      return { error: 'incomplete_score_sources' as const }
    }

    for (const block of stageBlocks) {
      const rankings = rankingsByBlockId.get(block.id) ?? []

      // `rankPoints` は { "1": 3, "2": 1 } のような形。
      // blockRankings から該当順位を探して加点する。
      for (const [rankKey, points] of Object.entries(rankPoints ?? {})) {
        const rank = parseRankKey(rankKey)
        if (rank === null || !Number.isFinite(points)) {
          return { error: 'invalid_point_allocation' as const }
        }
        const ranking = rankings.find((item) => item.rank === rank)

        // 配点対象順位の blockRanking が無ければ、
        // まだ順位表が完成していないので確定不可
        if (!ranking) {
          return { error: 'incomplete_score_sources' as const }
        }

        scoreRows.push({
          eventId,
          teamId: ranking.teamId,
          points,
          reason: createReason(eventName, stage, rank)
        })
      }
    }
  }

  return { scores: scoreRows }
}

export const finalizeEventScores = async (eventId: number) => {
  // scores の再生成と event の完了更新は一体で扱いたい。
  // 途中で失敗した場合に片方だけ反映されないよう transaction に載せる。
  return db.transaction(async (tx) => {
    const [eventRow] = await tx
      .select({
        id: events.id,
        name: events.name,
        pointAllocation: events.pointAllocation
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventRow) {
      return { error: 'event_not_found' as FinalizeEventScoresError }
    }

    // まず競技配下のブロック一覧を取得する。
    // 以降の試合取得・ブロック順位取得はこの blockIds を起点に行う。
    const blocks = await tx
      .select({
        id: eventBlocks.id,
        stage: eventBlocks.stage
      })
      .from(eventBlocks)
      .where(eq(eventBlocks.eventId, eventId))
      .orderBy(asc(eventBlocks.id))

    const blockIds = blocks.map((block) => block.id)

    // 競技に紐づく試合一覧を取得する。
    // MATCH 配点では stage と status が必要なのでそこを読む。
    const matchRows = blockIds.length === 0
      ? []
      : await tx
          .select({
            id: matchPlans.id,
            stage: matchPlans.stage,
            status: matchPlans.status
          })
          .from(matchPlans)
          .where(inArray(matchPlans.eventBlockId, blockIds))
          .orderBy(asc(matchPlans.id))

    const matchIds = matchRows.map((match) => match.id)

    // MATCH 配点に必要な participant の teamId / rank を取得する。
    // ここでは score 自体ではなく「最終順位」が重要。
    const participantRows = matchIds.length === 0
      ? []
      : await tx
          .select({
            matchPlanId: matchParticipants.matchPlanId,
            teamId: matchParticipants.teamId,
            rank: matchParticipants.rank
          })
          .from(matchParticipants)
          .where(inArray(matchParticipants.matchPlanId, matchIds))
          .orderBy(asc(matchParticipants.matchPlanId), asc(matchParticipants.id))

    // BLOCK 配点用に、ブロックごとの確定順位を取得する
    const rankingRows = blockIds.length === 0
      ? []
      : await tx
          .select({
            eventBlockId: blockRankings.eventBlockId,
            teamId: blockRankings.teamId,
            rank: blockRankings.rank
          })
          .from(blockRankings)
          .where(inArray(blockRankings.eventBlockId, blockIds))
          .orderBy(asc(blockRankings.eventBlockId), asc(blockRankings.rank))

    // matchPlanId -> participants[] の形へ詰め替えて、
    // 後続で試合ごとの順位参照をしやすくする
    const participantsByMatchId = new Map<
      number,
      Array<{ teamId: number | null; rank: number | null }>
    >()

    for (const participant of participantRows) {
      const participants = participantsByMatchId.get(participant.matchPlanId) ?? []
      participants.push({
        teamId: participant.teamId,
        rank: participant.rank
      })
      participantsByMatchId.set(participant.matchPlanId, participants)
    }

    // blockId -> rankings[] に詰め替えて、
    // stage ごとのブロック配点処理で参照しやすくする
    const rankingsByBlockId = new Map<number, Array<{ teamId: number; rank: number }>>()

    for (const ranking of rankingRows) {
      const rankings = rankingsByBlockId.get(ranking.eventBlockId) ?? []
      rankings.push({
        teamId: ranking.teamId,
        rank: ranking.rank
      })
      rankingsByBlockId.set(ranking.eventBlockId, rankings)
    }

    // DB 上は not null だが、型上は防御的に fallback を入れておく
    const pointAllocation = eventRow.pointAllocation ?? {}

    // MATCH 配点と BLOCK 配点を別々に計算する。
    // どちらか一方でも前提データが欠けていれば確定処理全体を失敗させる。
    const matchScoreResult = buildMatchScores({
      eventId,
      eventName: eventRow.name,
      pointAllocation,
      matches: matchRows.map((match) => ({
        ...match,
        participants: participantsByMatchId.get(match.id) ?? []
      }))
    })

    if ('error' in matchScoreResult) {
      return { error: matchScoreResult.error as FinalizeEventScoresError }
    }

    const blockScoreResult = buildBlockScores({
      eventId,
      eventName: eventRow.name,
      pointAllocation,
      rankingsByBlockId,
      blocks
    })

    if ('error' in blockScoreResult) {
      return { error: blockScoreResult.error as FinalizeEventScoresError }
    }

    // 当該競技の score は「差分更新」ではなく「再生成」で揃える。
    // 既存レコードを残したままにすると、配点変更や再確定時に古い加点が混ざる。
    const scoreRows = sortScores([
      ...matchScoreResult.scores,
      ...blockScoreResult.scores
    ])

    await tx.delete(scores).where(eq(scores.eventId, eventId))

    if (scoreRows.length > 0) {
      await tx.insert(scores).values(scoreRows)
    }

    // score の確定まで完了した時点で、その競技を完了扱いに更新する
    await tx
      .update(events)
      .set({
        isCompleted: true
      })
      .where(eq(events.id, eventId))

    return {
      eventId,
      isCompleted: true,
      scores: scoreRows
    } satisfies FinalizeEventScoreResponse
  })
}

export const resolveEventParticipants = async (eventId: number) => {
  return db.transaction(async (tx) => {
    const [eventRow] = await tx
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventRow) {
      return { error: 'event_not_found' as ResolveEventParticipantsError } satisfies ResolveEventParticipantsErrorResult
    }

    const blocks = await tx
      .select({ id: eventBlocks.id })
      .from(eventBlocks)
      .where(eq(eventBlocks.eventId, eventId))

    const blockIds = blocks.map((block) => block.id)
    if (blockIds.length === 0) {
      return {
        eventId,
        updatedParticipants: 0,
        updatedMatches: 0,
        unresolvedParticipants: 0
      } satisfies ResolveEventParticipantsResponse
    }

    const matches = await tx
      .select({
        id: matchPlans.id,
        status: matchPlans.status
      })
      .from(matchPlans)
      .where(inArray(matchPlans.eventBlockId, blockIds))

    const matchIds = matches.map((match) => match.id)
    if (matchIds.length === 0) {
      return {
        eventId,
        updatedParticipants: 0,
        updatedMatches: 0,
        unresolvedParticipants: 0
      } satisfies ResolveEventParticipantsResponse
    }

    const participants = await tx
      .select({
        id: matchParticipants.id,
        matchPlanId: matchParticipants.matchPlanId,
        teamId: matchParticipants.teamId,
        prereqMatchId: matchParticipants.prereqMatchId,
        prereqBlockId: matchParticipants.prereqBlockId,
        prereqRank: matchParticipants.prereqRank
      })
      .from(matchParticipants)
      .where(inArray(matchParticipants.matchPlanId, matchIds))

    const prereqMatchIds = [...new Set(
      participants
        .map((participant) => participant.prereqMatchId)
        .filter((id): id is number => id !== null)
    )]

    const prereqParticipantRows = prereqMatchIds.length === 0
      ? []
      : await tx
          .select({
            matchPlanId: matchParticipants.matchPlanId,
            teamId: matchParticipants.teamId,
            rank: matchParticipants.rank
          })
          .from(matchParticipants)
          .where(inArray(matchParticipants.matchPlanId, prereqMatchIds))

    const rankingRows = await tx
      .select({
        eventBlockId: blockRankings.eventBlockId,
        teamId: blockRankings.teamId,
        rank: blockRankings.rank
      })
      .from(blockRankings)
      .where(inArray(blockRankings.eventBlockId, blockIds))

    const teamByBlockRank = new Map<string, number>()
    for (const ranking of rankingRows) {
      teamByBlockRank.set(`${ranking.eventBlockId}:${ranking.rank}`, ranking.teamId)
    }

    const teamByMatchRank = new Map<string, number>()
    for (const participant of prereqParticipantRows) {
      if (participant.teamId === null || participant.rank === null) continue
      teamByMatchRank.set(`${participant.matchPlanId}:${participant.rank}`, participant.teamId)
    }

    const updates: Array<{
      id: number
      matchPlanId: number
      teamId: number
      prereqMatchId: null
      prereqBlockId: null
      prereqRank: null
    }> = []

    let unresolvedParticipants = 0
    const missingFromBlocksMap = new Map<string, { blockId: number; rank: number }>()
    const missingFromMatchesMap = new Map<string, { matchId: number; rank: number }>()
    const nextParticipantsByMatch = new Map<number, Array<{
      id: number
      teamId: number | null
      prereqMatchId: number | null
      prereqBlockId: number | null
      prereqRank: number | null
    }>>()

    for (const participant of participants) {
      const rank = participant.prereqRank ?? 1
      let resolvedTeamId: number | null = participant.teamId

      if (participant.prereqBlockId !== null) {
        resolvedTeamId = teamByBlockRank.get(`${participant.prereqBlockId}:${rank}`) ?? null
        if (resolvedTeamId === null) {
          missingFromBlocksMap.set(
            `${participant.prereqBlockId}:${rank}`,
            { blockId: participant.prereqBlockId, rank },
          )
        }
      } else if (participant.prereqMatchId !== null) {
        resolvedTeamId = teamByMatchRank.get(`${participant.prereqMatchId}:${rank}`) ?? null
        if (resolvedTeamId === null) {
          missingFromMatchesMap.set(
            `${participant.prereqMatchId}:${rank}`,
            { matchId: participant.prereqMatchId, rank },
          )
        }
      }

      const isDependencyParticipant =
        participant.prereqBlockId !== null || participant.prereqMatchId !== null

      if (isDependencyParticipant && resolvedTeamId === null) {
        unresolvedParticipants += 1
      }

      const nextParticipant = {
        id: participant.id,
        teamId: resolvedTeamId,
        prereqMatchId: participant.prereqMatchId,
        prereqBlockId: participant.prereqBlockId,
        prereqRank: participant.prereqRank
      }

      if (resolvedTeamId !== null && isDependencyParticipant) {
        updates.push({
          id: participant.id,
          matchPlanId: participant.matchPlanId,
          teamId: resolvedTeamId,
          prereqMatchId: null,
          prereqBlockId: null,
          prereqRank: null
        })

        nextParticipant.prereqMatchId = null
        nextParticipant.prereqBlockId = null
        nextParticipant.prereqRank = null
      }

      const rows = nextParticipantsByMatch.get(participant.matchPlanId) ?? []
      rows.push(nextParticipant)
      nextParticipantsByMatch.set(participant.matchPlanId, rows)
    }

    for (const item of updates) {
      await tx
        .update(matchParticipants)
        .set({
          teamId: item.teamId,
          prereqMatchId: item.prereqMatchId,
          prereqBlockId: item.prereqBlockId,
          prereqRank: item.prereqRank
        })
        .where(eq(matchParticipants.id, item.id))
    }

    const toPreparingMatchIds = matches
      .filter((match) => match.status === 'Waiting')
      .map((match) => {
        const rows = nextParticipantsByMatch.get(match.id) ?? []
        const isReady = rows.length > 0 && rows.every((participant) =>
          participant.teamId !== null &&
          participant.prereqMatchId === null &&
          participant.prereqBlockId === null &&
          participant.prereqRank === null
        )
        return isReady ? match.id : null
      })
      .filter((matchId): matchId is number => matchId !== null)

    if (toPreparingMatchIds.length > 0) {
      await tx
        .update(matchPlans)
        .set({ status: 'Preparing' })
        .where(
          and(
            inArray(matchPlans.id, toPreparingMatchIds),
            eq(matchPlans.status, 'Waiting')
          )
        )
    }

    if (updates.length === 0 && unresolvedParticipants > 0) {
      return {
        error: 'incomplete_prerequisites' as ResolveEventParticipantsError,
        detail: {
          unresolvedParticipants,
          missingFromBlocks: [...missingFromBlocksMap.values()],
          missingFromMatches: [...missingFromMatchesMap.values()]
        }
      } satisfies ResolveEventParticipantsErrorResult
    }

    return {
      eventId,
      updatedParticipants: updates.length,
      updatedMatches: toPreparingMatchIds.length,
      unresolvedParticipants
    } satisfies ResolveEventParticipantsResponse
  })
}

export const finalizeEventBlockRankings = async (eventId: number) => {
  return db.transaction(async (tx) => {
    const [eventRow] = await tx
      .select({
        id: events.id,
        rankingOrder: events.rankingOrder
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventRow) {
      return { error: 'event_not_found' as FinalizeBlockRankingsError } satisfies FinalizeBlockRankingsErrorResult
    }

    const blocks = await tx
      .select({
        id: eventBlocks.id,
        type: eventBlocks.type
      })
      .from(eventBlocks)
      .where(eq(eventBlocks.eventId, eventId))
      .orderBy(asc(eventBlocks.id))

    const leagueBlockIds = blocks
      .filter((block) => block.type === 'LEAGUE')
      .map((block) => block.id)

    if (leagueBlockIds.length === 0) {
      return {
        eventId,
        processedBlocks: 0,
        rankings: []
      } satisfies FinalizeBlockRankingsResponse
    }

    const matches = await tx
      .select({
        id: matchPlans.id,
        eventBlockId: matchPlans.eventBlockId,
        status: matchPlans.status
      })
      .from(matchPlans)
      .where(inArray(matchPlans.eventBlockId, leagueBlockIds))
      .orderBy(asc(matchPlans.id))

    const matchIds = matches.map((match) => match.id)
    const participants = matchIds.length === 0
      ? []
      : await tx
          .select({
            matchPlanId: matchParticipants.matchPlanId,
            teamId: matchParticipants.teamId,
            rank: matchParticipants.rank,
            score: matchParticipants.score
          })
          .from(matchParticipants)
          .where(inArray(matchParticipants.matchPlanId, matchIds))
          .orderBy(asc(matchParticipants.matchPlanId), asc(matchParticipants.id))

    const participantsByMatchId = new Map<number, Array<{
      teamId: number | null
      rank: number | null
      score: number | null
    }>>()

    for (const participant of participants) {
      const rows = participantsByMatchId.get(participant.matchPlanId) ?? []
      rows.push({
        teamId: participant.teamId,
        rank: participant.rank,
        score: participant.score
      })
      participantsByMatchId.set(participant.matchPlanId, rows)
    }

    const incompleteBlockIdSet = new Set<number>()

    const blockStatsMap = new Map<number, Map<number, {
      teamId: number
      firstPlaceCount: number
      rankSum: number
      scoreTotal: number
      matchesPlayed: number
    }>>()

    for (const match of matches) {
      const rows = participantsByMatchId.get(match.id) ?? []
      const isComplete = match.status === 'Completed' &&
        rows.length > 0 &&
        rows.every((participant) => participant.teamId !== null && participant.rank !== null)

      if (!isComplete) {
        incompleteBlockIdSet.add(match.eventBlockId)
        continue
      }

      const statsByTeam = blockStatsMap.get(match.eventBlockId) ?? new Map<number, {
        teamId: number
        firstPlaceCount: number
        rankSum: number
        scoreTotal: number
        matchesPlayed: number
      }>()

      for (const row of rows) {
        const teamId = row.teamId as number
        const rank = row.rank as number

        const current = statsByTeam.get(teamId) ?? {
          teamId,
          firstPlaceCount: 0,
          rankSum: 0,
          scoreTotal: 0,
          matchesPlayed: 0
        }

        current.firstPlaceCount += rank === 1 ? 1 : 0
        current.rankSum += rank
        current.scoreTotal += row.score ?? 0
        current.matchesPlayed += 1

        statsByTeam.set(teamId, current)
      }

      blockStatsMap.set(match.eventBlockId, statsByTeam)
    }

    const incompleteBlockIds = [...incompleteBlockIdSet].sort((a, b) => a - b)
    if (incompleteBlockIds.length > 0) {
      return {
        error: 'incomplete_match_results' as FinalizeBlockRankingsError,
        detail: { incompleteBlockIds }
      } satisfies FinalizeBlockRankingsErrorResult
    }

    const rankingRows: FinalizeBlockRankingsResponse['rankings'] = []

    for (const blockId of leagueBlockIds) {
      const statsByTeam = blockStatsMap.get(blockId) ?? new Map()
      const sortedRows = [...statsByTeam.values()].sort((left, right) => {
        if (left.firstPlaceCount !== right.firstPlaceCount) {
          return right.firstPlaceCount - left.firstPlaceCount
        }

        if (left.rankSum !== right.rankSum) {
          return left.rankSum - right.rankSum
        }

        if (left.scoreTotal !== right.scoreTotal) {
          return eventRow.rankingOrder === 'ASC'
            ? left.scoreTotal - right.scoreTotal
            : right.scoreTotal - left.scoreTotal
        }

        return left.teamId - right.teamId
      })

      sortedRows.forEach((row, index) => {
        rankingRows.push({
          eventBlockId: blockId,
          teamId: row.teamId,
          rank: index + 1,
          points: 0,
          note: null
        })
      })
    }

    await tx.delete(blockRankings).where(inArray(blockRankings.eventBlockId, leagueBlockIds))

    if (rankingRows.length > 0) {
      await tx.insert(blockRankings).values(rankingRows)
    }

    return {
      eventId,
      processedBlocks: leagueBlockIds.length,
      rankings: rankingRows
    } satisfies FinalizeBlockRankingsResponse
  })
}
