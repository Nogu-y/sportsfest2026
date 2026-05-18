'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { matchStageOptions, pointAllocationScopeOptions } from './constants'
import {
  downloadTextFile,
  exportRecordsAsCsv,
  exportRecordsAsJson,
  parseImportedRecords,
} from '../data-control/utils'
import type {
  DataControlField,
  DataControlImportFormat,
  DataControlValue,
} from '../data-control/types'
import {
  attachLocalIds,
  buildDraftFromRow,
  BuilderRow,
  createInitialDraft,
  formatDateTimeInputValue,
  normalizeDraftValue,
  prepareDraftForSubmit,
  stripLocalIds,
  toDisplayValue,
  validateDraft,
} from './helpers'

type CreateHelperPageProps = {
  title: string
  description: string
  exportBaseName: string
  fields: DataControlField[]
  renderPreview?: (rows: BuilderRow[]) => React.ReactNode
}

type RecordFormProps = {
  fields: DataControlField[]
  value: Record<string, DataControlValue>
  submitLabel: string
  onChange: (key: string, value: DataControlValue) => void
  onSubmit: () => void
  onCancel?: () => void
}

type PointAllocationRow = {
  id: number
  scope: 'MATCH' | 'BLOCK'
  stage: string
  rank: number
  points: number
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
        if (!Number.isInteger(rank) || rank < 1) {
          continue
        }

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

  function removeRow(id: number) {
    updateRows(rows.filter((row) => row.id !== id))
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={draft.scope}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              scope: event.target.value as PointAllocationRow['scope'],
            }))
          }
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {pointAllocationScopeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={draft.stage}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              stage: event.target.value,
            }))
          }
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {matchStageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={draft.rank}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              rank: Number(event.target.value) || 1,
            }))
          }
          className="w-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={draft.points}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              points: Number(event.target.value) || 0,
            }))
          }
          className="w-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={addRow}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
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
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700"
                    >
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
        <p className="mt-3 text-sm text-rose-700">
          JSON が壊れているため GUI に展開できません。下の JSON を修正するか、GUI で新しく追加してください。
        </p>
      ) : null}

      <p className="mt-3 text-xs text-slate-500">
        API 仕様上、得点配分は「ステージ × 数値順位」で保存されます。例: `決勝1位` は `MATCH / FINAL / 1`
      </p>
    </div>
  )
}

function RecordForm({
  fields,
  value,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: RecordFormProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => {
          const currentValue = value[field.key] ?? ''

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
              </label>
            )
          }

          if (field.type === 'select') {
            return (
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
              </label>
            )
          }

          if (field.type === 'datetime') {
            const inputValue =
              typeof currentValue === 'string' && currentValue
                ? formatDateTimeInputValue(currentValue)
                : ''

            return (
              <label key={field.key} className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-medium">{field.label}</span>
                <input
                  type="datetime-local"
                  value={inputValue}
                  onChange={(event) => onChange(field.key, normalizeDraftValue(field, event.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </label>
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
      </div>
    </div>
  )
}

export function CreateHelperPage({
  title,
  description,
  exportBaseName,
  fields,
  renderPreview,
}: CreateHelperPageProps) {
  const [rows, setRows] = useState<BuilderRow[]>([])
  const [draft, setDraft] = useState<Record<string, DataControlValue>>(() => createInitialDraft(fields))
  const [editingLocalId, setEditingLocalId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<Record<string, DataControlValue>>({})
  const [importFormat, setImportFormat] = useState<DataControlImportFormat>('json')
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'rows' | 'preview'>('rows')

  const exportedRows = useMemo(() => stripLocalIds(rows), [rows])

  function updateDraft(key: string, value: DataControlValue) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function updateEditDraft(key: string, value: DataControlValue) {
    setEditDraft((current) => ({ ...current, [key]: value }))
  }

  function startEdit(row: BuilderRow) {
    setEditingLocalId(row._localId)
    setEditDraft(buildDraftFromRow(fields, row))
  }

  function duplicateRow(row: BuilderRow) {
    const nextLocalId = rows.reduce((max, current) => Math.max(max, current._localId), 0) + 1
    const { _localId, ...rest } = row
    setRows((current) => [...current, { ...rest, _localId: nextLocalId }])
  }

  function handleCreate() {
    try {
      validateDraft(fields, draft)
      const prepared = prepareDraftForSubmit(fields, draft)
      const nextLocalId = rows.reduce((max, current) => Math.max(max, current._localId), 0) + 1

      setRows((current) => [...current, { ...prepared, _localId: nextLocalId }])
      setDraft(createInitialDraft(fields))
      setMessage('行を追加しました')
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '追加に失敗しました')
      setMessage(null)
    }
  }

  function handleUpdate() {
    if (editingLocalId === null) return

    try {
      validateDraft(fields, editDraft)
      const prepared = prepareDraftForSubmit(fields, editDraft)

      setRows((current) =>
        current.map((row) => (row._localId === editingLocalId ? { ...row, ...prepared } : row)),
      )
      setEditingLocalId(null)
      setEditDraft({})
      setMessage('行を更新しました')
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '更新に失敗しました')
      setMessage(null)
    }
  }

  function handleDelete(localId: number) {
    setRows((current) => current.filter((row) => row._localId !== localId))
    if (editingLocalId === localId) {
      setEditingLocalId(null)
      setEditDraft({})
    }
  }

  function handleExport(format: DataControlImportFormat) {
    const content =
      format === 'json'
        ? exportRecordsAsJson(exportedRows)
        : exportRecordsAsCsv(fields, exportedRows)

    downloadTextFile(
      `${exportBaseName}-${new Date().toISOString().slice(0, 10)}.${format}`,
      content,
      format === 'json' ? 'application/json' : 'text/csv',
    )
  }

  function handleImport() {
    try {
      const importedRows = parseImportedRecords(importFormat, fields, importText)
      const nextStartId = rows.reduce((max, current) => Math.max(max, current._localId), 0) + 1
      const rowsWithLocalIds = attachLocalIds(importedRows, nextStartId)

      setRows((current) => [...current, ...rowsWithLocalIds])
      setMessage(`${rowsWithLocalIds.length} 件を展開して追加しました`)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '取込に失敗しました')
      setMessage(null)
    }
  }

  async function handleImportFile(file: File | null) {
    if (!file) return
    const text = await file.text()
    setImportText(text)

    if (file.name.endsWith('.csv')) {
      setImportFormat('csv')
      return
    }

    if (file.name.endsWith('.json')) {
      setImportFormat('json')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">System Admin / Create Helper</p>
          <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/system/admin/create"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              一覧へ戻る
            </Link>
            <Link
              href="/system/admin/create/events"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              イベント入力補助
            </Link>
            <Link
              href="/system/admin/create/matches"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              試合計画入力補助
            </Link>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">編集対象</h2>
              <p className="text-sm text-slate-500">{rows.length} 件を保持中</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveView('rows')}
                className={
                  activeView === 'rows'
                    ? 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white'
                    : 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700'
                }
              >
                一覧
              </button>
              {renderPreview ? (
                <button
                  type="button"
                  onClick={() => setActiveView('preview')}
                  className={
                    activeView === 'preview'
                      ? 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white'
                      : 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700'
                  }
                >
                  プレビュー
                </button>
              ) : null}
            </div>
          </div>

          {activeView === 'preview' && renderPreview ? (
            <div className="overflow-x-auto">{renderPreview(rows)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-max border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    {fields.map((field) => (
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
                  {rows.map((row) => (
                    <tr key={row._localId} className="align-top">
                      {fields.map((field) => (
                        <td key={field.key} className="border-b border-slate-100 px-3 py-3 text-slate-700">
                          <div className="min-w-24 whitespace-pre-wrap break-words">
                            {toDisplayValue(row[field.key] ?? null)}
                          </div>
                        </td>
                      ))}
                      <td className="border-b border-slate-100 px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateRow(row)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            複製
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row._localId)}
                            className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={fields.length + 1}
                        className="px-3 py-6 text-center text-sm text-slate-500"
                      >
                        まだ行がありません
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">新規追加</h2>
            <p className="text-sm text-slate-500">
              入力して行を積み上げ、最後に JSON / CSV としてダウンロードします。
            </p>
          </div>
          <RecordForm
            fields={fields}
            value={draft}
            submitLabel="行を追加"
            onChange={updateDraft}
            onSubmit={handleCreate}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">個別編集</h2>
            <p className="text-sm text-slate-500">
              取込済みのファイル内容や手入力で追加した行を、ここでさらに調整できます。
            </p>
          </div>
          {editingLocalId === null ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              一覧から編集を選択してください
            </div>
          ) : (
            <RecordForm
              fields={fields}
              value={editDraft}
              submitLabel="更新"
              onChange={updateEditDraft}
              onSubmit={handleUpdate}
              onCancel={() => {
                setEditingLocalId(null)
                setEditDraft({})
              }}
            />
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Import / Export</h2>
            <p className="text-sm text-slate-500">
              既存ファイルを展開して追記編集し、新しいファイルとして出力できます。
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
            <button
              type="button"
              onClick={() => {
                setRows([])
                setEditingLocalId(null)
                setEditDraft({})
                setMessage('現在の作業内容をクリアしました')
                setErrorMessage(null)
              }}
              className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700"
            >
              作業内容をクリア
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
                ? '[{"name":"サンプル"}]'
                : fields.map((field) => field.key).join(',')
            }
            className="mt-4 min-h-56 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleImport}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              展開して追加
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
