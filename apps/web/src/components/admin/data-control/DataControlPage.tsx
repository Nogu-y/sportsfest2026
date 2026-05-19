'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'
import { EventBracket } from '../../bracket/EventBracket'
import { LeagueTable } from '../../bracket/LeagueTable'
import { TournamentTable } from '../../bracket/TournamentTable'
import { matchStageOptions } from '../create/constants'
import {
  createAdminResourceDefinitions,
  fetchAdminMasterOptions,
} from './resourceDefinitions'
import {
  downloadTextFile,
  exportRecordsAsCsv,
  exportRecordsAsJson,
  inferImportFormatFromText,
  parseImportedRecords,
} from './utils'
import type {
  DataControlField,
  DataControlImportFormat,
  DataControlRecord,
  DataControlResourceDefinition,
  DataControlValue,
} from './types'

type RecordFormProps = {
  resourceKey: string
  fields: DataControlField[]
  value: Record<string, DataControlValue>
  submitLabel: string
  onChange: (key: string, value: DataControlValue) => void
  onSubmit: () => void
  onCancel?: () => void
  successMessage?: string | null
}

type PointAllocationRow = {
  id: number
  scope: 'MATCH' | 'BLOCK'
  stage: string
  rank: number
  points: number
}

type MatchParticipantRow = {
  id: number
  teamId: number | null
  prereqMatchId: number | null
  prereqBlockId: number | null
  prereqRank: number | null
}

function MatchesPreviewByEvent({
  eventId,
  activeBlockId,
  previewData,
}: {
  eventId: number
  activeBlockId: number | null
  previewData: {
    events: PublicMasterResponse['events']
    eventBlocks: PublicMasterResponse['blocks']
    matches: PublicMasterResponse['matches']
    teams: PublicMasterResponse['teams']
  }
}) {
  const event = previewData.events.find((item) => item.id === eventId) ?? null
  const blocks = previewData.eventBlocks.filter((block) => block.eventId === eventId)

  if (!event || blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
        このイベントには表示できる対戦表がありません
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-600">イベント全体プレビュー</p>
        <p className="mt-1 text-sm text-slate-500">
          {event.name} / {blocks.length} ブロック
        </p>
      </div>

      <div className="grid gap-6">
        {blocks.map((block) => {
          const isActiveBlock = activeBlockId === block.id

          return (
            <section
              key={block.id}
              className={
                isActiveBlock
                  ? 'rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-sm'
                  : 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
              }
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{block.name}</h3>
                  <p className="text-sm text-slate-500">
                    {block.type} / {block.stage}
                  </p>
                </div>
                {isActiveBlock ? (
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                    編集対象ブロック
                  </span>
                ) : null}
              </div>

              {block.type === 'LEAGUE' ? (
                <LeagueTable
                  block={block}
                  previewData={{
                    matches: previewData.matches,
                    teams: previewData.teams,
                  }}
                />
              ) : null}

              {block.type === 'TOURNAMENT' ? (
                <TournamentTable
                  block={block}
                  previewData={{
                    matches: previewData.matches,
                    teams: previewData.teams,
                    eventBlocks: previewData.eventBlocks,
                  }}
                />
              ) : null}

              {block.type === 'CUMULATIVE' || block.type === 'SINGLE' ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  このブロック種別の対戦表プレビューは未対応です
                </div>
              ) : null}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function toDisplayValue(value: DataControlValue) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function resolveReferenceLabel(
  field: DataControlField,
  value: DataControlValue,
  masterData: PublicMasterResponse | null,
) {
  if (typeof value !== 'string' && typeof value !== 'number') return null

  const matchedOption = field.options?.find((option) => option.value === value)
  if (matchedOption) {
    return matchedOption.label
  }

  if (!masterData || typeof value !== 'number') return null

  switch (field.key) {
    case 'mapId':
      return masterData.maps.find((item) => item.id === value)?.displayName ?? null
    case 'eventId':
      return masterData.events.find((item) => item.id === value)?.name ?? null
    case 'locationId':
      return masterData.locations.find((item) => item.id === value)?.name ?? null
    case 'teamId':
      return masterData.teams.find((item) => item.id === value)?.name ?? null
    case 'eventBlockId': {
      const block = masterData.blocks.find((item) => item.id === value)
      if (!block) return null
      const eventName = masterData.events.find((item) => item.id === block.eventId)?.name
      return eventName ? `${eventName} / ${block.name}` : block.name
    }
    case 'prereqMatchId': {
      const match = masterData.matches.find((item) => item.id === value)
      if (!match) return null
      return match.name ?? '名称未設定'
    }
    case 'prereqBlockId': {
      const block = masterData.blocks.find((item) => item.id === value)
      if (!block) return null
      const eventName = masterData.events.find((item) => item.id === block.eventId)?.name
      return eventName ? `${eventName} / ${block.name}` : block.name
    }
    default:
      return null
  }
}

function renderTableCellValue(
  field: DataControlField,
  value: DataControlValue,
  masterData: PublicMasterResponse | null,
) {
  const referenceLabel = resolveReferenceLabel(field, value, masterData)
  const rawValue = toDisplayValue(value ?? null)

  if (!referenceLabel) {
    return rawValue
  }

  if (referenceLabel === rawValue || referenceLabel.startsWith(`${rawValue}: `)) {
    return referenceLabel
  }

  return (
    <div className="flex flex-col">
      <span>{rawValue}</span>
      <span className="text-xs text-slate-500">{referenceLabel}</span>
    </div>
  )
}

function formatDateTimeLocalValue(value: DataControlValue) {
  if (typeof value !== 'string' || value === '') return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function getInitialDraft(fields: DataControlField[]) {
  return fields.reduce<Record<string, DataControlValue>>((acc, field) => {
    if (field.readOnly) return acc

    if (field.defaultValue !== undefined) {
      acc[field.key] = field.defaultValue
      return acc
    }

    if (field.type === 'boolean') {
      acc[field.key] = false
      return acc
    }

    if (field.type === 'json') {
      acc[field.key] = {}
      return acc
    }

    acc[field.key] = field.nullable ? null : ''
    return acc
  }, {})
}

function normalizeDraftValue(field: DataControlField, rawValue: string) {
  if (field.type === 'number') {
    if (rawValue === '') return field.nullable ? null : ''
    return Number(rawValue)
  }

  if (field.type === 'boolean') {
    return rawValue === 'true'
  }

  if (field.type === 'select') {
    if (rawValue === '') return field.nullable ? null : ''
    const numericValue = Number(rawValue)
    return Number.isNaN(numericValue) ? rawValue : numericValue
  }

  if (field.type === 'datetime') {
    if (rawValue === '') return field.nullable ? null : ''
    return new Date(rawValue).toISOString()
  }

  if (field.type === 'json') {
    return rawValue
  }

  if (rawValue === '' && field.nullable) return null
  return rawValue
}

function buildRecordDraft(fields: DataControlField[], record: DataControlRecord) {
  return fields.reduce<Record<string, DataControlValue>>((acc, field) => {
    if (record[field.key] !== undefined) {
      acc[field.key] = record[field.key]
      return acc
    }

    if (field.defaultValue !== undefined) {
      acc[field.key] = field.defaultValue
      return acc
    }

    acc[field.key] = field.type === 'boolean' ? false : ''
    return acc
  }, {})
}

function validateDraft(fields: DataControlField[], draft: Record<string, DataControlValue>) {
  const missingField = fields.find((field) => {
    if (field.readOnly || !field.required) return false
    const value = draft[field.key]
    return value === '' || value === null || value === undefined
  })

  if (missingField) {
    throw new Error(`${missingField.label} は必須です`)
  }
}

const circledNumberLabels = [
  '',
  '①',
  '②',
  '③',
  '④',
  '⑤',
  '⑥',
  '⑦',
  '⑧',
  '⑨',
  '⑩',
  '⑪',
  '⑫',
  '⑬',
  '⑭',
  '⑮',
  '⑯',
  '⑰',
  '⑱',
  '⑲',
  '⑳',
]

function convertToCircledNumber(rawValue: string) {
  const normalized = rawValue.trim()
  if (!/^[0-9]+$/.test(normalized)) return null

  const numericValue = Number(normalized)
  if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue >= circledNumberLabels.length) {
    return null
  }

  return circledNumberLabels[numericValue]
}

function prepareDraftForSubmit(fields: DataControlField[], draft: Record<string, DataControlValue>) {
  return fields.reduce<Record<string, DataControlValue>>((acc, field) => {
    const rawValue = draft[field.key]

    if (rawValue === undefined) return acc

    if (field.type === 'json' && typeof rawValue === 'string') {
      const normalized = rawValue.trim()
      acc[field.key] = normalized === '' ? (field.nullable ? null : {}) : JSON.parse(normalized)
      return acc
    }

    acc[field.key] = rawValue
    return acc
  }, {})
}

function buildCreateDraftAfterSubmit(
  resourceKey: string,
  fields: DataControlField[],
  currentDraft: Record<string, DataControlValue>,
) {
  if (resourceKey !== 'matches') {
    return currentDraft
  }

  const nextDraft = { ...currentDraft }
  const locationField = fields.find((field) => field.key === 'locationId')
  const participantsField = fields.find((field) => field.key === 'participants')

  nextDraft.locationId = locationField?.nullable ? null : ''
  nextDraft.participants =
    participantsField?.defaultValue !== undefined
      ? participantsField.defaultValue
      : []

  return nextDraft
}

function sortRecords(records: DataControlRecord[], primaryKey: string) {
  return [...records].sort((left, right) => {
    const leftValue = left[primaryKey]
    const rightValue = right[primaryKey]

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return leftValue - rightValue
    }

    return String(leftValue ?? '').localeCompare(String(rightValue ?? ''))
  })
}

function parsePointAllocationRows(value: DataControlValue): PointAllocationRow[] {
  let source = value

  if (typeof value === 'string') {
    try {
      source = JSON.parse(value) as DataControlValue
    } catch {
      return []
    }
  }

  if (!source || typeof source !== 'object' || Array.isArray(source)) return []

  const rows: PointAllocationRow[] = []
  let currentId = 1

  for (const scope of ['MATCH', 'BLOCK'] as const) {
    const stages = source[scope]
    if (!stages || typeof stages !== 'object' || Array.isArray(stages)) continue

    for (const [stage, allocations] of Object.entries(stages)) {
      if (!allocations || typeof allocations !== 'object' || Array.isArray(allocations)) continue

      for (const [label, points] of Object.entries(allocations)) {
        const rank = Number(label)
        if (!Number.isInteger(rank) || rank < 1) continue

        rows.push({
          id: currentId,
          scope,
          stage,
          rank,
          points: Number(points) || 0,
        })
        currentId += 1
      }
    }
  }

  return rows
}

function buildPointAllocationValue(rows: PointAllocationRow[]) {
  return rows.reduce<Record<string, Record<string, Record<string, number>>>>((acc, row) => {
    acc[row.scope] ??= {}
    acc[row.scope][row.stage] ??= {}
    acc[row.scope][row.stage][String(row.rank)] = row.points
    return acc
  }, {})
}

function PointAllocationEditor({
  value,
  onChange,
}: {
  value: DataControlValue
  onChange: (value: DataControlValue) => void
}) {
  const rows = useMemo(() => parsePointAllocationRows(value), [value])
  const [draft, setDraft] = useState<PointAllocationRow>({
    id: 0,
    scope: 'MATCH',
    stage: 'FINAL',
    rank: 1,
    points: 0,
  })

  const isJsonInvalid = typeof value === 'string' && rows.length === 0 && value.trim() !== ''

  function updateRows(nextRows: PointAllocationRow[]) {
    onChange(buildPointAllocationValue(nextRows))
  }

  function addRow() {
    if (!Number.isInteger(draft.rank) || draft.rank < 1) return
    const nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
    updateRows([...rows, { ...draft, id: nextId }])
    setDraft((current) => ({ ...current, rank: 1, points: 0 }))
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={draft.scope}
          onChange={(event) => setDraft((current) => ({ ...current, scope: event.target.value as PointAllocationRow['scope'] }))}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="MATCH">MATCH</option>
          <option value="BLOCK">BLOCK</option>
        </select>
        <select
          value={draft.stage}
          onChange={(event) => setDraft((current) => ({ ...current, stage: event.target.value }))}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {resourceMatchStageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={draft.rank}
          onChange={(event) => setDraft((current) => ({ ...current, rank: Number(event.target.value) || 1 }))}
          className="w-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={draft.points}
          onChange={(event) => setDraft((current) => ({ ...current, points: Number(event.target.value) || 0 }))}
          className="w-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button type="button" onClick={addRow} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          行追加
        </button>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="border-b border-slate-200 px-2 py-2">種別</th>
                <th className="border-b border-slate-200 px-2 py-2">ステージ</th>
                <th className="border-b border-slate-200 px-2 py-2">順位</th>
                <th className="border-b border-slate-200 px-2 py-2">点数</th>
                <th className="border-b border-slate-200 px-2 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border-b border-slate-200 px-2 py-2">{row.scope}</td>
                  <td className="border-b border-slate-200 px-2 py-2">{row.stage}</td>
                  <td className="border-b border-slate-200 px-2 py-2">{row.rank}位</td>
                  <td className="border-b border-slate-200 px-2 py-2">{row.points}</td>
                  <td className="border-b border-slate-200 px-2 py-2">
                    <button type="button" onClick={() => updateRows(rows.filter((item) => item.id !== row.id))} className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700">
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
          まだ得点配分がありません
        </div>
      )}

      {isJsonInvalid ? (
        <p className="mt-3 text-sm text-rose-700">JSON が壊れているため GUI に展開できません。下の JSON を修正してください。</p>
      ) : null}
    </div>
  )
}

function parseParticipants(value: DataControlValue): MatchParticipantRow[] {
  let source = value

  if (typeof value === 'string') {
    try {
      source = JSON.parse(value) as DataControlValue
    } catch {
      return []
    }
  }

  if (!Array.isArray(source)) return []

  return source
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .map((item, index) => {
      const record = item as Record<string, unknown>
      return {
        id: index + 1,
        teamId: typeof record.teamId === 'number' ? record.teamId : null,
        prereqMatchId: typeof record.prereqMatchId === 'number' ? record.prereqMatchId : null,
        prereqBlockId: typeof record.prereqBlockId === 'number' ? record.prereqBlockId : null,
        prereqRank: typeof record.prereqRank === 'number' ? record.prereqRank : null,
      }
    })
}

function buildParticipantsValue(rows: MatchParticipantRow[]) {
  return rows.map((row) => ({
    teamId: row.teamId,
    prereqMatchId: row.prereqMatchId,
    prereqBlockId: row.prereqBlockId,
    prereqRank: row.prereqRank,
  }))
}

function toNullableNumber(rawValue: string) {
  if (rawValue === '') return null
  const value = Number(rawValue)
  return Number.isNaN(value) ? null : value
}

function ParticipantsEditor({
  field,
  value,
  onChange,
}: {
  field: DataControlField
  value: DataControlValue
  onChange: (value: DataControlValue) => void
}) {
  const rows = useMemo(() => parseParticipants(value), [value])
  const [draft, setDraft] = useState<Omit<MatchParticipantRow, 'id'>>({
    teamId: null,
    prereqMatchId: null,
    prereqBlockId: null,
    prereqRank: null,
  })
  const isJsonInvalid = typeof value === 'string' && rows.length === 0 && value.trim() !== ''

  function updateRows(nextRows: MatchParticipantRow[]) {
    onChange(buildParticipantsValue(nextRows))
  }

  const hasSource = draft.teamId !== null || draft.prereqMatchId !== null || draft.prereqBlockId !== null
  const isPrereqBlockMode = draft.prereqBlockId !== null
  const isReadyToAdd = hasSource && (!isPrereqBlockMode || (draft.prereqRank !== null && draft.prereqRank >= 1))

  function addRow() {
    if (!isReadyToAdd) return
    const nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
    updateRows([...rows, { id: nextId, ...draft }])
    setDraft({ teamId: null, prereqMatchId: null, prereqBlockId: null, prereqRank: null })
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-2 md:grid-cols-4">
        <select
          value={draft.teamId ?? ''}
          onChange={(event) => setDraft((current) => {
            const teamId = toNullableNumber(event.target.value)
            return teamId === null
              ? { ...current, teamId: null }
              : { teamId, prereqMatchId: null, prereqBlockId: null, prereqRank: null }
          })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">teamId(未設定)</option>
          {field.participantTeamOptions?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={draft.prereqMatchId ?? ''}
          onChange={(event) => setDraft((current) => {
            const prereqMatchId = toNullableNumber(event.target.value)
            return prereqMatchId === null
              ? { ...current, prereqMatchId: null }
              : { teamId: null, prereqMatchId, prereqBlockId: null, prereqRank: null }
          })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">prereqMatchId(未設定)</option>
          {field.participantPrereqMatchOptions?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={draft.prereqBlockId ?? ''}
          onChange={(event) => setDraft((current) => {
            const prereqBlockId = toNullableNumber(event.target.value)
            return prereqBlockId === null
              ? { ...current, prereqBlockId: null, prereqRank: null }
              : { teamId: null, prereqMatchId: null, prereqBlockId, prereqRank: current.prereqRank && current.prereqRank >= 1 ? current.prereqRank : 1 }
          })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">prereqBlockId(未設定)</option>
          {field.participantPrereqBlockOptions?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <input
          type="number"
          value={draft.prereqRank ?? ''}
          placeholder="prereqRank"
          onChange={(event) => setDraft((current) => ({ ...current, prereqRank: (() => { const next = toNullableNumber(event.target.value); return next !== null && next >= 1 ? next : null })() }))}
          disabled={!isPrereqBlockMode}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div className="mt-2 grid gap-2">
        <button type="button" onClick={addRow} disabled={!isReadyToAdd} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
          参加枠を追加
        </button>
      </div>
      {rows.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="border-b border-slate-200 px-2 py-2">teamId</th>
                <th className="border-b border-slate-200 px-2 py-2">prereqMatchId</th>
                <th className="border-b border-slate-200 px-2 py-2">prereqBlockId</th>
                <th className="border-b border-slate-200 px-2 py-2">prereqRank</th>
                <th className="border-b border-slate-200 px-2 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border-b border-slate-200 px-2 py-2">{row.teamId ?? '-'}</td>
                  <td className="border-b border-slate-200 px-2 py-2">{row.prereqMatchId ?? '-'}</td>
                  <td className="border-b border-slate-200 px-2 py-2">{row.prereqBlockId ?? '-'}</td>
                  <td className="border-b border-slate-200 px-2 py-2">{row.prereqRank ?? '-'}</td>
                  <td className="border-b border-slate-200 px-2 py-2">
                    <button type="button" onClick={() => updateRows(rows.filter((item) => item.id !== row.id))} className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700">
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
          まだ参加枠がありません
        </div>
      )}
      {isJsonInvalid ? (
        <p className="mt-3 text-sm text-rose-700">JSON が壊れているため GUI に展開できません。JSON を修正してください。</p>
      ) : null}
    </div>
  )
}

const resourceMatchStageOptions = matchStageOptions

function ReferenceSelectField({
  field,
  currentValue,
  onChange,
}: {
  field: DataControlField
  currentValue: DataControlValue
  onChange: (key: string, value: DataControlValue) => void
}) {
  const hasOptions = Boolean(field.options?.length)
  const matchesOption = field.options?.some((option) => option.value === currentValue) ?? false
  const [inputMode, setInputMode] = useState<'preset' | 'manual'>(
    hasOptions && matchesOption ? 'preset' : hasOptions ? 'preset' : 'manual',
  )

  return (
    <div className="flex flex-col gap-2 text-sm text-slate-700">
      <span className="font-medium">{field.label}</span>
      {field.allowCustomValue ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!hasOptions} onClick={() => setInputMode('preset')} className={inputMode === 'preset' ? 'rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50' : 'rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50'}>
            候補から選択
          </button>
          <button type="button" onClick={() => setInputMode('manual')} className={inputMode === 'manual' ? 'rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white' : 'rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700'}>
            手入力
          </button>
        </div>
      ) : null}

      {field.allowCustomValue && inputMode === 'manual' ? (
        <input
          type={field.customValueType === 'number' ? 'number' : 'text'}
          value={toDisplayValue(currentValue)}
          placeholder={field.customValuePlaceholder}
          onChange={(event) =>
            onChange(
              field.key,
              normalizeDraftValue(
                {
                  ...field,
                  type: field.customValueType === 'number' ? 'number' : 'text',
                },
                event.target.value,
              ),
            )
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
      ) : (
        <select
          value={toDisplayValue(currentValue)}
          onChange={(event) => onChange(field.key, normalizeDraftValue(field, event.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          disabled={field.allowCustomValue ? !hasOptions : false}
        >
          <option value="">{hasOptions ? '選択してください' : '候補を取得できませんでした'}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )}

      {field.allowCustomValue ? (
        <p className="text-xs text-slate-500">
          {inputMode === 'manual'
            ? field.customValueLabel ?? 'IDを直接入力できます'
            : hasOptions
              ? 'DB から取得した候補を使えます'
              : '候補の取得に失敗したため手入力を使ってください'}
        </p>
      ) : null}
    </div>
  )
}

function FieldDescription({ field }: { field: DataControlField }) {
  if (!field.description) return null

  return <p className="text-xs text-slate-500">{field.description}</p>
}

function MatchNameField({
  field,
  currentValue,
  onChange,
}: {
  field: DataControlField
  currentValue: DataControlValue
  onChange: (key: string, value: DataControlValue) => void
}) {
  const [circledInput, setCircledInput] = useState('')
  const circledNumber = convertToCircledNumber(circledInput)

  function handleInsert() {
    if (!circledNumber) return

    const baseName = typeof currentValue === 'string' ? currentValue : ''
    onChange(field.key, `${baseName}${circledNumber}`)
    setCircledInput('')
  }

  return (
    <div className="flex flex-col gap-2 text-sm text-slate-700">
      <span className="font-medium">{field.label}</span>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={toDisplayValue(currentValue)}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.key, normalizeDraftValue(field, event.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-600">
            番号を入れて右のボタンを押すと、丸数字を試合名の末尾に追加します。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={1}
              max={20}
              value={circledInput}
              placeholder="例: 1"
              onChange={(event) => setCircledInput(event.target.value)}
              className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <button
              type="button"
              onClick={handleInsert}
              disabled={!circledNumber}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {circledNumber ? `${circledNumber} を追加` : '丸数字を追加'}
            </button>
          </div>
        </div>
      </div>
      <FieldDescription field={field} />
    </div>
  )
}

function RecordForm({
  resourceKey,
  fields,
  value,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
  successMessage,
}: RecordFormProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => {
          const currentValue = value[field.key] ?? ''

          if (field.readOnly) {
            return (
              <label key={field.key} className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-medium">{field.label}</span>
                <input
                  value={toDisplayValue(currentValue)}
                  disabled
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500"
                />
              </label>
            )
          }

          if (field.type === 'boolean') {
            return (
              <label key={field.key} className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-medium">{field.label}</span>
                <select
                  value={String(Boolean(currentValue))}
                  onChange={(event) => onChange(field.key, normalizeDraftValue(field, event.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
                <FieldDescription field={field} />
              </label>
            )
          }

          if (field.type === 'select') {
            return field.allowCustomValue ? (
              <div key={field.key} className="flex flex-col gap-2">
                <ReferenceSelectField
                  field={field}
                  currentValue={currentValue}
                  onChange={onChange}
                />
                <FieldDescription field={field} />
              </div>
            ) : (
              <label key={field.key} className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-medium">{field.label}</span>
                <select
                  value={toDisplayValue(currentValue)}
                  onChange={(event) => onChange(field.key, normalizeDraftValue(field, event.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">選択してください</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldDescription field={field} />
              </label>
            )
          }

          if (field.type === 'textarea' || field.type === 'json') {
            return (
              <label key={field.key} className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">{field.label}</span>
                {field.key === 'pointAllocation' ? (
                  <PointAllocationEditor
                    value={currentValue}
                    onChange={(nextValue) => onChange(field.key, nextValue)}
                  />
                ) : null}
                {field.key === 'participants' ? (
                  <ParticipantsEditor
                    field={field}
                    value={currentValue}
                    onChange={(nextValue) => onChange(field.key, nextValue)}
                  />
                ) : null}
                {field.presets?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {field.presets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          onChange(
                            field.key,
                            field.type === 'json'
                              ? JSON.stringify(preset.value, null, 2)
                              : preset.value,
                          )
                        }
                        className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                <textarea
                  value={
                    field.type === 'json'
                      ? typeof currentValue === 'string'
                        ? currentValue
                        : JSON.stringify(currentValue ?? {}, null, 2)
                      : toDisplayValue(currentValue)
                  }
                  placeholder={field.placeholder}
                  onChange={(event) => onChange(field.key, normalizeDraftValue(field, event.target.value))}
                  className="min-h-32 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm"
                />
                <FieldDescription field={field} />
              </label>
            )
          }

          if (field.type === 'datetime') {
            const inputValue = formatDateTimeLocalValue(currentValue)

            return (
              <label key={field.key} className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-medium">{field.label}</span>
                <input
                  type="datetime-local"
                  value={inputValue}
                  onChange={(event) => onChange(field.key, normalizeDraftValue(field, event.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
                <FieldDescription field={field} />
              </label>
            )
          }

          if (resourceKey === 'matches' && field.key === 'name' && field.type === 'text') {
            return (
              <MatchNameField
                key={field.key}
                field={field}
                currentValue={currentValue}
                onChange={onChange}
              />
            )
          }

          return (
            <label key={field.key} className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">{field.label}</span>
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={toDisplayValue(currentValue)}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.key, normalizeDraftValue(field, event.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
              <FieldDescription field={field} />
            </label>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          {submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            キャンセル
          </button>
        ) : null}
        {successMessage ? (
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {successMessage}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function DataControlPage() {
  const [resourceDefinitions, setResourceDefinitions] = useState<DataControlResourceDefinition[]>([])
  const [masterData, setMasterData] = useState<PublicMasterResponse | null>(null)
  const [activeResourceKey, setActiveResourceKey] = useState<string>('teams')
  const [activeMainView, setActiveMainView] = useState<'table' | 'preview'>('table')
  const [records, setRecords] = useState<DataControlRecord[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null)
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null)
  const [createDraft, setCreateDraft] = useState<Record<string, DataControlValue>>({})
  const [editDraft, setEditDraft] = useState<Record<string, DataControlValue>>({})
  const [importFormat, setImportFormat] = useState<DataControlImportFormat>('json')
  const [importText, setImportText] = useState('')
  const [importResult, setImportResult] = useState<string | null>(null)
  const [activeMatchEventId, setActiveMatchEventId] = useState<number | null>(null)
  const [activeMatchBlockId, setActiveMatchBlockId] = useState<number | null>(null)
  const [matchSortOrder, setMatchSortOrder] = useState<'timeAsc' | 'timeDesc'>('timeAsc')

  const activeResource = useMemo(
    () => resourceDefinitions.find((definition) => definition.key === activeResourceKey) ?? null,
    [activeResourceKey, resourceDefinitions],
  )

  const filteredRecords = useMemo(() => {
    if (activeResourceKey !== 'matches') return records

    const blockById = new Map(masterData?.blocks.map((block) => [block.id, block]) ?? [])

    let nextRecords = [...records]

    if (activeMatchEventId !== null) {
      nextRecords = nextRecords.filter((record) => {
        const blockId = typeof record.eventBlockId === 'number' ? record.eventBlockId : null
        if (blockId === null) return false
        return blockById.get(blockId)?.eventId === activeMatchEventId
      })
    }

    if (activeMatchBlockId !== null) {
      nextRecords = nextRecords.filter((record) => record.eventBlockId === activeMatchBlockId)
    }

    return nextRecords.sort((left, right) => {
      const leftTime = typeof left.scheduledStartTime === 'string' ? new Date(left.scheduledStartTime).getTime() : NaN
      const rightTime = typeof right.scheduledStartTime === 'string' ? new Date(right.scheduledStartTime).getTime() : NaN
      const leftId = typeof left.id === 'number' ? left.id : Number.MAX_SAFE_INTEGER
      const rightId = typeof right.id === 'number' ? right.id : Number.MAX_SAFE_INTEGER

      if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime) && leftTime !== rightTime) {
        return matchSortOrder === 'timeAsc' ? leftTime - rightTime : rightTime - leftTime
      }

      return leftId - rightId
    })
  }, [activeMatchBlockId, activeMatchEventId, activeResourceKey, matchSortOrder, masterData?.blocks, records])

  const previewEventId = useMemo(() => {
    if (!masterData) return null

    if (activeResourceKey === 'events') {
      if (editingRecordId !== null) return editingRecordId
      const firstEventId = records[0]?.id
      return typeof firstEventId === 'number' ? firstEventId : null
    }

    if (activeResourceKey === 'matches') {
      if (activeMatchBlockId === null) return null
      return masterData.blocks.find((block) => block.id === activeMatchBlockId)?.eventId ?? null
    }

    return null
  }, [activeMatchBlockId, activeResourceKey, editingRecordId, masterData, records])

  const previewData = useMemo(() => {
    if (!masterData || !previewEventId) return null

    const nextEvents =
      activeResourceKey === 'events'
        ? masterData.events.map((event) => {
            const override = records.find((record) => record.id === event.id)
            return override ? { ...event, ...override } : event
          })
        : masterData.events

    const nextMatches =
      activeResourceKey === 'matches'
        ? masterData.matches.map((match) => {
            const override = records.find((record) => record.id === match.id)
            return override ? { ...match, ...override } : match
          })
        : masterData.matches

    return {
      events: nextEvents,
      eventBlocks: masterData.blocks,
      matches: nextMatches,
      teams: masterData.teams,
    }
  }, [activeResourceKey, masterData, previewEventId, records])

  const canShowPreview = Boolean(previewData && previewEventId)
  const resolvedPreviewEventId = canShowPreview ? previewEventId : null
  const resolvedPreviewData = canShowPreview ? previewData : null

  const matchEventOptions = useMemo(() => {
    if (!masterData) return []

    const eventIds = new Set(
      records
        .map((record) => {
          const blockId = typeof record.eventBlockId === 'number' ? record.eventBlockId : null
          if (blockId === null) return null
          return masterData.blocks.find((block) => block.id === blockId)?.eventId ?? null
        })
        .filter((value): value is number => typeof value === 'number'),
    )

    return masterData.events
      .filter((event) => eventIds.has(event.id))
      .map((event) => ({
        value: event.id,
        label: event.name,
      }))
  }, [masterData, records])

  const matchBlockOptions = useMemo(() => {
    if (!masterData) return []

    const blockIds = new Set(
      records
        .map((record) => record.eventBlockId)
        .filter((value): value is number => typeof value === 'number'),
    )

    return masterData.blocks
      .filter((block) => {
        if (!blockIds.has(block.id)) return false
        if (activeMatchEventId === null) return true
        return block.eventId === activeMatchEventId
      })
      .map((block) => {
        const eventName =
          masterData.events.find((event) => event.id === block.eventId)?.name ?? `event:${block.eventId}`

        return {
          value: block.id,
          label: `${eventName} / ${block.name}`,
        }
      })
  }, [activeMatchEventId, masterData, records])

  const tableFields = useMemo(() => {
    if (!activeResource) return []

    const configuredFields = new Map(activeResource.fields.map((field) => [field.key, field]))
    const observedKeys = filteredRecords.flatMap((record) => Object.keys(record))
    const unknownKeys = Array.from(new Set(observedKeys)).filter((key) => !configuredFields.has(key))

    return [
      ...activeResource.fields,
      ...unknownKeys.map((key) => ({
        key,
        label: key,
        type: 'text' as const,
      })),
    ]
  }, [activeResource, filteredRecords])

  async function loadActiveResource(resource: DataControlResourceDefinition) {
    const nextRecords = await resource.fetchRecords()
    setRecords(sortRecords(nextRecords, resource.primaryKey))
  }

  async function refreshMasterContext() {
    const {
      masterData,
      mapOptions,
      locationOptions,
      eventOptions,
      teamOptions,
      prereqMatchOptions,
      eventBlockOptions,
    } = await fetchAdminMasterOptions()
    const definitions = createAdminResourceDefinitions(
      mapOptions,
      locationOptions,
      eventOptions,
      teamOptions,
      prereqMatchOptions,
      eventBlockOptions,
    )

    setMasterData(masterData)
    setResourceDefinitions(definitions)
    return definitions
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const definitions = await refreshMasterContext()
        setActiveResourceKey(definitions[0]?.key ?? '')
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '初期化に失敗しました')
      } finally {
        setIsBootstrapping(false)
      }
    }

    bootstrap()
  }, [])

  useEffect(() => {
    if (!activeResource) return

    setCreateDraft(getInitialDraft(activeResource.fields))
    setEditDraft({})
    setEditingRecordId(null)
    setActiveMatchEventId(null)
    setActiveMatchBlockId(null)
    setMatchSortOrder('timeAsc')
    setActiveMainView('table')
    setCreateSuccessMessage(null)

    startTransition(() => {
      setErrorMessage(null)
      loadActiveResource(activeResource).catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : 'データ取得に失敗しました')
      })
    })
  }, [activeResource])

  useEffect(() => {
    if (!createSuccessMessage) return

    const timeoutId = window.setTimeout(() => {
      setCreateSuccessMessage(null)
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [createSuccessMessage])

  useEffect(() => {
    if (activeResourceKey !== 'matches') return

    if (activeMatchEventId === null || !masterData) return

    const eventIdSet = new Set(
      records
        .map((record) => {
          const blockId = typeof record.eventBlockId === 'number' ? record.eventBlockId : null
          if (blockId === null) return null
          return masterData.blocks.find((block) => block.id === blockId)?.eventId ?? null
        })
        .filter((value): value is number => typeof value === 'number'),
    )

    if (!eventIdSet.has(activeMatchEventId)) {
      setActiveMatchEventId(null)
    }
  }, [activeMatchEventId, activeResourceKey, masterData, records])

  useEffect(() => {
    if (activeResourceKey !== 'matches') return
    if (activeMatchBlockId === null) return
    if (matchBlockOptions.some((option) => option.value === activeMatchBlockId)) return
    setActiveMatchBlockId(null)
  }, [activeMatchBlockId, activeResourceKey, matchBlockOptions])

  useEffect(() => {
    if (activeResourceKey !== 'matches' || activeMatchBlockId === null) return

    setCreateDraft((current) => ({
      ...current,
      eventBlockId: activeMatchBlockId,
    }))

    if (editingRecordId !== null) {
      const editingRecord = records.find((record) => record.id === editingRecordId) ?? null
      if (editingRecord?.eventBlockId !== activeMatchBlockId) {
        setEditingRecordId(null)
        setEditDraft({})
      }
    }
  }, [activeMatchBlockId, activeResourceKey, editingRecordId, records])

  function updateCreateDraft(key: string, value: DataControlValue) {
    setCreateDraft((current) => ({ ...current, [key]: value }))
  }

  function updateEditDraft(key: string, value: DataControlValue) {
    setEditDraft((current) => ({ ...current, [key]: value }))
  }

  async function handleCreate() {
    if (!activeResource) return

    try {
      validateDraft(activeResource.fields, createDraft)
      setErrorMessage(null)
      await activeResource.createRecord(prepareDraftForSubmit(activeResource.fields, createDraft))
      const nextDefinitions = await refreshMasterContext()
      const nextActiveResource =
        nextDefinitions.find((definition) => definition.key === activeResource.key) ?? null
      if (nextActiveResource) {
        await loadActiveResource(nextActiveResource)
        setCreateDraft((current) =>
          buildCreateDraftAfterSubmit(activeResource.key, nextActiveResource.fields, current),
        )
      }
      setCreateSuccessMessage(`${activeResource.label}を作成しました`)
    } catch (error) {
      setCreateSuccessMessage(null)
      setErrorMessage(error instanceof Error ? error.message : '作成に失敗しました')
    }
  }

  function startEdit(record: DataControlRecord) {
    if (!activeResource || typeof record.id !== 'number') return

    setEditingRecordId(record.id)
    setEditDraft(buildRecordDraft(activeResource.fields, record))
  }

  async function handleUpdate() {
    if (!activeResource || editingRecordId === null) return

    try {
      validateDraft(activeResource.fields, editDraft)
      setErrorMessage(null)
      await activeResource.updateRecord(
        editingRecordId,
        prepareDraftForSubmit(activeResource.fields, editDraft),
      )
      const nextDefinitions = await refreshMasterContext()
      const nextActiveResource =
        nextDefinitions.find((definition) => definition.key === activeResource.key) ?? null
      if (nextActiveResource) {
        await loadActiveResource(nextActiveResource)
      }
      setEditingRecordId(null)
      setEditDraft({})
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '更新に失敗しました')
    }
  }

  async function handleDelete(id: number) {
    if (!activeResource) return
    if (!window.confirm(`ID ${id} を削除しますか？`)) return

    try {
      setErrorMessage(null)
      await activeResource.deleteRecord(id)
      const nextDefinitions = await refreshMasterContext()
      const nextActiveResource =
        nextDefinitions.find((definition) => definition.key === activeResource.key) ?? null
      if (nextActiveResource) {
        await loadActiveResource(nextActiveResource)
      }
      if (editingRecordId === id) {
        setEditingRecordId(null)
        setEditDraft({})
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '削除に失敗しました')
    }
  }

  async function handleBulkDeleteMatches(scope: 'all' | 'block') {
    if (!activeResource || activeResource.key !== 'matches') return

    const targetRecords =
      scope === 'all'
        ? records
        : activeMatchBlockId === null
          ? []
          : records.filter((record) => record.eventBlockId === activeMatchBlockId)

    const targetIds = targetRecords
      .map((record) => record.id)
      .filter((value): value is number => typeof value === 'number')

    if (targetIds.length === 0) {
      setErrorMessage('削除対象の試合がありません')
      return
    }

    const label = scope === 'all' ? '全試合' : '選択中EventBlockの全試合'
    if (!window.confirm(`${label} ${targetIds.length} 件を削除しますか？`)) return

    try {
      setErrorMessage(null)
      for (const id of targetIds) {
        await activeResource.deleteRecord(id)
      }

      const nextDefinitions = await refreshMasterContext()
      const nextActiveResource =
        nextDefinitions.find((definition) => definition.key === activeResource.key) ?? null
      if (nextActiveResource) {
        await loadActiveResource(nextActiveResource)
      }
      setEditingRecordId(null)
      setEditDraft({})
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '一括削除に失敗しました')
    }
  }

  function handleExport(format: DataControlImportFormat) {
    if (!activeResource) return

    const content =
      format === 'json'
        ? exportRecordsAsJson(filteredRecords)
        : exportRecordsAsCsv(activeResource.fields, filteredRecords)

    downloadTextFile(
      `${activeResource.key}-${new Date().toISOString().slice(0, 10)}.${format}`,
      content,
      format === 'json' ? 'application/json' : 'text/csv',
    )
  }

  async function handleImport() {
    if (!activeResource) return

    try {
      setErrorMessage(null)
      let importedRecords = parseImportedRecords(importFormat, activeResource.fields, importText)

      if (activeResourceKey === 'matches' && activeMatchBlockId !== null) {
        importedRecords = importedRecords.map((record) => {
          const idValue = record[activeResource.primaryKey]
          const eventBlockId = record.eventBlockId

          if (typeof eventBlockId === 'number' && eventBlockId !== activeMatchBlockId) {
            throw new Error('試合取込は現在選択中のイベントブロックと同じ eventBlockId のみ取り込めます')
          }

          if (typeof idValue === 'number') {
            const existingRecord = records.find((item) => item.id === idValue)
            if (existingRecord?.eventBlockId !== activeMatchBlockId) {
              throw new Error('現在選択中ではないイベントブロックの試合は更新できません')
            }
          }

          return {
            ...record,
            eventBlockId: activeMatchBlockId,
          }
        })
      }

      let createdCount = 0
      let updatedCount = 0

      for (const importedRecord of importedRecords) {
        const idValue = importedRecord[activeResource.primaryKey]
        const preparedRecord = prepareDraftForSubmit(activeResource.fields, importedRecord)

        if (typeof idValue === 'number') {
          await activeResource.updateRecord(idValue, preparedRecord)
          updatedCount += 1
          continue
        }

        await activeResource.createRecord(preparedRecord)
        createdCount += 1
      }

      const nextDefinitions = await refreshMasterContext()
      const nextActiveResource =
        nextDefinitions.find((definition) => definition.key === activeResource.key) ?? null
      if (nextActiveResource) {
        await loadActiveResource(nextActiveResource)
      }
      setImportResult(`取込完了: 新規 ${createdCount} 件 / 更新 ${updatedCount} 件`)
    } catch (error) {
      setImportResult(null)
      setErrorMessage(error instanceof Error ? error.message : '取込に失敗しました')
    }
  }

  async function handleImportFile(file: File | null) {
    if (!file || !activeResource) return

    setErrorMessage(null)
    setImportResult(null)

    try {
      const text = await file.text()
      setImportText(text)

      const lowerName = file.name.toLowerCase()
      const inferredFormat =
        lowerName.endsWith('.csv')
          ? 'csv'
          : lowerName.endsWith('.json')
            ? 'json'
            : inferImportFormatFromText(text)

      if (inferredFormat) {
        setImportFormat(inferredFormat)
      }

      try {
        const targetFields =
          activeResourceKey === 'matches'
            ? activeResource.fields.filter((field) => field.key !== 'participants')
            : activeResource.fields
        parseImportedRecords(inferredFormat ?? importFormat, targetFields, text)
        setImportResult('ファイルを読み込みました。内容を確認してから取込実行してください。')
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'ファイルの解析に失敗しました')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ファイルの読込に失敗しました')
    }
  }

  if (isBootstrapping) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">初期化中です...</div>
  }

  if (!activeResource) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">表示できるデータ定義がありません</div>
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">System Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">データコントロール</h1>
          <p className="mt-2 text-sm text-slate-600">
            `maps` `teams` `locations` `events` `matches` の個別編集、一覧確認、JSON / CSV の入出力を行います。
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {resourceDefinitions.map((definition) => {
              const isActive = definition.key === activeResource.key
              return (
                <button
                  key={definition.key}
                  type="button"
                  onClick={() => setActiveResourceKey(definition.key)}
                  className={
                    isActive
                      ? 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white'
                      : 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700'
                  }
                >
                  {definition.label}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-sm text-slate-600">{activeResource.description}</p>
        </section>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {activeMainView === 'preview' ? '視覚プレビュー' : '一覧'}
                </h2>
                <p className="text-sm text-slate-500">
                  {activeMainView === 'preview'
                    ? '既存の対戦表コンポーネントを使って、関連イベントの見え方を確認できます。'
                    : `${filteredRecords.length} 件`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveMainView('table')}
                    className={
                      activeMainView === 'table'
                        ? 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white'
                        : 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700'
                    }
                  >
                    一覧
                  </button>
                  {canShowPreview ? (
                    <button
                      type="button"
                      onClick={() => setActiveMainView('preview')}
                      className={
                        activeMainView === 'preview'
                          ? 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white'
                          : 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700'
                      }
                    >
                      プレビュー
                    </button>
                  ) : null}
                </div>
                {activeMainView === 'table' ? (
                  <button
                    type="button"
                    onClick={() => loadActiveResource(activeResource).catch((error) => {
                      setErrorMessage(error instanceof Error ? error.message : '再読込に失敗しました')
                    })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    再読込
                  </button>
                ) : null}
              </div>
            </div>

            {activeResourceKey === 'matches' ? (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    <span className="font-medium">Eventフィルター</span>
                    <select
                      value={activeMatchEventId ?? ''}
                      onChange={(event) => setActiveMatchEventId(Number(event.target.value) || null)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                    >
                      <option value="">すべて</option>
                      {matchEventOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    <span className="font-medium">EventBlockフィルター</span>
                    <select
                      value={activeMatchBlockId ?? ''}
                      onChange={(event) => setActiveMatchBlockId(Number(event.target.value) || null)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                    >
                      <option value="">すべて</option>
                      {matchBlockOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    <span className="font-medium">時刻ソート</span>
                    <select
                      value={matchSortOrder}
                      onChange={(event) => setMatchSortOrder(event.target.value as 'timeAsc' | 'timeDesc')}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                    >
                      <option value="timeAsc">開始時刻 昇順</option>
                      <option value="timeDesc">開始時刻 降順</option>
                    </select>
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkDeleteMatches('all')}
                    className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700"
                  >
                    試合計画を全件削除
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkDeleteMatches('block')}
                    disabled={activeMatchBlockId === null}
                    className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    選択EventBlock内を全件削除
                  </button>
                </div>
              </div>
            ) : null}

            {activeMainView === 'preview' && resolvedPreviewEventId && resolvedPreviewData ? (
              <div className="overflow-x-auto">
                {activeResourceKey === 'matches' ? (
                  <MatchesPreviewByEvent
                    eventId={resolvedPreviewEventId}
                    activeBlockId={activeMatchBlockId}
                    previewData={resolvedPreviewData}
                  />
                ) : (
                  <EventBracket eventId={resolvedPreviewEventId} previewData={resolvedPreviewData} />
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-max border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr>
                      {tableFields.map((field) => (
                        <th
                          key={field.key}
                          className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600"
                        >
                          {field.label}
                        </th>
                      ))}
                      <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={String(record.id ?? JSON.stringify(record))} className="align-top">
                        {tableFields.map((field) => (
                          <td key={field.key} className="border-b border-slate-100 px-3 py-3 text-slate-700">
                            <div className="min-w-24 whitespace-pre-wrap break-words">
                              {renderTableCellValue(field, record[field.key] ?? null, masterData)}
                            </div>
                          </td>
                        ))}
                        <td className="border-b border-slate-100 px-3 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(record)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                            >
                              編集
                            </button>
                            {typeof record.id === 'number' ? (
                              <button
                                type="button"
                                onClick={() => handleDelete(record.id as number)}
                                className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700"
                              >
                                削除
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={tableFields.length + 1}
                          className="px-3 py-6 text-center text-sm text-slate-500"
                        >
                          データがありません
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">入出力</h2>
                <p className="text-sm text-slate-500">
                  `id` を含む行は更新、`id` がない行は新規作成として取り込みます。
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  JSON 書き出し
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  CSV 書き出し
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="font-medium">取込形式</span>
                  <select
                    value={importFormat}
                    onChange={(event) => setImportFormat(event.target.value as DataControlImportFormat)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="font-medium">ファイル読込</span>
                  <input
                    type="file"
                    accept=".json,.csv,application/json,text/csv"
                    onChange={(event) => {
                      void handleImportFile(event.target.files?.[0] ?? null)
                      event.target.value = ''
                    }}
                    className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-sm file:font-medium"
                  />
                </label>
              </div>

              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder={
                  importFormat === 'json'
                    ? '[{"name":"2A"}]'
                    : activeResource.fields.map((field) => field.key).join(',')
                }
                className="mt-4 min-h-56 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm"
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleImport}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  取込実行
                </button>
                {importResult ? <span className="text-sm text-emerald-700">{importResult}</span> : null}
              </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">新規作成</h2>
            </div>
            <RecordForm
              resourceKey={activeResource.key}
              fields={activeResource.fields.filter((field) => !field.readOnly)}
              value={createDraft}
              submitLabel="作成"
              onChange={updateCreateDraft}
              onSubmit={handleCreate}
              successMessage={createSuccessMessage}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">個別編集</h2>
              <p className="text-sm text-slate-500">
                一覧から編集を押すと対象レコードをここで更新できます。
              </p>
            </div>

            {editingRecordId === null ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                まだ編集中のレコードはありません
              </div>
            ) : (
              <RecordForm
                resourceKey={activeResource.key}
                fields={activeResource.fields}
                value={editDraft}
                submitLabel="更新"
                onChange={updateEditDraft}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setEditingRecordId(null)
                  setEditDraft({})
                }}
              />
            )}
          </section>
        </section>

        {isPending ? <div className="text-sm text-slate-500">データを更新中です...</div> : null}
      </div>
    </main>
  )
}
