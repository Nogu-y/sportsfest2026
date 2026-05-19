import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'

type Stage = PublicMasterResponse['matches'][number]['stage']

type ParticipantSeed = {
  teamName?: string
  prereqMatchKey?: string
  prereqBlockId?: number
  prereqRank?: number
}

type MatchSeed = {
  key: string
  eventBlockId: number
  locationId: number | null
  name: string
  stage: Stage
  startAt: string
  endAt: string
  participants: ParticipantSeed[]
  description?: string
}

export type MatchInputPayload = {
  eventBlockId: number
  locationId: number | null
  name: string
  description: string | null
  stage: Stage
  status: 'Waiting'
  scheduledStartTime: string
  scheduledEndTime: string
  startedAt: null
  endedAt: null
  note: null
  participants: {
    teamId: number | null
    prereqMatchId: number | null
    prereqBlockId: number | null
    prereqRank: number | null
    score: null
    rank: null
    isDisqualified: false
    _prereqMatchKey?: string
  }[]
}

export type BlockBatch = {
  eventBlockId: number
  label: string
  matches: {
    key: string
    payload: MatchInputPayload
  }[]
}

const day1 = (time: string) => `2026-05-21T${time}:00+09:00`
const day2 = (time: string) => `2026-05-22T${time}:00+09:00`

const teamAlias: Record<string, string> = {
  '1組': '1-1',
  '2組': '1-2',
  '3組': '1-3',
  '4組': '1-4',
  '1年1組': '1-1',
  '1年2組': '1-2',
  '1年3組': '1-3',
  '1年4組': '1-4',
  教員: '教職員',
}

function resolveTeamName(name: string) {
  return teamAlias[name] ?? name
}

function toPayload(seed: MatchSeed, teamIdByName: Map<string, number>): MatchInputPayload {
  return {
    eventBlockId: seed.eventBlockId,
    locationId: seed.locationId,
    name: seed.name,
    description: seed.description ?? null,
    stage: seed.stage,
    status: 'Waiting',
    scheduledStartTime: seed.startAt,
    scheduledEndTime: seed.endAt,
    startedAt: null,
    endedAt: null,
    note: null,
    participants: seed.participants.map((participant) => ({
      teamId: participant.teamName ? (teamIdByName.get(resolveTeamName(participant.teamName)) ?? null) : null,
      prereqMatchId: null,
      prereqBlockId: participant.prereqBlockId ?? null,
      prereqRank: participant.prereqRank ?? null,
      score: null,
      rank: null,
      isDisqualified: false,
      _prereqMatchKey: participant.prereqMatchKey,
    })),
  }
}

function buildRoundRobinSeeds(input: {
  eventBlockId: number
  locationId: number
  blockCode: string
  teams: string[]
  startTimes: string[]
  endTimes: string[]
  onDay2?: boolean
}): MatchSeed[] {
  const pairs: [number, number][] = []

  for (let i = 0; i < input.teams.length; i += 1) {
    for (let j = i + 1; j < input.teams.length; j += 1) {
      pairs.push([i, j])
    }
  }

  return pairs.map((pair, index) => ({
    key: `b${input.eventBlockId}-${index + 1}`,
    eventBlockId: input.eventBlockId,
    locationId: input.locationId,
    name: `${input.blockCode}-${index + 1}`,
    stage: 'QUALIFIER',
    startAt: (input.onDay2 ? day2 : day1)(input.startTimes[index]),
    endAt: (input.onDay2 ? day2 : day1)(input.endTimes[index]),
    participants: [
      { teamName: input.teams[pair[0]] },
      { teamName: input.teams[pair[1]] },
    ],
  }))
}

function buildFixedLeagueSeeds(input: {
  eventBlockId: number
  locationId: number
  fixtures: {
    name: string
    teamA: string
    teamB: string
    startTime: string
    endTime: string
  }[]
  onDay2?: boolean
}): MatchSeed[] {
  return input.fixtures.map((fixture, index) => ({
    key: `b${input.eventBlockId}-${index + 1}`,
    eventBlockId: input.eventBlockId,
    locationId: input.locationId,
    name: fixture.name,
    stage: 'QUALIFIER',
    startAt: (input.onDay2 ? day2 : day1)(fixture.startTime),
    endAt: (input.onDay2 ? day2 : day1)(fixture.endTime),
    participants: [{ teamName: fixture.teamA }, { teamName: fixture.teamB }],
  }))
}

function buildSeedMatches(): MatchSeed[] {
  const seeds: MatchSeed[] = []

  // ソフトテニス予選 (block 3-9)
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 3, locationId: 9, fixtures: [
    { name: 'A-1', teamA: '5J', teamB: '3J', startTime: '09:30', endTime: '09:55' },
    { name: 'A-2', teamA: '2M', teamB: '5J', startTime: '11:00', endTime: '11:25' },
    { name: 'A-3', teamA: '2M', teamB: '3J', startTime: '13:05', endTime: '13:30' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 4, locationId: 10, fixtures: [
    { name: 'B-1', teamA: '3組', teamB: '4組', startTime: '09:30', endTime: '09:55' },
    { name: 'B-2', teamA: '4組', teamB: '5E', startTime: '11:00', endTime: '11:25' },
    { name: 'B-3', teamA: '3組', teamB: '5E', startTime: '13:05', endTime: '13:30' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 5, locationId: 11, fixtures: [
    { name: 'C-1', teamA: '5M', teamB: '1組', startTime: '09:30', endTime: '09:55' },
    { name: 'C-2', teamA: '5M', teamB: '専攻科', startTime: '11:00', endTime: '11:25' },
    { name: 'C-3', teamA: '専攻科', teamB: '1組', startTime: '13:05', endTime: '13:30' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 6, locationId: 12, fixtures: [
    { name: 'D-1', teamA: '4E', teamB: '2組', startTime: '09:30', endTime: '09:55' },
    { name: 'D-2', teamA: '2組', teamB: '2C', startTime: '11:00', endTime: '11:25' },
    { name: 'D-3', teamA: '4E', teamB: '2C', startTime: '13:05', endTime: '13:30' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 7, locationId: 9, fixtures: [
    { name: 'E-1', teamA: '3組', teamB: '2E', startTime: '10:15', endTime: '10:40' },
    { name: 'E-2', teamA: '2組', teamB: '2E', startTime: '11:45', endTime: '12:10' },
    { name: 'E-3', teamA: '3組', teamB: '2組', startTime: '13:50', endTime: '14:15' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 8, locationId: 10, fixtures: [
    { name: 'F-1', teamA: '教員', teamB: '4E', startTime: '10:15', endTime: '10:40' },
    { name: 'F-2', teamA: '4E', teamB: '2M', startTime: '11:45', endTime: '12:10' },
    { name: 'F-3', teamA: '教員', teamB: '2M', startTime: '13:50', endTime: '14:15' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 9, locationId: 11, fixtures: [
    { name: 'G-1', teamA: '2C', teamB: '3E', startTime: '10:15', endTime: '10:40' },
    { name: 'G-2', teamA: '5J', teamB: '2C', startTime: '11:45', endTime: '12:10' },
    { name: 'G-3', teamA: '5J', teamB: '3E', startTime: '13:50', endTime: '14:15' },
  ] }))

  // ソフトテニス決勝トーナメント (block 10)
  seeds.push(
    { key: 'st-1', eventBlockId: 10, locationId: 9, name: '①', stage: 'ROUND_1', startAt: day2('09:30'), endAt: day2('09:55'), participants: [{ prereqBlockId: 4, prereqRank: 1 }, { prereqBlockId: 7, prereqRank: 1 }] },
    { key: 'st-2', eventBlockId: 10, locationId: 10, name: '②', stage: 'ROUND_1', startAt: day2('09:30'), endAt: day2('09:55'), participants: [{ prereqBlockId: 9, prereqRank: 1 }, { prereqBlockId: 6, prereqRank: 1 }] },
    { key: 'st-3', eventBlockId: 10, locationId: 11, name: '③', stage: 'ROUND_1', startAt: day2('09:30'), endAt: day2('09:55'), participants: [{ prereqBlockId: 5, prereqRank: 1 }, { prereqBlockId: 8, prereqRank: 1 }] },
    { key: 'st-4', eventBlockId: 10, locationId: 9, name: '④', stage: 'ROUND_2', startAt: day2('10:40'), endAt: day2('11:05'), participants: [{ prereqMatchKey: 'st-1' }, { prereqBlockId: 3, prereqRank: 1 }] },
    { key: 'st-5', eventBlockId: 10, locationId: 10, name: '⑤', stage: 'ROUND_2', startAt: day2('10:40'), endAt: day2('11:05'), participants: [{ prereqMatchKey: 'st-2' }, { prereqMatchKey: 'st-3' }] },
    { key: 'st-6', eventBlockId: 10, locationId: 11, name: '⑥', stage: 'THIRD_PLACE', startAt: day2('14:20'), endAt: day2('14:45'), participants: [{ prereqMatchKey: 'st-4', prereqRank: 2 }, { prereqMatchKey: 'st-5', prereqRank: 2 }] },
    { key: 'st-7', eventBlockId: 10, locationId: 12, name: '⑦', stage: 'FINAL', startAt: day2('14:20'), endAt: day2('14:45'), participants: [{ prereqMatchKey: 'st-4', prereqRank: 1 }, { prereqMatchKey: 'st-5', prereqRank: 1 }] },
  )

  // ソフトボール本選トーナメント (block 11)
  seeds.push(
    { key: 'sb-1', eventBlockId: 11, locationId: 7, name: '①', stage: 'ROUND_1', startAt: day1('09:30'), endAt: day1('09:55'), participants: [{ teamName: '1年2組' }, { teamName: '5E' }] },
    { key: 'sb-2', eventBlockId: 11, locationId: 8, name: '②', stage: 'ROUND_1', startAt: day1('09:30'), endAt: day1('09:55'), participants: [{ teamName: '5J' }, { teamName: '教員' }] },
    { key: 'sb-3', eventBlockId: 11, locationId: 7, name: '③', stage: 'ROUND_1', startAt: day1('10:10'), endAt: day1('10:35'), participants: [{ teamName: '2C' }, { teamName: '5C' }] },
    { key: 'sb-4', eventBlockId: 11, locationId: 8, name: '④', stage: 'ROUND_1', startAt: day1('10:10'), endAt: day1('10:35'), participants: [{ teamName: '4M' }, { teamName: '3E' }] },
    { key: 'sb-5', eventBlockId: 11, locationId: 7, name: '⑤', stage: 'ROUND_1', startAt: day1('10:55'), endAt: day1('11:20'), participants: [{ teamName: '4C' }, { teamName: '4J' }] },
    { key: 'sb-6', eventBlockId: 11, locationId: 8, name: '⑥', stage: 'ROUND_1', startAt: day1('10:55'), endAt: day1('11:20'), participants: [{ teamName: '3C' }, { teamName: '1年3組' }] },
    { key: 'sb-7', eventBlockId: 11, locationId: 7, name: '⑦', stage: 'ROUND_1', startAt: day1('11:35'), endAt: day1('12:00'), participants: [{ teamName: '1年4組' }, { teamName: '5M' }] },
    { key: 'sb-8', eventBlockId: 11, locationId: 8, name: '⑧', stage: 'ROUND_1', startAt: day1('11:35'), endAt: day1('12:00'), participants: [{ teamName: '1年1組' }, { teamName: '専攻科' }] },
    { key: 'sb-9', eventBlockId: 11, locationId: 7, name: '⑨', stage: 'ROUND_2', startAt: day1('12:55'), endAt: day1('13:20'), participants: [{ prereqMatchKey: 'sb-1' }, { teamName: '2E' }] },
    { key: 'sb-10', eventBlockId: 11, locationId: 8, name: '⑩', stage: 'ROUND_2', startAt: day1('12:55'), endAt: day1('13:20'), participants: [{ prereqMatchKey: 'sb-2' }, { teamName: '3M' }] },
    { key: 'sb-11', eventBlockId: 11, locationId: 7, name: '⑪', stage: 'ROUND_2', startAt: day1('13:20'), endAt: day1('13:45'), participants: [{ prereqMatchKey: 'sb-3' }, { prereqMatchKey: 'sb-4' }] },
    { key: 'sb-12', eventBlockId: 11, locationId: 8, name: '⑫', stage: 'ROUND_2', startAt: day1('13:20'), endAt: day1('13:45'), participants: [{ prereqMatchKey: 'sb-5' }, { teamName: '3C' }] },
    { key: 'sb-13', eventBlockId: 11, locationId: 7, name: '⑬', stage: 'ROUND_2', startAt: day1('14:15'), endAt: day1('14:40'), participants: [{ prereqMatchKey: 'sb-6' }, { teamName: '4E' }] },
    { key: 'sb-14', eventBlockId: 11, locationId: 8, name: '⑭', stage: 'ROUND_2', startAt: day1('14:15'), endAt: day1('14:40'), participants: [{ prereqMatchKey: 'sb-7' }, { teamName: '2M' }] },
    { key: 'sb-15', eventBlockId: 11, locationId: 7, name: '⑮', stage: 'ROUND_2', startAt: day2('09:25'), endAt: day2('09:50'), participants: [{ prereqMatchKey: 'sb-8' }, { teamName: '3J' }] },
    { key: 'sb-16', eventBlockId: 11, locationId: 8, name: '⑯', stage: 'ROUND_2', startAt: day2('09:05'), endAt: day2('09:30'), participants: [{ prereqMatchKey: 'sb-9' }, { prereqMatchKey: 'sb-10' }] },
    { key: 'sb-17', eventBlockId: 11, locationId: 7, name: '⑰', stage: 'QUARTERFINAL', startAt: day2('09:50'), endAt: day2('10:15'), participants: [{ prereqMatchKey: 'sb-12' }, { prereqMatchKey: 'sb-13' }] },
    { key: 'sb-18', eventBlockId: 11, locationId: 8, name: '⑱', stage: 'QUARTERFINAL', startAt: day2('09:50'), endAt: day2('10:15'), participants: [{ prereqMatchKey: 'sb-14' }, { prereqMatchKey: 'sb-15' }] },
    { key: 'sb-19', eventBlockId: 11, locationId: 7, name: '⑲', stage: 'SEMIFINAL', startAt: day2('12:50'), endAt: day2('13:15'), participants: [{ prereqMatchKey: 'sb-16' }, { prereqMatchKey: 'sb-17' }] },
    { key: 'sb-20', eventBlockId: 11, locationId: 8, name: '⑳', stage: 'SEMIFINAL', startAt: day2('13:20'), endAt: day2('13:45'), participants: [{ prereqMatchKey: 'sb-15' }, { prereqMatchKey: 'sb-18' }] },
    { key: 'sb-21', eventBlockId: 11, locationId: 7, name: '㉑', stage: 'THIRD_PLACE', startAt: day2('12:00'), endAt: day2('12:25'), participants: [{ prereqMatchKey: 'sb-19', prereqRank: 2 }, { prereqMatchKey: 'sb-20', prereqRank: 2 }] },
    { key: 'sb-22', eventBlockId: 11, locationId: 8, name: '㉒', stage: 'FINAL', startAt: day2('12:00'), endAt: day2('12:25'), participants: [{ prereqMatchKey: 'sb-19', prereqRank: 1 }, { prereqMatchKey: 'sb-20', prereqRank: 1 }] },
  )

  // バスケット予選 (block 12-18)
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 12, locationId: 3, fixtures: [
    { name: 'A-1', teamA: '3C', teamB: '4C', startTime: '09:30', endTime: '09:55' },
    { name: 'A-2', teamA: '4C', teamB: '1組', startTime: '10:15', endTime: '10:40' },
    { name: 'A-3', teamA: '3C', teamB: '1組', startTime: '11:05', endTime: '11:30' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 13, locationId: 4, fixtures: [
    { name: 'B-1', teamA: '2J', teamB: '4J', startTime: '09:30', endTime: '09:55' },
    { name: 'B-2', teamA: '5E', teamB: '2J', startTime: '10:15', endTime: '10:40' },
    { name: 'B-3', teamA: '5E', teamB: '4J', startTime: '11:05', endTime: '11:30' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 14, locationId: 5, fixtures: [
    { name: 'C-1', teamA: '5C', teamB: '5M', startTime: '09:30', endTime: '09:55' },
    { name: 'C-2', teamA: '3M', teamB: '5M', startTime: '10:15', endTime: '10:40' },
    { name: 'C-3', teamA: '5C', teamB: '3M', startTime: '11:05', endTime: '11:30' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 15, locationId: 6, fixtures: [
    { name: 'D-1', teamA: '4組', teamB: '4M', startTime: '09:30', endTime: '09:55' },
    { name: 'D-2', teamA: '4組', teamB: '3J', startTime: '10:15', endTime: '10:40' },
    { name: 'D-3', teamA: '4M', teamB: '3J', startTime: '11:05', endTime: '11:30' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 16, locationId: 3, fixtures: [
    { name: 'E-1', teamA: '3組', teamB: '2E', startTime: '09:50', endTime: '10:15' },
    { name: 'E-2', teamA: '2組', teamB: '2E', startTime: '10:40', endTime: '11:05' },
    { name: 'E-3', teamA: '3組', teamB: '2組', startTime: '11:30', endTime: '11:55' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 17, locationId: 4, fixtures: [
    { name: 'F-1', teamA: '教員', teamB: '4E', startTime: '09:50', endTime: '10:15' },
    { name: 'F-2', teamA: '4E', teamB: '2M', startTime: '10:40', endTime: '11:05' },
    { name: 'F-3', teamA: '教員', teamB: '2M', startTime: '11:30', endTime: '11:55' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 18, locationId: 5, fixtures: [
    { name: 'G-1', teamA: '2C', teamB: '3E', startTime: '09:50', endTime: '10:15' },
    { name: 'G-2', teamA: '5J', teamB: '2C', startTime: '10:40', endTime: '11:05' },
    { name: 'G-3', teamA: '5J', teamB: '3E', startTime: '11:30', endTime: '11:55' },
  ] }))

  // バスケット決勝トーナメント (block 19)
  seeds.push(
    { key: 'bk-1', eventBlockId: 19, locationId: 5, name: '①', stage: 'ROUND_1', startAt: day1('12:00'), endAt: day1('12:25'), participants: [{ teamName: '専攻科' }, { prereqBlockId: 18, prereqRank: 1 }] },
    { key: 'bk-2', eventBlockId: 19, locationId: 6, name: '②', stage: 'ROUND_1', startAt: day1('12:00'), endAt: day1('12:25'), participants: [{ prereqBlockId: 14, prereqRank: 1 }, { prereqBlockId: 15, prereqRank: 1 }] },
    { key: 'bk-3', eventBlockId: 19, locationId: 5, name: '③', stage: 'ROUND_1', startAt: day1('13:05'), endAt: day1('13:30'), participants: [{ prereqBlockId: 12, prereqRank: 1 }, { prereqBlockId: 17, prereqRank: 1 }] },
    { key: 'bk-4', eventBlockId: 19, locationId: 6, name: '④', stage: 'ROUND_1', startAt: day1('13:05'), endAt: day1('13:30'), participants: [{ prereqBlockId: 13, prereqRank: 1 }, { prereqBlockId: 16, prereqRank: 1 }] },
    { key: 'bk-5', eventBlockId: 19, locationId: 5, name: '⑤', stage: 'SEMIFINAL', startAt: day1('13:35'), endAt: day1('14:00'), participants: [{ prereqMatchKey: 'bk-1' }, { prereqMatchKey: 'bk-2' }] },
    { key: 'bk-6', eventBlockId: 19, locationId: 6, name: '⑥', stage: 'SEMIFINAL', startAt: day1('14:05'), endAt: day1('14:30'), participants: [{ prereqMatchKey: 'bk-3' }, { prereqMatchKey: 'bk-4' }] },
    { key: 'bk-7', eventBlockId: 19, locationId: 5, name: '⑦', stage: 'FINAL', startAt: day1('14:35'), endAt: day1('15:00'), participants: [{ prereqMatchKey: 'bk-5' }, { prereqMatchKey: 'bk-6' }] },
  )

  // バドミントン予選 (block 20-24)
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 20, locationId: 15, onDay2: true, fixtures: [
    { name: 'A-1', teamA: '1組', teamB: '4組', startTime: '09:10', endTime: '09:35' },
    { name: 'A-2', teamA: '2組', teamB: '3組', startTime: '09:45', endTime: '10:10' },
    { name: 'A-3', teamA: '3組', teamB: '4組', startTime: '10:15', endTime: '10:40' },
    { name: 'A-4', teamA: '2組', teamB: '4組', startTime: '10:45', endTime: '11:10' },
    { name: 'A-5', teamA: '1組', teamB: '3組', startTime: '11:10', endTime: '11:35' },
    { name: 'A-6', teamA: '1組', teamB: '2組', startTime: '11:45', endTime: '12:10' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 21, locationId: 16, onDay2: true, fixtures: [
    { name: 'B-1', teamA: '2M', teamB: '2C', startTime: '09:10', endTime: '09:35' },
    { name: 'B-2', teamA: '2E', teamB: '2J', startTime: '09:45', endTime: '10:10' },
    { name: 'B-3', teamA: '2J', teamB: '2C', startTime: '10:15', endTime: '10:40' },
    { name: 'B-4', teamA: '2E', teamB: '2C', startTime: '10:45', endTime: '11:10' },
    { name: 'B-5', teamA: '2M', teamB: '2J', startTime: '11:10', endTime: '11:35' },
    { name: 'B-6', teamA: '2M', teamB: '2E', startTime: '11:45', endTime: '12:10' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 22, locationId: 17, onDay2: true, fixtures: [
    { name: 'C-1', teamA: '3C', teamB: '3E', startTime: '09:10', endTime: '09:35' },
    { name: 'C-2', teamA: '3J', teamB: '3C', startTime: '09:45', endTime: '10:10' },
    { name: 'C-3', teamA: '3M', teamB: '3E', startTime: '10:15', endTime: '10:40' },
    { name: 'C-4', teamA: '3M', teamB: '3J', startTime: '10:45', endTime: '11:10' },
    { name: 'C-5', teamA: '3E', teamB: '3J', startTime: '11:10', endTime: '11:35' },
    { name: 'C-6', teamA: '3M', teamB: '3C', startTime: '11:45', endTime: '12:10' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 23, locationId: 18, onDay2: true, fixtures: [
    { name: 'D-1', teamA: '4M', teamB: '4E', startTime: '09:10', endTime: '09:35' },
    { name: 'D-2', teamA: '4E', teamB: '4J', startTime: '09:45', endTime: '10:10' },
    { name: 'D-3', teamA: '4M', teamB: '4J', startTime: '10:15', endTime: '10:40' },
    { name: 'D-4', teamA: '4C', teamB: '4M', startTime: '10:45', endTime: '11:10' },
    { name: 'D-5', teamA: '4C', teamB: '4J', startTime: '11:10', endTime: '11:35' },
    { name: 'D-6', teamA: '4C', teamB: '4E', startTime: '11:45', endTime: '12:10' },
  ] }))
  seeds.push(...buildFixedLeagueSeeds({ eventBlockId: 24, locationId: 19, onDay2: true, fixtures: [
    { name: 'E-1', teamA: '5J', teamB: '5E', startTime: '09:10', endTime: '09:35' },
    { name: 'E-2', teamA: '5J', teamB: '5M', startTime: '09:45', endTime: '10:10' },
    { name: 'E-3', teamA: '5E', teamB: '5C', startTime: '10:15', endTime: '10:40' },
    { name: 'E-4', teamA: '5M', teamB: '5C', startTime: '10:45', endTime: '11:10' },
    { name: 'E-5', teamA: '5M', teamB: '5E', startTime: '11:10', endTime: '11:35' },
    { name: 'E-6', teamA: '5J', teamB: '5C', startTime: '11:45', endTime: '12:10' },
  ] }))

  // バドミントン決勝トーナメント (block 25)
  seeds.push(
    { key: 'bd-1', eventBlockId: 25, locationId: 15, name: '①', stage: 'ROUND_1', startAt: day2('12:40'), endAt: day2('13:05'), participants: [{ prereqBlockId: 24, prereqRank: 1 }, { prereqBlockId: 22, prereqRank: 2 }] },
    { key: 'bd-2', eventBlockId: 25, locationId: 16, name: '②', stage: 'ROUND_1', startAt: day2('12:40'), endAt: day2('13:05'), participants: [{ prereqBlockId: 20, prereqRank: 1 }, { prereqBlockId: 20, prereqRank: 2 }] },
    { key: 'bd-3', eventBlockId: 25, locationId: 17, name: '③', stage: 'ROUND_1', startAt: day2('12:40'), endAt: day2('13:05'), participants: [{ prereqBlockId: 22, prereqRank: 1 }, { prereqBlockId: 23, prereqRank: 2 }] },
    { key: 'bd-4', eventBlockId: 25, locationId: 18, name: '④', stage: 'ROUND_1', startAt: day2('12:40'), endAt: day2('13:05'), participants: [{ prereqBlockId: 21, prereqRank: 2 }, { teamName: '専攻科' }] },
    { key: 'bd-5', eventBlockId: 25, locationId: 15, name: '⑤', stage: 'ROUND_2', startAt: day2('13:10'), endAt: day2('13:35'), participants: [{ prereqMatchKey: 'bd-1' }, { prereqMatchKey: 'bd-2' }] },
    { key: 'bd-6', eventBlockId: 25, locationId: 16, name: '⑥', stage: 'ROUND_2', startAt: day2('13:10'), endAt: day2('13:35'), participants: [{ teamName: '教員' }, { prereqBlockId: 21, prereqRank: 1 }] },
    { key: 'bd-7', eventBlockId: 25, locationId: 17, name: '⑦', stage: 'ROUND_2', startAt: day2('13:10'), endAt: day2('13:35'), participants: [{ prereqMatchKey: 'bd-3' }, { prereqMatchKey: 'bd-4' }] },
    { key: 'bd-8', eventBlockId: 25, locationId: 18, name: '⑧', stage: 'ROUND_2', startAt: day2('13:10'), endAt: day2('13:35'), participants: [{ prereqBlockId: 24, prereqRank: 2 }, { prereqBlockId: 23, prereqRank: 1 }] },
    { key: 'bd-9', eventBlockId: 25, locationId: 15, name: '⑨', stage: 'SEMIFINAL', startAt: day2('13:50'), endAt: day2('14:15'), participants: [{ prereqMatchKey: 'bd-5' }, { prereqMatchKey: 'bd-6' }] },
    { key: 'bd-10', eventBlockId: 25, locationId: 16, name: '⑩', stage: 'SEMIFINAL', startAt: day2('13:50'), endAt: day2('14:15'), participants: [{ prereqMatchKey: 'bd-7' }, { prereqMatchKey: 'bd-8' }] },
    { key: 'bd-11', eventBlockId: 25, locationId: 17, name: '⑪', stage: 'THIRD_PLACE', startAt: day2('14:20'), endAt: day2('14:45'), participants: [{ prereqMatchKey: 'bd-9', prereqRank: 2 }, { prereqMatchKey: 'bd-10', prereqRank: 2 }] },
    { key: 'bd-12', eventBlockId: 25, locationId: 18, name: '⑫', stage: 'FINAL', startAt: day2('14:20'), endAt: day2('14:45'), participants: [{ prereqMatchKey: 'bd-9', prereqRank: 1 }, { prereqMatchKey: 'bd-10', prereqRank: 1 }] },
  )

  // バレーボール本選トーナメント (block 26)
  seeds.push(
    { key: 'vl-1', eventBlockId: 26, locationId: 20, name: '①', stage: 'ROUND_1', startAt: day2('09:05'), endAt: day2('09:30'), participants: [{ teamName: '3E' }, { teamName: '教員' }] },
    { key: 'vl-2', eventBlockId: 26, locationId: 21, name: '②', stage: 'ROUND_1', startAt: day2('09:05'), endAt: day2('09:30'), participants: [{ teamName: '2組' }, { teamName: '3組' }] },
    { key: 'vl-3', eventBlockId: 26, locationId: 20, name: '③', stage: 'ROUND_1', startAt: day2('09:30'), endAt: day2('09:55'), participants: [{ teamName: '専攻科' }, { teamName: '4M' }] },
    { key: 'vl-4', eventBlockId: 26, locationId: 21, name: '④', stage: 'ROUND_1', startAt: day2('09:30'), endAt: day2('09:55'), participants: [{ teamName: '5E' }, { teamName: '1組' }] },
    { key: 'vl-5', eventBlockId: 26, locationId: 20, name: '⑤', stage: 'ROUND_1', startAt: day2('09:45'), endAt: day2('10:10'), participants: [{ teamName: '3C' }, { teamName: '2C' }] },
    { key: 'vl-6', eventBlockId: 26, locationId: 21, name: '⑥', stage: 'ROUND_1', startAt: day2('09:45'), endAt: day2('10:10'), participants: [{ teamName: '5C' }, { teamName: '3J' }] },
    { key: 'vl-7', eventBlockId: 26, locationId: 20, name: '⑦', stage: 'ROUND_1', startAt: day2('10:05'), endAt: day2('10:30'), participants: [{ teamName: '2M' }, { teamName: '5M' }] },
    { key: 'vl-8', eventBlockId: 26, locationId: 21, name: '⑧', stage: 'ROUND_1', startAt: day2('10:05'), endAt: day2('10:30'), participants: [{ teamName: '2E' }, { teamName: '4C' }] },
    { key: 'vl-9', eventBlockId: 26, locationId: 20, name: '⑨', stage: 'ROUND_2', startAt: day2('10:30'), endAt: day2('10:55'), participants: [{ prereqMatchKey: 'vl-1' }, { teamName: '2J' }] },
    { key: 'vl-10', eventBlockId: 26, locationId: 21, name: '⑩', stage: 'ROUND_2', startAt: day2('10:30'), endAt: day2('10:55'), participants: [{ prereqMatchKey: 'vl-2' }, { teamName: '4J' }] },
    { key: 'vl-11', eventBlockId: 26, locationId: 20, name: '⑪', stage: 'ROUND_2', startAt: day2('10:45'), endAt: day2('11:10'), participants: [{ prereqMatchKey: 'vl-3' }, { teamName: '4E' }] },
    { key: 'vl-12', eventBlockId: 26, locationId: 21, name: '⑫', stage: 'ROUND_2', startAt: day2('10:45'), endAt: day2('11:10'), participants: [{ prereqMatchKey: 'vl-4' }, { teamName: '3M' }] },
    { key: 'vl-13', eventBlockId: 26, locationId: 20, name: '⑬', stage: 'ROUND_2', startAt: day2('11:05'), endAt: day2('11:30'), participants: [{ prereqMatchKey: 'vl-5' }, { teamName: '4組' }] },
    { key: 'vl-14', eventBlockId: 26, locationId: 21, name: '⑭', stage: 'ROUND_2', startAt: day2('11:05'), endAt: day2('11:30'), participants: [{ prereqMatchKey: 'vl-6' }, { teamName: '5J' }] },
    { key: 'vl-15', eventBlockId: 26, locationId: 20, name: '⑮', stage: 'ROUND_2', startAt: day2('11:30'), endAt: day2('11:55'), participants: [{ prereqMatchKey: 'vl-7' }, { prereqMatchKey: 'vl-8' }] },
    { key: 'vl-16', eventBlockId: 26, locationId: 21, name: '⑯', stage: 'ROUND_2', startAt: day2('11:30'), endAt: day2('11:55'), participants: [{ prereqMatchKey: 'vl-9' }, { prereqMatchKey: 'vl-10' }] },
    { key: 'vl-17', eventBlockId: 26, locationId: 20, name: '⑰', stage: 'QUARTERFINAL', startAt: day2('11:45'), endAt: day2('12:10'), participants: [{ prereqMatchKey: 'vl-11' }, { prereqMatchKey: 'vl-12' }] },
    { key: 'vl-18', eventBlockId: 26, locationId: 21, name: '⑱', stage: 'QUARTERFINAL', startAt: day2('11:45'), endAt: day2('12:10'), participants: [{ prereqMatchKey: 'vl-13' }, { prereqMatchKey: 'vl-14' }] },
    { key: 'vl-19', eventBlockId: 26, locationId: 20, name: '⑲', stage: 'SEMIFINAL', startAt: day2('12:50'), endAt: day2('13:15'), participants: [{ prereqMatchKey: 'vl-16' }, { prereqMatchKey: 'vl-17' }] },
    { key: 'vl-20', eventBlockId: 26, locationId: 21, name: '⑳', stage: 'SEMIFINAL', startAt: day2('13:20'), endAt: day2('13:45'), participants: [{ prereqMatchKey: 'vl-15' }, { prereqMatchKey: 'vl-18' }] },
    { key: 'vl-21', eventBlockId: 26, locationId: 20, name: '㉑', stage: 'FINAL', startAt: day2('13:50'), endAt: day2('14:15'), participants: [{ prereqMatchKey: 'vl-19' }, { prereqMatchKey: 'vl-20' }] },
  )

  return seeds
}

export function buildBlockBatches(masterData: PublicMasterResponse): BlockBatch[] {
  const teamIdByName = new Map(masterData.teams.map((team) => [team.name, team.id]))
  const blockById = new Map(masterData.blocks.map((block) => [block.id, block]))
  const eventById = new Map(masterData.events.map((event) => [event.id, event]))

  const seeds = buildSeedMatches()
  const byBlock = new Map<number, BlockBatch>()

  for (const seed of seeds) {
    const block = blockById.get(seed.eventBlockId)
    if (!block) continue

    const eventName = eventById.get(block.eventId)?.name ?? `event:${block.eventId}`
    const label = `${block.id}: ${eventName} / ${block.name}`

    const item = byBlock.get(seed.eventBlockId) ?? { eventBlockId: seed.eventBlockId, label, matches: [] }

    item.matches.push({ key: seed.key, payload: toPayload(seed, teamIdByName) })
    byBlock.set(seed.eventBlockId, item)
  }

  return Array.from(byBlock.values()).sort((a, b) => a.eventBlockId - b.eventBlockId)
}
