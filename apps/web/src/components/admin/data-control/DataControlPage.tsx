'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  createAdminResourceDefinitions,
  fetchAdminMasterOptions,
} from './resourceDefinitions'
import {
  downloadTextFile,
  exportRecordsAsCsv,
  exportRecordsAsJson,
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
  fields: DataControlField[]
  value: Record<string, DataControlValue>
  submitLabel: string
  onChange: (key: string, value: DataControlValue) => void
  onSubmit: () => void
  onCancel?: () => void
}

function toDisplayValue(value: DataControlValue) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function getInitialDraft(fields: DataControlField[]) {
  return fields.reduce<Record<string, DataControlValue>>((acc, field) => {
    if (field.readOnly) return acc

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
    acc[field.key] = record[field.key] ?? (field.type === 'boolean' ? false : '')
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

function prepareDraftForSubmit(fields: DataControlField[], draft: Record<string, DataControlValue>) {
  return fields.reduce<Record<string, DataControlValue>>((acc, field) => {
    const value = draft[field.key]

    if (value === undefined) return acc

    if (field.type === 'json' && typeof value === 'string') {
      const normalized = value.trim()
      acc[field.key] = normalized === '' ? (field.nullable ? null : {}) : JSON.parse(normalized)
      return acc
    }

    acc[field.key] = value
    return acc
  }, {})
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
                ? new Date(currentValue).toISOString().slice(0, 16)
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

export function DataControlPage() {
  const [resourceDefinitions, setResourceDefinitions] = useState<DataControlResourceDefinition[]>([])
  const [activeResourceKey, setActiveResourceKey] = useState<string>('teams')
  const [records, setRecords] = useState<DataControlRecord[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null)
  const [createDraft, setCreateDraft] = useState<Record<string, DataControlValue>>({})
  const [editDraft, setEditDraft] = useState<Record<string, DataControlValue>>({})
  const [importFormat, setImportFormat] = useState<DataControlImportFormat>('json')
  const [importText, setImportText] = useState('')
  const [importResult, setImportResult] = useState<string | null>(null)

  const activeResource = useMemo(
    () => resourceDefinitions.find((definition) => definition.key === activeResourceKey) ?? null,
    [activeResourceKey, resourceDefinitions],
  )

  const tableFields = useMemo(() => {
    if (!activeResource) return []

    const configuredFields = new Map(activeResource.fields.map((field) => [field.key, field]))
    const observedKeys = records.flatMap((record) => Object.keys(record))
    const unknownKeys = Array.from(new Set(observedKeys)).filter((key) => !configuredFields.has(key))

    return [
      ...activeResource.fields,
      ...unknownKeys.map((key) => ({
        key,
        label: key,
        type: 'text' as const,
      })),
    ]
  }, [activeResource, records])

  async function loadActiveResource(resource: DataControlResourceDefinition) {
    const nextRecords = await resource.fetchRecords()
    setRecords(sortRecords(nextRecords, resource.primaryKey))
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const { mapOptions, locationOptions, eventBlockOptions } = await fetchAdminMasterOptions()
        const definitions = createAdminResourceDefinitions(
          mapOptions,
          locationOptions,
          eventBlockOptions,
        )

        setResourceDefinitions(definitions)
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

    startTransition(() => {
      setErrorMessage(null)
      loadActiveResource(activeResource).catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : 'データ取得に失敗しました')
      })
    })
  }, [activeResource])

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
      const created = await activeResource.createRecord(
        prepareDraftForSubmit(activeResource.fields, createDraft),
      )
      setRecords((current) => sortRecords([...current, created], activeResource.primaryKey))
      setCreateDraft(getInitialDraft(activeResource.fields))
    } catch (error) {
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
      const updated = await activeResource.updateRecord(
        editingRecordId,
        prepareDraftForSubmit(activeResource.fields, editDraft),
      )

      setRecords((current) =>
        sortRecords(
          current.map((record) => (record.id === editingRecordId ? updated : record)),
          activeResource.primaryKey,
        ),
      )
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
      setRecords((current) => current.filter((record) => record.id !== id))
      if (editingRecordId === id) {
        setEditingRecordId(null)
        setEditDraft({})
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '削除に失敗しました')
    }
  }

  function handleExport(format: DataControlImportFormat) {
    if (!activeResource) return

    const content =
      format === 'json'
        ? exportRecordsAsJson(records)
        : exportRecordsAsCsv(activeResource.fields, records)

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
      const importedRecords = parseImportedRecords(importFormat, activeResource.fields, importText)
      let createdCount = 0
      let updatedCount = 0

      for (const importedRecord of importedRecords) {
        const idValue = importedRecord[activeResource.primaryKey]

        if (typeof idValue === 'number') {
          await activeResource.updateRecord(idValue, importedRecord)
          updatedCount += 1
          continue
        }

        await activeResource.createRecord(importedRecord)
        createdCount += 1
      }

      await loadActiveResource(activeResource)
      setImportResult(`取込完了: 新規 ${createdCount} 件 / 更新 ${updatedCount} 件`)
    } catch (error) {
      setImportResult(null)
      setErrorMessage(error instanceof Error ? error.message : '取込に失敗しました')
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
            `teams` `locations` `events` `matches` の個別編集、一覧確認、JSON / CSV の入出力を行います。
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
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">一覧</h2>
                <p className="text-sm text-slate-500">{records.length} 件</p>
              </div>
              <button
                type="button"
                onClick={() => loadActiveResource(activeResource).catch((error) => {
                  setErrorMessage(error instanceof Error ? error.message : '再読込に失敗しました')
                })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                再読込
              </button>
            </div>

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
                  {records.map((record) => (
                    <tr key={String(record.id ?? JSON.stringify(record))} className="align-top">
                      {tableFields.map((field) => (
                        <td key={field.key} className="border-b border-slate-100 px-3 py-3 text-slate-700">
                          <div className="min-w-24 whitespace-pre-wrap break-words">
                            {toDisplayValue(record[field.key] ?? null)}
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
                  {records.length === 0 ? (
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
              fields={activeResource.fields.filter((field) => !field.readOnly)}
              value={createDraft}
              submitLabel="作成"
              onChange={updateCreateDraft}
              onSubmit={handleCreate}
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
