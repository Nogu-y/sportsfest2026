import { sql } from 'drizzle-orm'
import { db } from '../client'
import {
  eventBlocks,
  events,
  locations,
  maps,
  matchParticipants,
  matchPlans,
  teams,
} from '../schema'

type CsvRow = Record<string, string>
type IdMap = Map<number, number>

type MatchParticipantSeed = {
  teamId: number | null
  prereqMatchId: number | null
  prereqBlockId: number | null
  prereqRank: number | null
  score: number | null
  rank: number | null
  isDisqualified: boolean
}

const TABLES_TO_CLEAR = [
  'match_reminder_logs',
  'watchlists',
  'scores',
  'block_rankings',
  'match_participants',
  'match_plans',
  'event_blocks',
  'events',
  'locations',
  'maps',
  'teams',
] as const

const CANDIDATE_FILES = {
  maps: 'maps',
  teams: 'teams',
  locations: 'locations',
  events: 'events',
  eventBlocks: 'eventBlocks',
  matches: 'matches',
} as const

async function loadFile(path: string) {
  const { readFile } = await import('node:fs/promises')
  return await readFile(path, 'utf8')
}

async function resolveCsvPath(baseName: string) {
  const { readdir } = await import('node:fs/promises')
  const candidateDirs = ['apps/api/data-rows', 'data-rows']

  for (const dir of candidateDirs) {
    let files: string[] = []
    try {
      files = await readdir(dir)
    } catch {
      continue
    }

    const exact = `${baseName}.csv`
    const matched = files.includes(exact)
      ? exact
      : files.find((item) => item.startsWith(baseName) && item.endsWith('.csv'))

    if (matched) {
      return `${dir}/${matched}`
    }
  }

  throw new Error(`CSVファイルが見つかりません: ${baseName}.csv`)
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = []
  let currentCell = ''
  let currentRow: string[] = []
  let inQuote = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    const next = text[i + 1]

    if (ch === '"') {
      if (inQuote && next === '"') {
        currentCell += '"'
        i += 1
      } else {
        inQuote = !inQuote
      }
      continue
    }

    if (!inQuote && ch === ',') {
      currentRow.push(currentCell)
      currentCell = ''
      continue
    }

    if (!inQuote && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i += 1
      currentRow.push(currentCell)
      currentCell = ''
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
      continue
    }

    currentCell += ch
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell)
    rows.push(currentRow)
  }

  if (rows.length < 2) return []

  const [header, ...body] = rows
  return body.map((line) => {
    const row: CsvRow = {}
    for (let i = 0; i < header.length; i += 1) {
      row[header[i]] = line[i] ?? ''
    }
    return row
  })
}

function toNumber(value: string) {
  return Number.parseInt(value, 10)
}

function toNullableNumber(value: string | undefined) {
  if (!value || value === 'null') return null
  return Number.parseInt(value, 10)
}

function toNullableText(value: string | undefined) {
  if (!value || value === 'null') return null
  return value
}

function toBoolean(value: string | undefined) {
  return value === 'true'
}

function parseParticipants(raw: string): MatchParticipantSeed[] {
  if (!raw) return []
  const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
  return parsed.map((item) => ({
    teamId: typeof item.teamId === 'number' ? item.teamId : null,
    prereqMatchId: typeof item.prereqMatchId === 'number' ? item.prereqMatchId : null,
    prereqBlockId: typeof item.prereqBlockId === 'number' ? item.prereqBlockId : null,
    prereqRank: typeof item.prereqRank === 'number' ? item.prereqRank : null,
    score: typeof item.score === 'number' ? item.score : null,
    rank: typeof item.rank === 'number' ? item.rank : null,
    isDisqualified: item.isDisqualified === true,
  }))
}

function requiredNewId(map: IdMap, oldId: number, label: string) {
  const nextId = map.get(oldId)
  if (!nextId) throw new Error(`参照IDの解決に失敗しました: ${label} old=${oldId}`)
  return nextId
}

async function clearExistingTables(executor: { execute: typeof db.execute }) {
  const tableNameParams = TABLES_TO_CLEAR.map((name) => sql`${name}`)
  const tableNameRows = await executor.execute<{ table_name: string }>(
    sql`SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (${sql.join(tableNameParams, sql`, `)})`
  )

  const existingNames = tableNameRows.map((row) => row.table_name)
  if (existingNames.length === 0) return

  // 取得元は information_schema のため、識別子としてそのまま連結する。
  const tableList = existingNames.map((name) => `"${name}"`).join(', ')
  await executor.execute(sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`))
}

async function main() {
  const csvPaths = {
    maps: await resolveCsvPath(CANDIDATE_FILES.maps),
    teams: await resolveCsvPath(CANDIDATE_FILES.teams),
    locations: await resolveCsvPath(CANDIDATE_FILES.locations),
    events: await resolveCsvPath(CANDIDATE_FILES.events),
    eventBlocks: await resolveCsvPath(CANDIDATE_FILES.eventBlocks),
    matches: await resolveCsvPath(CANDIDATE_FILES.matches),
  }

  const mapsRows = parseCsv(await loadFile(csvPaths.maps))
  const teamsRows = parseCsv(await loadFile(csvPaths.teams))
  const locationsRows = parseCsv(await loadFile(csvPaths.locations))
  const eventsRows = parseCsv(await loadFile(csvPaths.events))
  const eventBlocksRows = parseCsv(await loadFile(csvPaths.eventBlocks))
  const matchesRows = parseCsv(await loadFile(csvPaths.matches))

  const mapIdMap = new Map<number, number>()
  const teamIdMap = new Map<number, number>()
  const locationIdMap = new Map<number, number>()
  const eventIdMap = new Map<number, number>()
  const eventBlockIdMap = new Map<number, number>()
  const matchIdMap = new Map<number, number>()

  await db.transaction(async (tx) => {
    await clearExistingTables(tx)

    for (const row of mapsRows) {
      const oldId = toNumber(row.id)
      const [inserted] = await tx.insert(maps).values({
        filePath: row.filePath,
        displayName: row.displayName,
        width: toNumber(row.width),
        height: toNumber(row.height),
        day: row.day as 'day1' | 'day2' | 'both',
      }).returning({ id: maps.id })
      mapIdMap.set(oldId, inserted.id)
    }

    for (const row of teamsRows) {
      const oldId = toNumber(row.id)
      const [inserted] = await tx.insert(teams).values({
        name: row.name,
      }).returning({ id: teams.id })
      teamIdMap.set(oldId, inserted.id)
    }

    for (const row of locationsRows) {
      const oldId = toNumber(row.id)
      const [inserted] = await tx.insert(locations).values({
        mapId: requiredNewId(mapIdMap, toNumber(row.mapId), 'locations.mapId'),
        name: row.name,
        day: row.day as 'day1' | 'day2' | 'both',
        xRatio: toNumber(row.xRatio),
        yRatio: toNumber(row.yRatio),
      }).returning({ id: locations.id })
      locationIdMap.set(oldId, inserted.id)
    }

    for (const row of eventsRows) {
      const oldId = toNumber(row.id)
      const [inserted] = await tx.insert(events).values({
        name: row.name,
        description: toNullableText(row.description),
        color: toNullableText(row.color),
        ruleMd: toNullableText(row.ruleMd),
        rankingOrder: row.rankingOrder as 'ASC' | 'DESC',
        format: row.format as 'TOURNAMENT' | 'LEAGUE_TO_TOURNAMENT' | 'HEATS_AND_FINAL',
        pointAllocation: JSON.parse(row.pointAllocation),
        isCompleted: toBoolean(row.isCompleted),
      }).returning({ id: events.id })
      eventIdMap.set(oldId, inserted.id)
    }

    for (const row of eventBlocksRows) {
      const oldId = toNumber(row.id)
      const [inserted] = await tx.insert(eventBlocks).values({
        eventId: requiredNewId(eventIdMap, toNumber(row.eventId), 'eventBlocks.eventId'),
        name: row.name,
        type: row.type as 'LEAGUE' | 'TOURNAMENT' | 'CUMULATIVE' | 'SINGLE',
        stage: row.stage as 'FINAL' | 'THIRD_PLACE' | 'SEMIFINAL' | 'QUARTERFINAL' | 'ROUND_2' | 'ROUND_1' | 'QUALIFIER' | 'CONSOLATION',
      }).returning({ id: eventBlocks.id })
      eventBlockIdMap.set(oldId, inserted.id)
    }

    for (const row of matchesRows) {
      const oldId = toNumber(row.id)
      const [insertedMatch] = await tx.insert(matchPlans).values({
        eventBlockId: requiredNewId(eventBlockIdMap, toNumber(row.eventBlockId), 'matches.eventBlockId'),
        locationId: row.locationId ? requiredNewId(locationIdMap, toNumber(row.locationId), 'matches.locationId') : null,
        name: toNullableText(row.name),
        description: toNullableText(row.description),
        stage: row.stage as 'FINAL' | 'THIRD_PLACE' | 'SEMIFINAL' | 'QUARTERFINAL' | 'ROUND_2' | 'ROUND_1' | 'QUALIFIER' | 'CONSOLATION',
        status: row.status as 'Waiting' | 'Preparing' | 'Playing' | 'Finished' | 'Completed' | 'Cancelled',
        scheduledStartTime: new Date(row.scheduledStartTime),
        scheduledEndTime: new Date(row.scheduledEndTime),
        note: toNullableText(row.note),
      }).returning({ id: matchPlans.id })
      matchIdMap.set(oldId, insertedMatch.id)
    }

    for (const row of matchesRows) {
      const participants = parseParticipants(row.participants)
      const matchPlanId = requiredNewId(matchIdMap, toNumber(row.id), 'participants.matchPlanId')

      if (participants.length === 0) continue

      await tx.insert(matchParticipants).values(
        participants.map((participant) => ({
          matchPlanId,
          teamId: participant.teamId ? requiredNewId(teamIdMap, participant.teamId, 'participants.teamId') : null,
          prereqMatchId: participant.prereqMatchId
            ? requiredNewId(matchIdMap, participant.prereqMatchId, 'participants.prereqMatchId')
            : null,
          prereqBlockId: participant.prereqBlockId
            ? requiredNewId(eventBlockIdMap, participant.prereqBlockId, 'participants.prereqBlockId')
            : null,
          prereqRank: participant.prereqRank,
          score: participant.score,
          rank: participant.rank,
          isDisqualified: participant.isDisqualified,
        }))
      )
    }
  })

  console.log('Rows data imported successfully')
}

main().catch((error) => {
  console.error('Failed to import rows data')
  console.error(error)
  process.exit(1)
})
