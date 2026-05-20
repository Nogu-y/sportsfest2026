'use client'

import { useState, useTransition } from 'react'
import { webEnv } from '../../../env'

type Summary = { created: number; updated: number; deleted: number }

async function postFile(path: string, file: File) {
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(`${webEnv.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  })

  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error((json as { message?: string }).message ?? 'リクエストに失敗しました')
  }

  return json as {
    message: string
    csv?: string
    summary?: { diffSummary?: Summary; dbSummary?: Summary } | Summary
  }
}

function SummaryView({ summary }: { summary: Summary | undefined }) {
  if (!summary) return null

  return (
    <p className="text-sm text-slate-700">
      create: {summary.created} / update: {summary.updated} / delete: {summary.deleted}
    </p>
  )
}

export function DataUpdatePage() {
  const [excelForApply, setExcelForApply] = useState<File | null>(null)
  const [excelForCsv, setExcelForCsv] = useState<File | null>(null)
  const [csvForApply, setCsvForApply] = useState<File | null>(null)

  const [excelApplyMessage, setExcelApplyMessage] = useState('')
  const [excelApplySummary, setExcelApplySummary] = useState<Summary | undefined>()
  const [excelCsvMessage, setExcelCsvMessage] = useState('')
  const [generatedCsv, setGeneratedCsv] = useState('')
  const [csvApplyMessage, setCsvApplyMessage] = useState('')
  const [csvApplySummary, setCsvApplySummary] = useState<Summary | undefined>()

  const [isPending, startTransition] = useTransition()

  const onExcelApply = () => {
    if (!excelForApply) {
      setExcelApplyMessage('Excelファイルを選択してください')
      return
    }

    startTransition(async () => {
      try {
        const result = await postFile('/api/admin/data-update/excel/apply-diff', excelForApply)
        setExcelApplyMessage(result.message)
        const summary = (result.summary as { dbSummary?: Summary } | undefined)?.dbSummary
        setExcelApplySummary(summary)
      } catch (error) {
        setExcelApplyMessage(error instanceof Error ? error.message : 'Excel差分適用に失敗しました')
        setExcelApplySummary(undefined)
      }
    })
  }

  const onExcelToCsv = () => {
    if (!excelForCsv) {
      setExcelCsvMessage('Excelファイルを選択してください')
      return
    }

    startTransition(async () => {
      try {
        const result = await postFile('/api/admin/data-update/excel/convert-csv', excelForCsv)
        setGeneratedCsv(result.csv ?? '')
        setExcelCsvMessage(result.message)
      } catch (error) {
        setExcelCsvMessage(error instanceof Error ? error.message : 'CSV変換に失敗しました')
      }
    })
  }

  const onCsvApply = () => {
    if (!csvForApply) {
      setCsvApplyMessage('CSVファイルを選択してください')
      return
    }

    startTransition(async () => {
      try {
        const result = await postFile('/api/admin/data-update/csv/apply-diff', csvForApply)
        setCsvApplyMessage(result.message)
        setCsvApplySummary(result.summary as Summary | undefined)
      } catch (error) {
        setCsvApplyMessage(error instanceof Error ? error.message : 'CSV差分適用に失敗しました')
        setCsvApplySummary(undefined)
      }
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">データ更新</h1>
        <p className="mt-2 text-sm text-slate-600">Excel/CSV から試合データの差分更新を行います。</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">1. Excelから差分をDBに適用</h2>
        <div className="mt-4 flex flex-col gap-3">
          <input type="file" accept=".xlsx" onChange={(e) => setExcelForApply(e.target.files?.[0] ?? null)} />
          <button
            type="button"
            onClick={onExcelApply}
            disabled={isPending}
            className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            適用する
          </button>
          <p className="text-sm text-slate-700">{excelApplyMessage}</p>
          <SummaryView summary={excelApplySummary} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">2. Excelから全文CSVへ変換</h2>
        <div className="mt-4 flex flex-col gap-3">
          <input type="file" accept=".xlsx" onChange={(e) => setExcelForCsv(e.target.files?.[0] ?? null)} />
          <button
            type="button"
            onClick={onExcelToCsv}
            disabled={isPending}
            className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            変換する
          </button>
          <p className="text-sm text-slate-700">{excelCsvMessage}</p>
          <textarea
            value={generatedCsv}
            readOnly
            placeholder="変換結果のCSVがここに表示されます"
            className="h-72 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-700"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">3. CSVから差分をDBに適用</h2>
        <div className="mt-4 flex flex-col gap-3">
          <input type="file" accept=".csv" onChange={(e) => setCsvForApply(e.target.files?.[0] ?? null)} />
          <button
            type="button"
            onClick={onCsvApply}
            disabled={isPending}
            className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            適用する
          </button>
          <p className="text-sm text-slate-700">{csvApplyMessage}</p>
          <SummaryView summary={csvApplySummary} />
        </div>
      </section>
    </div>
  )
}
