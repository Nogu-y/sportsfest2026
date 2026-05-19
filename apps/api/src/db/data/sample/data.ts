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
  watchlists
} from '../../schema'
import type { PointAllocation } from '../../enums'

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

- 2チームで1試合のみ実施
- 勝者に得点を付与
`,
  relay: `# 学年別リレー

- 2チームで決勝のみ実施
- タイムが短いほど上位
`
} as const

export const sampleData = {
  systemInfo: [
    {
      id: 1,
      day1: at('2026-09-10T08:30:00+09:00'),
      day2: at('2026-09-11T08:30:00+09:00'),
      masterVersion: 'sample-master-minimal-2026-05-18'
    }
  ] satisfies SystemInfoInsert[],

  teams: [
    { id: 1, name: '1-1' },
    { id: 2, name: '1-2' }
  ] satisfies TeamInsert[],

  maps: [
    {
      id: 1,
      filePath: '/maps/campus-ground.png',
      displayName: '校庭',
      width: 1600,
      height: 900
    }
  ] satisfies MapInsert[],

  locations: [
    { id: 1, mapId: 1, name: 'グラウンドA', xRatio: 35, yRatio: 48 },
    { id: 2, mapId: 1, name: 'グラウンドB', xRatio: 65, yRatio: 48 }
  ] satisfies LocationInsert[],

  events: [
    {
      id: 1,
      name: 'バスケットボール',
      description: '最小構成のサンプル試合',
      color: '#D9480F',
      ruleMd: ruleMd.basketball,
      rankingOrder: 'DESC',
      format: 'TOURNAMENT',
      pointAllocation: points({
        MATCH: {
          FINAL: { '1': 10, '2': 5 }
        }
      }),
      isCompleted: false
    },
    {
      id: 2,
      name: '学年別リレー',
      description: '最小構成のサンプルレース',
      color: '#1864AB',
      ruleMd: ruleMd.relay,
      rankingOrder: 'ASC',
      format: 'HEATS_AND_FINAL',
      pointAllocation: points({
        MATCH: {
          FINAL: { '1': 10, '2': 5 }
        }
      }),
      isCompleted: false
    }
  ] satisfies EventInsert[],

  eventBlocks: [
    { id: 1, eventId: 1, name: '決勝', type: 'SINGLE', stage: 'FINAL' },
    { id: 2, eventId: 2, name: '決勝', type: 'SINGLE', stage: 'FINAL' }
  ] satisfies EventBlockInsert[],

  matchPlans: [
    {
      id: 1,
      eventBlockId: 1,
      locationId: 1,
      name: 'B-1',
      description: 'バスケットボール決勝',
      stage: 'FINAL',
      status: 'Waiting',
      scheduledStartTime: at('2026-05-19T13:05:00+09:00'),
      scheduledEndTime: at('2026-06-10T10:40:00+09:00')
    },
    {
      id: 2,
      eventBlockId: 2,
      locationId: 2,
      name: 'R-1',
      description: 'リレー決勝',
      stage: 'FINAL',
      status: 'Waiting',
      scheduledStartTime: at('2026-09-10T11:00:00+09:00'),
      scheduledEndTime: at('2026-09-10T11:20:00+09:00')
    }
  ] satisfies MatchPlanInsert[],

  matchParticipants: [
    { id: 1, matchPlanId: 1, teamId: 1, score: 0, rank: 1, isDisqualified: false },
    { id: 2, matchPlanId: 1, teamId: 2, score: 0, rank: 2, isDisqualified: false }
  ] satisfies MatchParticipantInsert[],

  blockRankings: [
    { id: 1, eventBlockId: 1, teamId: 1, rank: 1, points: 10 },
    { id: 2, eventBlockId: 1, teamId: 2, rank: 2, points: 5 }
  ] satisfies BlockRankingInsert[],

  scores: [
    { id: 1, eventId: 1, teamId: 1, points: 10, reason: '決勝1位' },
    { id: 2, eventId: 1, teamId: 2, points: 5, reason: '決勝2位' }
  ] satisfies ScoreInsert[],

  userSubscriptions: [
    {
      id: 1,
      uuid: 'sample-user-01',
      endpoint: 'https://example.com/push/sample-user-01',
      p256dh: 'sample-p256dh-01',
      auth: 'sample-auth-01',
      expiration: null,
      createdAt: at('2026-09-09T08:00:00+09:00'),
      updatedAt: at('2026-09-09T08:00:00+09:00')
    }
  ] satisfies UserSubscriptionInsert[],

  watchlists: [
    {
      id: 1,
      userSubscriptionId: 1,
      matchPlanId: 1,
      createdAt: at('2026-09-09T08:05:00+09:00')
    }
  ] satisfies WatchlistInsert[]
}
