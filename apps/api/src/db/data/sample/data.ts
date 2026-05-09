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
  teams,
  userSubscriptions,
  watchlists,
} from "../../schema"
import type { PointAllocation } from "../../enums"

type SystemInfoInsert = typeof systemInfo.$inferInsert
type TeamInsert = typeof teams.$inferInsert
type MapInsert = typeof maps.$inferInsert
type LocationInsert = typeof locations.$inferInsert
type EventInsert = typeof events.$inferInsert
type EventBlockInsert = typeof eventBlocks.$inferInsert
type MatchPlanInsert = typeof matchPlans.$inferInsert
type MatchParticipantInsert = typeof matchParticipants.$inferInsert
type BlockRankingInsert = typeof blockRankings.$inferInsert
type ScoreInsert = typeof scores.$inferInsert
type UserSubscriptionInsert = typeof userSubscriptions.$inferInsert
type WatchlistInsert = typeof watchlists.$inferInsert

const at = (value: string) => new Date(value)
const points = (value: PointAllocation) => value

const ruleMd = {
  basketball: `# バスケットボール

- 4クォーター制で実施
- 同点時は延長戦で決着
- 勝者が次戦へ進出
`,
  volleyball: `# バレーボール

- 予選はリーグ戦で実施
- セットカウントで順位を決定
- 各ブロック上位2チームが決勝トーナメントへ進出
`,
  relay: `# 学年別リレー

- 予選はタイム順で順位を決定
- 上位4チームが決勝へ進出
- タイムが短いチームを上位とする
`,
} as const

export const sampleData = {
  systemInfo: [
    {
      id: 1,
      day1: at("2026-09-10T08:30:00+09:00"),
      day2: at("2026-09-11T08:30:00+09:00"),
      masterVersion: "sample-master-2026-05-07",
    },
  ] satisfies SystemInfoInsert[],

  teams: [
    { id: 1, name: "1-1" },
    { id: 2, name: "1-2" },
    { id: 3, name: "2-1" },
    { id: 4, name: "2-2" },
    { id: 5, name: "3-1" },
    { id: 6, name: "3-2" },
    { id: 7, name: "4J" },
    { id: 8, name: "5J" },
  ] satisfies TeamInsert[],

  maps: [
    {
      id: 1,
      filePath: "/maps/campus-ground.png",
      displayName: "校庭・テニスコート",
      width: 1600,
      height: 900,
    },
    {
      id: 2,
      filePath: "/maps/gymnasium.png",
      displayName: "第一体育館",
      width: 1200,
      height: 800,
    },
  ] satisfies MapInsert[],

  locations: [
    { id: 1, mapId: 1, name: "グラウンドA", xRatio: 28, yRatio: 44 },
    { id: 2, mapId: 1, name: "グラウンドB", xRatio: 45, yRatio: 44 },
    { id: 3, mapId: 1, name: "テニスコートA", xRatio: 70, yRatio: 30 },
    { id: 4, mapId: 1, name: "テニスコートB", xRatio: 82, yRatio: 30 },
    { id: 5, mapId: 2, name: "第一体育館Aコート", xRatio: 32, yRatio: 46 },
    { id: 6, mapId: 2, name: "第一体育館Bコート", xRatio: 68, yRatio: 46 },
    { id: 7, mapId: 2, name: "第一体育館ステージ側", xRatio: 20, yRatio: 16 },
  ] satisfies LocationInsert[],

  events: [
    {
      id: 1,
      name: "バスケットボール",
      description: "8チームによる決勝トーナメント",
      color: "#D9480F",
      ruleMd: ruleMd.basketball,
      rankingOrder: "DESC",
      format: "TOURNAMENT",
      pointAllocation: points({
        MATCH: {
          FINAL: { "1": 30, "2": 20 },
          THIRD_PLACE: { "1": 15, "2": 10 },
        },
      }),
      isCompleted: true,
    },
    {
      id: 2,
      name: "バレーボール",
      description: "予選リーグ後に決勝トーナメントを行う",
      color: "#2B8A3E",
      ruleMd: ruleMd.volleyball,
      rankingOrder: "DESC",
      format: "LEAGUE_TO_TOURNAMENT",
      pointAllocation: points({
        BLOCK: {
          QUALIFIER: { "1": 3, "2": 1, "3": 0 },
        },
        MATCH: {
          FINAL: { "1": 25, "2": 18 },
          THIRD_PLACE: { "1": 12, "2": 8 },
        },
      }),
      isCompleted: false,
    },
    {
      id: 3,
      name: "学年別リレー",
      description: "予選タイム順で決勝進出チームを決定",
      color: "#1864AB",
      ruleMd: ruleMd.relay,
      rankingOrder: "ASC",
      format: "HEATS_AND_FINAL",
      pointAllocation: points({
        MATCH: {
          FINAL: { "1": 25, "2": 20, "3": 15, "4": 10 },
        },
      }),
      isCompleted: false,
    },
  ] satisfies EventInsert[],

  eventBlocks: [
    { id: 1, eventId: 1, name: "決勝トーナメント", type: "TOURNAMENT", stage: "FINAL" },
    { id: 2, eventId: 2, name: "Aブロック予選", type: "LEAGUE", stage: "QUALIFIER" },
    { id: 3, eventId: 2, name: "Bブロック予選", type: "LEAGUE", stage: "QUALIFIER" },
    { id: 4, eventId: 2, name: "決勝トーナメント", type: "TOURNAMENT", stage: "FINAL" },
    { id: 5, eventId: 3, name: "予選タイムレース", type: "CUMULATIVE", stage: "QUALIFIER" },
    { id: 6, eventId: 3, name: "決勝", type: "SINGLE", stage: "FINAL" },
  ] satisfies EventBlockInsert[],

  matchPlans: [
    {
      id: 1,
      eventBlockId: 1,
      locationId: 5,
      name: "B-1",
      description: "準決勝 第1試合",
      stage: "SEMIFINAL",
      status: "Completed",
      scheduledStartTime: at("2026-09-10T09:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T09:40:00+09:00"),
      startedAt: at("2026-09-10T09:03:00+09:00"),
      endedAt: at("2026-09-10T09:42:00+09:00"),
    },
    {
      id: 2,
      eventBlockId: 1,
      locationId: 6,
      name: "B-2",
      description: "準決勝 第2試合",
      stage: "SEMIFINAL",
      status: "Completed",
      scheduledStartTime: at("2026-09-10T09:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T09:40:00+09:00"),
      startedAt: at("2026-09-10T09:01:00+09:00"),
      endedAt: at("2026-09-10T09:39:00+09:00"),
    },
    {
      id: 3,
      eventBlockId: 1,
      locationId: 6,
      name: "B-3",
      description: "3位決定戦",
      stage: "THIRD_PLACE",
      status: "Completed",
      scheduledStartTime: at("2026-09-10T11:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T11:40:00+09:00"),
      startedAt: at("2026-09-10T11:04:00+09:00"),
      endedAt: at("2026-09-10T11:43:00+09:00"),
      note: "接戦のため終了が少し延長",
    },
    {
      id: 4,
      eventBlockId: 1,
      locationId: 5,
      name: "B-4",
      description: "決勝戦",
      stage: "FINAL",
      status: "Completed",
      scheduledStartTime: at("2026-09-10T11:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T11:40:00+09:00"),
      startedAt: at("2026-09-10T11:02:00+09:00"),
      endedAt: at("2026-09-10T11:41:00+09:00"),
    },
    {
      id: 5,
      eventBlockId: 2,
      locationId: 3,
      name: "V-A1",
      description: "Aブロック第1試合",
      stage: "QUALIFIER",
      status: "Completed",
      scheduledStartTime: at("2026-09-10T09:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T09:30:00+09:00"),
      startedAt: at("2026-09-10T09:00:00+09:00"),
      endedAt: at("2026-09-10T09:24:00+09:00"),
    },
    {
      id: 6,
      eventBlockId: 2,
      locationId: 3,
      name: "V-A2",
      description: "Aブロック第2試合",
      stage: "QUALIFIER",
      status: "Completed",
      scheduledStartTime: at("2026-09-10T10:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T10:30:00+09:00"),
      startedAt: at("2026-09-10T10:02:00+09:00"),
      endedAt: at("2026-09-10T10:31:00+09:00"),
    },
    {
      id: 7,
      eventBlockId: 2,
      locationId: 3,
      name: "V-A3",
      description: "Aブロック第3試合",
      stage: "QUALIFIER",
      status: "Completed",
      scheduledStartTime: at("2026-09-10T11:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T11:30:00+09:00"),
      startedAt: at("2026-09-10T11:01:00+09:00"),
      endedAt: at("2026-09-10T11:27:00+09:00"),
    },
    {
      id: 8,
      eventBlockId: 3,
      locationId: 4,
      name: "V-B1",
      description: "Bブロック第1試合",
      stage: "QUALIFIER",
      status: "Completed",
      scheduledStartTime: at("2026-09-10T09:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T09:30:00+09:00"),
      startedAt: at("2026-09-10T09:05:00+09:00"),
      endedAt: at("2026-09-10T09:33:00+09:00"),
    },
    {
      id: 9,
      eventBlockId: 3,
      locationId: 4,
      name: "V-B2",
      description: "Bブロック第2試合",
      stage: "QUALIFIER",
      status: "Playing",
      scheduledStartTime: at("2026-09-10T10:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T10:30:00+09:00"),
      startedAt: at("2026-09-10T10:07:00+09:00"),
      note: "第2セット進行中",
    },
    {
      id: 10,
      eventBlockId: 3,
      locationId: 4,
      name: "V-B3",
      description: "Bブロック第3試合",
      stage: "QUALIFIER",
      status: "Waiting",
      scheduledStartTime: at("2026-09-10T11:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T11:30:00+09:00"),
    },
    {
      id: 11,
      eventBlockId: 4,
      locationId: 3,
      name: "V-SF1",
      description: "準決勝 第1試合",
      stage: "SEMIFINAL",
      status: "Waiting",
      scheduledStartTime: at("2026-09-10T13:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T13:30:00+09:00"),
    },
    {
      id: 12,
      eventBlockId: 4,
      locationId: 4,
      name: "V-SF2",
      description: "準決勝 第2試合",
      stage: "SEMIFINAL",
      status: "Waiting",
      scheduledStartTime: at("2026-09-10T13:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T13:30:00+09:00"),
    },
    {
      id: 13,
      eventBlockId: 4,
      locationId: 4,
      name: "V-3rd",
      description: "3位決定戦",
      stage: "THIRD_PLACE",
      status: "Waiting",
      scheduledStartTime: at("2026-09-10T15:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T15:30:00+09:00"),
    },
    {
      id: 14,
      eventBlockId: 4,
      locationId: 3,
      name: "V-Final",
      description: "決勝戦",
      stage: "FINAL",
      status: "Waiting",
      scheduledStartTime: at("2026-09-10T15:00:00+09:00"),
      scheduledEndTime: at("2026-09-10T15:30:00+09:00"),
    },
    {
      id: 15,
      eventBlockId: 5,
      locationId: 1,
      name: "R-H1",
      description: "予選第1組",
      stage: "QUALIFIER",
      status: "Completed",
      scheduledStartTime: at("2026-09-11T09:00:00+09:00"),
      scheduledEndTime: at("2026-09-11T09:10:00+09:00"),
      startedAt: at("2026-09-11T09:00:00+09:00"),
      endedAt: at("2026-09-11T09:08:00+09:00"),
    },
    {
      id: 16,
      eventBlockId: 5,
      locationId: 1,
      name: "R-H2",
      description: "予選第2組",
      stage: "QUALIFIER",
      status: "Completed",
      scheduledStartTime: at("2026-09-11T09:15:00+09:00"),
      scheduledEndTime: at("2026-09-11T09:25:00+09:00"),
      startedAt: at("2026-09-11T09:16:00+09:00"),
      endedAt: at("2026-09-11T09:24:00+09:00"),
    },
    {
      id: 17,
      eventBlockId: 5,
      locationId: 2,
      name: "R-H3",
      description: "予選第3組",
      stage: "QUALIFIER",
      status: "Completed",
      scheduledStartTime: at("2026-09-11T09:30:00+09:00"),
      scheduledEndTime: at("2026-09-11T09:40:00+09:00"),
      startedAt: at("2026-09-11T09:32:00+09:00"),
      endedAt: at("2026-09-11T09:39:00+09:00"),
    },
    {
      id: 18,
      eventBlockId: 6,
      locationId: 1,
      name: "R-Final",
      description: "決勝",
      stage: "FINAL",
      status: "Preparing",
      scheduledStartTime: at("2026-09-11T11:00:00+09:00"),
      scheduledEndTime: at("2026-09-11T11:10:00+09:00"),
      note: "招集中",
    },
  ] satisfies MatchPlanInsert[],

  matchParticipants: [
    { id: 1, matchPlanId: 1, teamId: 1, score: 58, rank: 1 },
    { id: 2, matchPlanId: 1, teamId: 4, score: 47, rank: 2 },
    { id: 3, matchPlanId: 2, teamId: 2, score: 61, rank: 2 },
    { id: 4, matchPlanId: 2, teamId: 3, score: 63, rank: 1 },
    { id: 5, matchPlanId: 3, teamId: 4, score: 49, rank: 2 },
    { id: 6, matchPlanId: 3, teamId: 2, score: 51, rank: 1 },
    { id: 7, matchPlanId: 4, teamId: 1, score: 66, rank: 1 },
    { id: 8, matchPlanId: 4, teamId: 3, score: 62, rank: 2 },

    { id: 9, matchPlanId: 5, teamId: 1, score: 2, rank: 1 },
    { id: 10, matchPlanId: 5, teamId: 2, score: 0, rank: 2 },
    { id: 11, matchPlanId: 6, teamId: 2, score: 1, rank: 2 },
    { id: 12, matchPlanId: 6, teamId: 3, score: 2, rank: 1 },
    { id: 13, matchPlanId: 7, teamId: 3, score: 0, rank: 2 },
    { id: 14, matchPlanId: 7, teamId: 1, score: 2, rank: 1 },
    { id: 15, matchPlanId: 8, teamId: 4, score: 2, rank: 1 },
    { id: 16, matchPlanId: 8, teamId: 5, score: 1, rank: 2 },
    { id: 17, matchPlanId: 9, teamId: 5 },
    { id: 18, matchPlanId: 9, teamId: 6 },
    { id: 19, matchPlanId: 10, teamId: 6 },
    { id: 20, matchPlanId: 10, teamId: 4 },
    { id: 21, matchPlanId: 11, teamId: 1, prereqBlockId: 2, prereqRank: 1 },
    { id: 22, matchPlanId: 11, prereqBlockId: 3, prereqRank: 2 },
    { id: 23, matchPlanId: 12, prereqBlockId: 3, prereqRank: 1 },
    { id: 24, matchPlanId: 12, teamId: 3, prereqBlockId: 2, prereqRank: 2 },
    { id: 25, matchPlanId: 13, prereqMatchId: 11, prereqRank: 2 },
    { id: 26, matchPlanId: 13, prereqMatchId: 12, prereqRank: 2 },
    { id: 27, matchPlanId: 14, prereqMatchId: 11, prereqRank: 1 },
    { id: 28, matchPlanId: 14, prereqMatchId: 12, prereqRank: 1 },

    { id: 29, matchPlanId: 15, teamId: 1, score: 6230, rank: 1 },
    { id: 30, matchPlanId: 15, teamId: 4, score: 6410, rank: 2 },
    { id: 31, matchPlanId: 15, teamId: 7, score: 6500, rank: 3 },
    { id: 32, matchPlanId: 16, teamId: 2, score: 6180, rank: 1 },
    { id: 33, matchPlanId: 16, teamId: 5, score: 6320, rank: 2 },
    { id: 34, matchPlanId: 16, teamId: 8, score: 6600, rank: 3 },
    { id: 35, matchPlanId: 17, teamId: 3, score: 6200, rank: 1 },
    { id: 36, matchPlanId: 17, teamId: 6, score: 6440, rank: 2 },
    { id: 37, matchPlanId: 18, teamId: 2, prereqBlockId: 5, prereqRank: 1 },
    { id: 38, matchPlanId: 18, teamId: 3, prereqBlockId: 5, prereqRank: 2 },
    { id: 39, matchPlanId: 18, teamId: 1, prereqBlockId: 5, prereqRank: 3 },
    { id: 40, matchPlanId: 18, teamId: 5, prereqBlockId: 5, prereqRank: 4 },
  ] satisfies MatchParticipantInsert[],

  blockRankings: [
    { id: 1, eventBlockId: 1, teamId: 1, rank: 1, points: 2, note: "決勝勝利" },
    { id: 2, eventBlockId: 1, teamId: 3, rank: 2, points: 1, note: "決勝敗退" },
    { id: 3, eventBlockId: 1, teamId: 2, rank: 3, points: 1, note: "3位決定戦勝利" },
    { id: 4, eventBlockId: 1, teamId: 4, rank: 4, points: 0, note: "3位決定戦敗退" },
    { id: 5, eventBlockId: 2, teamId: 1, rank: 1, points: 4 },
    { id: 6, eventBlockId: 2, teamId: 3, rank: 2, points: 2 },
    { id: 7, eventBlockId: 2, teamId: 2, rank: 3, points: 0 },
    { id: 8, eventBlockId: 5, teamId: 2, rank: 1, points: 6180 },
    { id: 9, eventBlockId: 5, teamId: 3, rank: 2, points: 6200 },
    { id: 10, eventBlockId: 5, teamId: 1, rank: 3, points: 6230 },
    { id: 11, eventBlockId: 5, teamId: 5, rank: 4, points: 6320 },
    { id: 12, eventBlockId: 5, teamId: 4, rank: 5, points: 6410 },
    { id: 13, eventBlockId: 5, teamId: 6, rank: 6, points: 6440 },
    { id: 14, eventBlockId: 5, teamId: 7, rank: 7, points: 6500 },
    { id: 15, eventBlockId: 5, teamId: 8, rank: 8, points: 6600 },
  ] satisfies BlockRankingInsert[],

  scores: [
    { id: 1, eventId: 1, teamId: 1, points: 30, reason: "バスケットボール 決勝1位" },
    { id: 2, eventId: 1, teamId: 3, points: 20, reason: "バスケットボール 決勝2位" },
    { id: 3, eventId: 1, teamId: 2, points: 15, reason: "バスケットボール 3位決定戦1位" },
    { id: 4, eventId: 1, teamId: 4, points: 10, reason: "バスケットボール 3位決定戦2位" },
  ] satisfies ScoreInsert[],

  userSubscriptions: [
    {
      id: 1,
      uuid: "0d33d5f6-9f8f-4d96-b6be-4b0d9b8c0a01",
      endpoint: "https://push.example.test/subscriptions/1",
      p256dh: "BOPwU5Y7h_ExampleKey_01",
      auth: "auth-key-01",
      expiration: at("2026-09-12T18:00:00+09:00"),
      createdAt: at("2026-09-10T08:45:00+09:00"),
      updatedAt: at("2026-09-10T08:45:00+09:00"),
    },
    {
      id: 2,
      uuid: "4ac2a95e-8f26-45c7-bb4b-120dca69d202",
      endpoint: "https://push.example.test/subscriptions/2",
      p256dh: "BNkU9rC2x_ExampleKey_02",
      auth: "auth-key-02",
      expiration: at("2026-09-12T18:00:00+09:00"),
      createdAt: at("2026-09-10T09:10:00+09:00"),
      updatedAt: at("2026-09-10T10:08:00+09:00"),
    },
  ] satisfies UserSubscriptionInsert[],

  watchlists: [
    { id: 1, userSubscriptionId: 1, matchPlanId: 4, createdAt: at("2026-09-10T08:50:00+09:00") },
    { id: 2, userSubscriptionId: 1, matchPlanId: 18, createdAt: at("2026-09-10T08:50:30+09:00") },
    { id: 3, userSubscriptionId: 2, matchPlanId: 9, createdAt: at("2026-09-10T09:12:00+09:00") },
    { id: 4, userSubscriptionId: 2, matchPlanId: 11, createdAt: at("2026-09-10T09:12:30+09:00") },
  ] satisfies WatchlistInsert[],
}
