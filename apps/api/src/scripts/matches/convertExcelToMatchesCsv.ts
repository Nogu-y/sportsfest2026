import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import XLSX from 'xlsx'
import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { eventBlocks, events, locations, matchParticipants, matchPlans, teams } from '../../db/schema'

type Stage =
  | 'QUALIFIER'
  | 'ROUND_1'
  | 'ROUND_2'
  | 'QUARTERFINAL'
  | 'SEMIFINAL'
  | 'THIRD_PLACE'
  | 'FINAL'

type ParticipantSeed = {
  id: number
  teamId: number | null
  prereqMatchId: number | null
  prereqBlockId: number | null
  prereqRank: number | null
  score: number | null
  rank: number | null
  isDisqualified: boolean
}

type MatchCsvRecord = {
  id: number
  eventBlockId: number
  locationId: number | null
  name: string
  description: string
  stage: Stage
  status: string
  scheduledStartTime: string
  scheduledEndTime: string
  note: string
  participants: ParticipantSeed[]
}

type MatchSeed = {
  id: number
  eventId: number
  eventBlockId: number
  locationId: number
  name: string
  stage: Stage
  scheduledStartTime: string
  scheduledEndTime: string
  participantTokens: string[]
}

type MasterData = Awaited<ReturnType<typeof loadMasterFromDb>>

const ROOT = path.resolve(process.cwd(), '../..')
const DEFAULT_INPUT_XLSX = path.resolve(ROOT, 'R8-体育大会競技スケジュール.xlsx')
const DEFAULT_OUTPUT_CSV = path.resolve(ROOT, 'apps/api/data-rows/matches.from-excel.csv')

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

const inputXlsxArg = getArgValue('--input')
const outputCsvArg = getArgValue('--output')
const INPUT_XLSX = inputXlsxArg
  ? path.resolve(process.cwd(), inputXlsxArg)
  : DEFAULT_INPUT_XLSX
const OUTPUT_CSV = outputCsvArg
  ? path.resolve(process.cwd(), outputCsvArg)
  : DEFAULT_OUTPUT_CSV
const BASE_DATE = {
  day1: '2026-05-21',
  day2: '2026-05-22',
} as const

const IGNORE_CELL_WORDS = [
  '集合',
  '出席確認',
  '開会式',
  '移動時間',
  '昼休憩',
  '片付け',
  '準備',
  '清掃',
] as const

const EVENT_NAME_MAP: Record<string, string> = {
  バスケットボール: 'バスケットボール',
  ソフトボール: 'ソフトボール',
  ソフトテニス: 'ソフトテニス',
  借り人競争: '借り人競争',
  バドミントン: 'バドミントン',
  バレーボール: 'バレーボール',
  選抜リレー: '選抜リレー',
}

const GRADE_TO_TEAM = {
  '1組': '1-1',
  '2組': '1-2',
  '3組': '1-3',
  '4組': '1-4',
  教員: '教職員',
} as const

function normalizeCell(raw: string) {
  return raw.replace(/\r/g, '\n').replace(/\s+/g, ' ').trim()
}

function parseTime(text: string) {
  const match = text.match(/^(\d{1,2}):(\d{2})$/)
  if (match) {
    return {
      hh: Number.parseInt(match[1], 10),
      mm: Number.parseInt(match[2], 10),
    }
  }

  const asNumber = Number(text)
  if (!Number.isNaN(asNumber) && asNumber >= 0 && asNumber < 1) {
    const totalMinutes = Math.round(asNumber * 24 * 60)
    return {
      hh: Math.floor(totalMinutes / 60) % 24,
      mm: totalMinutes % 60,
    }
  }
  return null
}

function toIso(date: string, time: string) {
  const parsed = parseTime(time)
  if (!parsed) return null
  const hh = String(parsed.hh).padStart(2, '0')
  const mm = String(parsed.mm).padStart(2, '0')
  return new Date(`${date}T${hh}:${mm}:00+09:00`).toISOString()
}

function csvEscape(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function rowIdentityKey(row: Pick<MatchCsvRecord, 'eventBlockId' | 'locationId' | 'name'>) {
  return `${row.eventBlockId}|${row.locationId ?? 'null'}|${row.name}`
}

function participantIdentityKey(row: Omit<ParticipantSeed, 'id'>) {
  return [
    row.teamId ?? 'null',
    row.prereqMatchId ?? 'null',
    row.prereqBlockId ?? 'null',
    row.prereqRank ?? 'null',
  ].join('|')
}

function syncWithExistingRows(generatedRows: MatchCsvRecord[], existingRows: MatchCsvRecord[]) {
  const existingByIdentity = new Map<string, MatchCsvRecord>()
  for (const row of existingRows) {
    existingByIdentity.set(rowIdentityKey(row), row)
  }

  const usedExistingIds = new Set<number>()
  const nextRows: MatchCsvRecord[] = []
  let maxMatchId = existingRows.reduce((max, row) => Math.max(max, row.id), 0)
  let maxParticipantId = existingRows
    .flatMap((row) => row.participants.map((p) => p.id))
    .reduce((max, id) => Math.max(max, id), 0)

  let created = 0
  let updated = 0

  for (const generated of generatedRows) {
    const existing = existingByIdentity.get(rowIdentityKey(generated))

    if (!existing) {
      maxMatchId += 1
      const participants = generated.participants.map((p) => {
        maxParticipantId += 1
        return { ...p, id: maxParticipantId }
      })
      nextRows.push({
        ...generated,
        id: maxMatchId,
        participants,
      })
      created += 1
      continue
    }

    usedExistingIds.add(existing.id)
    const existingParticipantByIdentity = new Map<string, ParticipantSeed>()
    for (const participant of existing.participants) {
      existingParticipantByIdentity.set(participantIdentityKey(participant), participant)
    }

    const participants = generated.participants.map((participant) => {
      const hit = existingParticipantByIdentity.get(participantIdentityKey(participant))
      if (hit) {
        return { ...participant, id: hit.id }
      }
      maxParticipantId += 1
      return { ...participant, id: maxParticipantId }
    })

    const next = {
      ...generated,
      id: existing.id,
      participants,
    }

    const wasChanged =
      existing.stage !== next.stage
      || existing.scheduledStartTime !== next.scheduledStartTime
      || existing.scheduledEndTime !== next.scheduledEndTime
      || JSON.stringify(existing.participants.map((p) => ({ ...p, id: 0 })))
        !== JSON.stringify(next.participants.map((p) => ({ ...p, id: 0 })))

    if (wasChanged) updated += 1
    nextRows.push(next)
  }

  const deleted = existingRows.length - usedExistingIds.size

  return {
    rows: nextRows.sort((a, b) => a.id - b.id),
    summary: { created, updated, deleted },
  }
}

function toCsvLine(row: MatchCsvRecord) {
  return [
    String(row.id),
    String(row.eventBlockId),
    row.locationId === null ? '' : String(row.locationId),
    csvEscape(row.name),
    csvEscape(row.description),
    row.stage,
    row.status,
    row.scheduledStartTime,
    row.scheduledEndTime,
    csvEscape(row.note),
    csvEscape(JSON.stringify(row.participants)),
  ].join(',')
}

async function applyDiffToDb(rows: MatchCsvRecord[], existingRows: MatchCsvRecord[]) {
  const existingIdSet = new Set(existingRows.map((row) => row.id))
  const nextIdSet = new Set(rows.map((row) => row.id))
  const createRows = rows.filter((row) => !existingIdSet.has(row.id))
  const updateRows = rows.filter((row) => existingIdSet.has(row.id))
  const deleteIds = existingRows.filter((row) => !nextIdSet.has(row.id)).map((row) => row.id)

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select setval('match_plans_id_seq', coalesce((select max(id) from match_plans), 0), true)`
    )
    await tx.execute(
      sql`select setval('match_participants_id_seq', coalesce((select max(id) from match_participants), 0), true)`
    )

    if (deleteIds.length > 0) {
      await tx.delete(matchPlans).where(inArray(matchPlans.id, deleteIds))
    }

    for (const row of createRows) {
      await tx.insert(matchPlans).values({
        id: row.id,
        eventBlockId: row.eventBlockId,
        locationId: row.locationId,
        name: row.name,
        description: row.description || null,
        stage: row.stage,
        status: row.status as 'Waiting' | 'Playing' | 'Completed',
        scheduledStartTime: new Date(row.scheduledStartTime),
        scheduledEndTime: new Date(row.scheduledEndTime),
        note: row.note || null,
      })

      if (row.participants.length > 0) {
        await tx.insert(matchParticipants).values(
          row.participants.map((participant) => ({
            matchPlanId: row.id,
            teamId: participant.teamId,
            prereqMatchId: participant.prereqMatchId,
            prereqBlockId: participant.prereqBlockId,
            prereqRank: participant.prereqRank,
            score: participant.score,
            rank: participant.rank,
            isDisqualified: participant.isDisqualified,
          }))
        )
      }
    }

    for (const row of updateRows) {
      await tx
        .update(matchPlans)
        .set({
          eventBlockId: row.eventBlockId,
          locationId: row.locationId,
          name: row.name,
          description: row.description || null,
          stage: row.stage,
          status: row.status as 'Waiting' | 'Playing' | 'Completed',
          scheduledStartTime: new Date(row.scheduledStartTime),
          scheduledEndTime: new Date(row.scheduledEndTime),
          note: row.note || null,
        })
        .where(eq(matchPlans.id, row.id))

      await tx.delete(matchParticipants).where(eq(matchParticipants.matchPlanId, row.id))
      if (row.participants.length > 0) {
        await tx.insert(matchParticipants).values(
          row.participants.map((participant) => ({
            matchPlanId: row.id,
            teamId: participant.teamId,
            prereqMatchId: participant.prereqMatchId,
            prereqBlockId: participant.prereqBlockId,
            prereqRank: participant.prereqRank,
            score: participant.score,
            rank: participant.rank,
            isDisqualified: participant.isDisqualified,
          }))
        )
      }
    }
  })

  return {
    created: createRows.length,
    updated: updateRows.length,
    deleted: deleteIds.length,
  }
}

function extractParticipants(text: string) {
  const compact = text.replace(/\r/g, '\n')
  const lines = compact
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const firstLine = lines[0] ?? ''
  const secondLine = lines[1] ?? ''
  const matchName = firstLine === '⑦' && secondLine === '決勝戦'
    ? '⑦ 決勝'
    : firstLine
  const body = lines
    .slice(1)
    .join('')
    .replaceAll(' ', '')
    .replaceAll('決勝戦', '')
    .replaceAll('3位決定戦', '')
  if (!body) return { name: matchName, tokens: [] as string[] }

  const tokens = body
    .split(/vs|VS|ｖｓ/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)

  return { name: matchName, tokens }
}

function normalizeMatchName(name: string) {
  const compact = name.replace(/\s+/g, '')
  if (/^[A-G]-\d+/.test(compact)) return compact.match(/^[A-G]-\d+/)?.[0] ?? compact
  if (compact === '⑦決勝戦' || compact === '⑦決勝') return '⑦ 決勝'
  if (compact === '㉑決勝') return '決勝'

  const cleaned = compact
    .replace(/3位決定戦$/, '')
    .replace(/決勝戦$/, '')
    .replace(/決勝$/, '')
    .replace(/準決$/, '')

  return cleaned || compact
}

function normalizeTeamName(token: string) {
  if (token in GRADE_TO_TEAM) {
    return GRADE_TO_TEAM[token as keyof typeof GRADE_TO_TEAM]
  }
  return token
}

async function loadMasterFromDb() {
  const [eventsRows, eventBlocksRows, locationsRows, teamsRows] = await Promise.all([
    db.select({ id: events.id, name: events.name }).from(events),
    db.select({ id: eventBlocks.id, eventId: eventBlocks.eventId, name: eventBlocks.name, stage: eventBlocks.stage }).from(eventBlocks),
    db.select({ id: locations.id, name: locations.name }).from(locations),
    db.select({ id: teams.id, name: teams.name }).from(teams),
  ])

  const eventIdByName = new Map<string, number>()
  for (const row of eventsRows) {
    eventIdByName.set(row.name, row.id)
  }

  const blockByEventAndName = new Map<string, number>()
  const blockStageById = new Map<number, Stage>()
  for (const row of eventBlocksRows) {
    const id = row.id
    const eventId = row.eventId
    blockByEventAndName.set(`${eventId}:${row.name}`, id)
    blockStageById.set(id, row.stage as Stage)
  }

  const locationIdByName = new Map<string, number>()
  for (const row of locationsRows) {
    locationIdByName.set(row.name, row.id)
  }

  const teamIdByName = new Map<string, number>()
  for (const row of teamsRows) {
    teamIdByName.set(row.name, row.id)
  }

  const eventIdByBlockId = new Map<number, number>()
  for (const row of eventBlocksRows) {
    eventIdByBlockId.set(row.id, row.eventId)
  }

  return {
    eventIdByName,
    blockByEventAndName,
    blockStageById,
    locationIdByName,
    teamIdByName,
    eventIdByBlockId,
  }
}

async function loadExistingMatchesFromDb() {
  const [matches, participants] = await Promise.all([
    db
      .select({
        id: matchPlans.id,
        eventBlockId: matchPlans.eventBlockId,
        locationId: matchPlans.locationId,
        name: matchPlans.name,
        description: matchPlans.description,
        stage: matchPlans.stage,
        status: matchPlans.status,
        scheduledStartTime: matchPlans.scheduledStartTime,
        scheduledEndTime: matchPlans.scheduledEndTime,
        note: matchPlans.note,
      })
      .from(matchPlans),
    db
      .select({
        id: matchParticipants.id,
        matchPlanId: matchParticipants.matchPlanId,
        teamId: matchParticipants.teamId,
        prereqMatchId: matchParticipants.prereqMatchId,
        prereqBlockId: matchParticipants.prereqBlockId,
        prereqRank: matchParticipants.prereqRank,
        score: matchParticipants.score,
        rank: matchParticipants.rank,
        isDisqualified: matchParticipants.isDisqualified,
      })
      .from(matchParticipants),
  ])

  const participantsByMatchId = new Map<number, ParticipantSeed[]>()
  for (const participant of participants) {
    const list = participantsByMatchId.get(participant.matchPlanId) ?? []
    list.push({
      id: participant.id,
      teamId: participant.teamId,
      prereqMatchId: participant.prereqMatchId,
      prereqBlockId: participant.prereqBlockId,
      prereqRank: participant.prereqRank,
      score: participant.score,
      rank: participant.rank,
      isDisqualified: participant.isDisqualified,
    })
    participantsByMatchId.set(participant.matchPlanId, list)
  }

  return matches.map((match) => ({
    id: match.id,
    eventBlockId: match.eventBlockId,
    locationId: match.locationId,
    name: match.name ?? '',
    description: match.description ?? '',
    stage: match.stage as Stage,
    status: match.status,
    scheduledStartTime: match.scheduledStartTime.toISOString(),
    scheduledEndTime: match.scheduledEndTime.toISOString(),
    note: match.note ?? '',
    participants: (participantsByMatchId.get(match.id) ?? []).sort((a, b) => a.id - b.id),
  })) satisfies MatchCsvRecord[]
}

function resolveLocationName(venue: string, lane: string) {
  if (venue === '第一体育館' && ['A', 'B'].includes(lane)) return `第一体育館 ${lane}コート`
  if (venue === '第二体育館' && ['C', 'D'].includes(lane)) return `第二体育館 ${lane}コート`
  if (venue === '野球グラウンド' && ['A', 'B'].includes(lane)) return `野球グラウンド ${lane}`
  if (venue === 'テニスコート' && /^\d+$/.test(lane)) return `テニスコート ${lane}`
  if (venue === '陸上グラウンド') return '陸上グラウンド'
  if (venue === '第一体育館' && /^\d+$/.test(lane)) return `第一体育館 ${lane}`
  if (venue === '第二体育館' && /^\d+$/.test(lane)) return `第二体育館 ${lane}`
  if (venue === '第二体育館' && lane === 'A') return '第二体育館 1'
  if (venue === '第二体育館' && lane === 'B') return '第二体育館 2'
  return ''
}

function resolveBlockName(eventName: string, lane: string, matchName: string) {
  if (eventName === '借り人競争' || eventName === '選抜リレー') {
    if (matchName === '決勝') return '決勝'
    if (/^[1-5]年生$/.test(matchName)) return `${matchName.replace('生', '')}予選`
  }

  if (eventName === 'ソフトボール' || eventName === 'バレーボール') {
    return '本選トーナメント'
  }

  if (eventName === 'バドミントン') {
    const laneToGroup: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' }
    const group = laneToGroup[lane]
    if (group && /^[A-E]-\d+$/.test(matchName)) {
      return `予選リーグ ${group}`
    }
    return '決勝トーナメント'
  }

  if (eventName === 'ソフトテニス' || eventName === 'バスケットボール') {
    const qualifierFromName = matchName.match(/^([A-G])-\d+$/)
    if (qualifierFromName) {
      return `予選リーグ ${qualifierFromName[1]}`
    }
    return '決勝トーナメント'
  }

  return '本選トーナメント'
}

function resolveStage(matchName: string, blockStage: Stage) {
  if (matchName === '決勝' || matchName === '決勝戦') return 'FINAL'
  if (matchName.includes('3位決定戦')) return 'THIRD_PLACE'
  if (blockStage === 'QUALIFIER') return 'QUALIFIER'
  return 'ROUND_1'
}

function maybeMatchCell(text: string) {
  if (!text) return false
  if (IGNORE_CELL_WORDS.some((word) => text.includes(word))) return false
  if (text.includes('vs') || text.includes('VS') || text.includes('ｖｓ')) return true
  if (text.includes('決勝')) return true
  if (text.includes('3位決定戦')) return true
  if (/^[1-5]年生$/.test(text.trim())) return true
  return false
}

function loadReferenceStageMap(master: MasterData, rows: MatchCsvRecord[]) {
  const stageByEventAndName = new Map<string, Stage>()

  for (const row of rows) {
    const blockId = row.eventBlockId
    const eventId = master.eventIdByBlockId.get(blockId)
    if (!eventId) continue
    stageByEventAndName.set(`${eventId}:${row.name}`, row.stage as Stage)
  }

  return { stageByEventAndName }
}

export async function executeMatchesUpdate({
  inputXlsxPath = INPUT_XLSX,
  outputCsvPath = OUTPUT_CSV,
  includeRainSheets = false,
  applyDb = false,
}: {
  inputXlsxPath?: string
  outputCsvPath?: string
  includeRainSheets?: boolean
  applyDb?: boolean
} = {}) {
  const master = await loadMasterFromDb()
  const existingRows = await loadExistingMatchesFromDb()
  const { stageByEventAndName } = loadReferenceStageMap(master, existingRows)
  const workbook = XLSX.readFile(inputXlsxPath)

  const matchSeeds: MatchSeed[] = []
  let matchId = 1

  for (const sheetName of workbook.SheetNames) {
    const day = sheetName.startsWith('1日目') ? 'day1' : 'day2'
    const baseDate = BASE_DATE[day]

    if (!sheetName.includes('晴') && !(includeRainSheets && sheetName.includes('雨'))) {
      continue
    }

    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as string[][]
    const merges = (sheet['!merges'] ?? []) as Array<{ s: { r: number; c: number }; e: { r: number; c: number } }>
    const mergeEndByStart = new Map<string, number>()

    for (const merge of merges) {
      mergeEndByStart.set(`${merge.s.r}:${merge.s.c}`, merge.e.r)
    }

    const head0 = rows[0] ?? []
    const head1 = rows[1] ?? []
    const head2 = rows[2] ?? []

    let currentEvent = ''
    let currentVenue = ''

    for (let c = 1; c < head0.length - 1; c += 1) {
      if (head0[c]) currentEvent = normalizeCell(head0[c])
      if (head1[c]) currentVenue = normalizeCell(head1[c])

      const lane = normalizeCell(head2[c] ?? '')
      const eventName = EVENT_NAME_MAP[currentEvent]
      if (!eventName || !currentVenue) continue
      if (!lane && !(currentVenue === '陸上グラウンド' && (eventName === '借り人競争' || eventName === '選抜リレー'))) {
        continue
      }

      const locationName = resolveLocationName(currentVenue, lane)
      const locationId = master.locationIdByName.get(locationName)
      const eventId = master.eventIdByName.get(eventName)
      if (!locationId || !eventId) continue

      for (let r = 3; r < rows.length; r += 1) {
        const rawCell = String(rows[r]?.[c] ?? '')
        const cell = normalizeCell(rawCell)
        if (!maybeMatchCell(cell)) continue

        const startTime = normalizeCell(rows[r]?.[0] ?? '')
        const endRow = mergeEndByStart.get(`${r}:${c}`) ?? r
        const endTime = normalizeCell(rows[endRow]?.[0] ?? startTime)

        const startIso = toIso(baseDate, startTime)
        const endIso = toIso(baseDate, endTime)
        if (!startIso || !endIso) continue

        const parsed = extractParticipants(rawCell)
        const normalizedName = normalizeMatchName(parsed.name)
        const blockName = resolveBlockName(eventName, lane, parsed.name)
        const eventBlockId = master.blockByEventAndName.get(`${eventId}:${blockName}`)
        if (!eventBlockId) continue

        const blockStage = master.blockStageById.get(eventBlockId) ?? 'QUALIFIER'
        const stage = stageByEventAndName.get(`${eventId}:${normalizedName}`) ?? resolveStage(normalizedName, blockStage)

        matchSeeds.push({
          id: matchId,
          eventId,
          eventBlockId,
          locationId,
          name: normalizedName,
          stage,
          scheduledStartTime: startIso,
          scheduledEndTime: endIso,
          participantTokens: parsed.tokens,
        })
        matchId += 1
      }
    }
  }

  const filteredSeeds = matchSeeds
    .slice()
    .sort((a, b) => {
      if (a.eventBlockId !== b.eventBlockId) return a.eventBlockId - b.eventBlockId
      if (a.scheduledStartTime !== b.scheduledStartTime) return a.scheduledStartTime.localeCompare(b.scheduledStartTime)
      return a.id - b.id
    })

  const selectedSeeds: MatchSeed[] = filteredSeeds

  const matchIdByEventAndName = new Map<string, number>()
  for (const match of selectedSeeds) {
    matchIdByEventAndName.set(`${match.eventId}:${match.name}`, match.id)
  }

  let participantId = 1
  const generatedRows: MatchCsvRecord[] = []

  for (const match of selectedSeeds) {
    const participants: ParticipantSeed[] = []

    for (const tokenRaw of match.participantTokens) {
      const token = normalizeTeamName(tokenRaw)
      const teamId = master.teamIdByName.get(token)

      let prereqMatchId: number | null = null
      let prereqBlockId: number | null = null
      let prereqRank: number | null = null

      if (!teamId) {
        const winnerMatch = token.match(/^(.+)勝者$/)
        if (winnerMatch) {
          prereqMatchId = matchIdByEventAndName.get(`${match.eventId}:${winnerMatch[1]}`) ?? null
          prereqRank = 1
        }

        const leagueWinner = token.match(/^([A-G])リーグ1位$/)
        if (leagueWinner) {
          const blockName = `予選リーグ ${leagueWinner[1]}`
          prereqBlockId = master.blockByEventAndName.get(`${match.eventId}:${blockName}`) ?? null
          prereqRank = 1
        }
      }

      participants.push({
        id: participantId,
        teamId: teamId ?? null,
        prereqMatchId,
        prereqBlockId,
        prereqRank,
        score: null,
        rank: null,
        isDisqualified: false,
      })

      participantId += 1
    }

    generatedRows.push({
      id: match.id,
      eventBlockId: match.eventBlockId,
      locationId: match.locationId,
      name: match.name,
      description: '',
      stage: match.stage,
      status: 'Waiting',
      scheduledStartTime: match.scheduledStartTime,
      scheduledEndTime: match.scheduledEndTime,
      note: '',
      participants,
    })
  }

  const synced = syncWithExistingRows(generatedRows, existingRows)
  const csvRows: string[] = [
    [
      'id',
      'eventBlockId',
      'locationId',
      'name',
      'description',
      'stage',
      'status',
      'scheduledStartTime',
      'scheduledEndTime',
      'note',
      'participants',
    ].join(','),
    ...synced.rows.map(toCsvLine),
  ]

  await writeFile(outputCsvPath, `${csvRows.join('\n')}\n`, 'utf8')
  let dbSummary: null | { created: number; updated: number; deleted: number } = null
  if (applyDb) {
    dbSummary = await applyDiffToDb(synced.rows, existingRows)
  }
  return {
    selectedCount: selectedSeeds.length,
    outputCsvPath,
    diffSummary: synced.summary,
    dbSummary,
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const includeRain = process.argv.includes('--include-rain')
  const apply = process.argv.includes('--apply-db')

  executeMatchesUpdate({
    inputXlsxPath: INPUT_XLSX,
    outputCsvPath: OUTPUT_CSV,
    includeRainSheets: includeRain,
    applyDb: apply,
  })
    .then((result) => {
      console.log(
        `converted: ${result.selectedCount} matches -> ${result.outputCsvPath} (create:${result.diffSummary.created} update:${result.diffSummary.updated} delete:${result.diffSummary.deleted})`
      )
      if (result.dbSummary) {
        console.log(
          `applied to db: create:${result.dbSummary.created} update:${result.dbSummary.updated} delete:${result.dbSummary.deleted}`
        )
      }
    })
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
}
