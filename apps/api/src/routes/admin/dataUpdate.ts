import { OpenAPIHono } from '@hono/zod-openapi'
import { eq, inArray, sql } from 'drizzle-orm'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { db } from '../../db/client'
import { matchParticipants, matchPlans } from '../../db/schema'
import { executeMatchesUpdate } from '../../scripts/matches/convertExcelToMatchesCsv'

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

function parseCsv(text: string): Record<string, string>[] {
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
    const row: Record<string, string> = {}
    for (let i = 0; i < header.length; i += 1) {
      row[header[i]] = line[i] ?? ''
    }
    return row
  })
}

function parseParticipants(raw: string) {
  if (!raw) return [] as ParticipantSeed[]

  const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
  return parsed.map((item) => ({
    id: typeof item.id === 'number' ? item.id : 0,
    teamId: typeof item.teamId === 'number' ? item.teamId : null,
    prereqMatchId: typeof item.prereqMatchId === 'number' ? item.prereqMatchId : null,
    prereqBlockId: typeof item.prereqBlockId === 'number' ? item.prereqBlockId : null,
    prereqRank: typeof item.prereqRank === 'number' ? item.prereqRank : null,
    score: typeof item.score === 'number' ? item.score : null,
    rank: typeof item.rank === 'number' ? item.rank : null,
    isDisqualified: item.isDisqualified === true,
  }))
}

function toCsvRecords(text: string): MatchCsvRecord[] {
  const rows = parseCsv(text)
  return rows.map((row) => ({
    id: Number(row.id),
    eventBlockId: Number(row.eventBlockId),
    locationId: row.locationId === '' ? null : Number(row.locationId),
    name: row.name ?? '',
    description: row.description ?? '',
    stage: row.stage as Stage,
    status: row.status ?? 'Waiting',
    scheduledStartTime: row.scheduledStartTime,
    scheduledEndTime: row.scheduledEndTime,
    note: row.note ?? '',
    participants: parseParticipants(row.participants),
  }))
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

async function applyRowsToDb(rows: MatchCsvRecord[], existingRows: MatchCsvRecord[]) {
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

export const adminDataUpdateRoutes = new OpenAPIHono()
  .post('/excel/convert-csv', async (c) => {
    try {
      const body = await c.req.parseBody()
      const file = body.file
      if (!(file instanceof File)) {
        return c.json({ message: 'Excelファイル(file)が必要です' }, 400)
      }

      const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sportsfest-excel-'))
      const inputPath = path.join(tempDir, file.name || 'input.xlsx')
      const outputPath = path.join(tempDir, 'matches.converted.csv')

      await writeFile(inputPath, Buffer.from(await file.arrayBuffer()))
      await executeMatchesUpdate({
        inputXlsxPath: inputPath,
        outputCsvPath: outputPath,
        applyDb: false,
      })
      const csv = await readFile(outputPath, 'utf8')
      await rm(tempDir, { recursive: true, force: true })

      return c.json({ csv, message: 'ExcelからCSVを生成しました' }, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'ExcelからCSVへの変換に失敗しました' }, 500)
    }
  })
  .post('/excel/apply-diff', async (c) => {
    try {
      const body = await c.req.parseBody()
      const file = body.file
      if (!(file instanceof File)) {
        return c.json({ message: 'Excelファイル(file)が必要です' }, 400)
      }

      const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sportsfest-excel-'))
      const inputPath = path.join(tempDir, file.name || 'input.xlsx')
      const outputPath = path.join(tempDir, 'matches.converted.csv')

      await writeFile(inputPath, Buffer.from(await file.arrayBuffer()))
      const result = await executeMatchesUpdate({
        inputXlsxPath: inputPath,
        outputCsvPath: outputPath,
        applyDb: true,
      })
      await rm(tempDir, { recursive: true, force: true })

      return c.json({ message: 'Excel差分をDBへ適用しました', summary: result }, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'Excel差分のDB適用に失敗しました' }, 500)
    }
  })
  .post('/csv/apply-diff', async (c) => {
    try {
      const body = await c.req.parseBody()
      const file = body.file
      if (!(file instanceof File)) {
        return c.json({ message: 'CSVファイル(file)が必要です' }, 400)
      }

      const csvText = Buffer.from(await file.arrayBuffer()).toString('utf8')
      const targetRows = toCsvRecords(csvText)
      const existingRows = await loadExistingMatchesFromDb()
      const summary = await applyRowsToDb(targetRows, existingRows)

      return c.json({ message: 'CSV差分をDBへ適用しました', summary }, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: 'CSV差分のDB適用に失敗しました' }, 500)
    }
  })

export type AdminDataUpdateRoutes = typeof adminDataUpdateRoutes
