'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../lib/api/client'
import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'

type RankingDraftRow = {
  teamId: number
  rank: string
  points: string
  note: string
}

type BlockWithEvent = PublicMasterResponse['blocks'][number] & {
  eventName: string
}

async function parseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const payload = await response.json() as { message?: string }
    return payload.message ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

function toIntOrNaN(value: string) {
  const trimmed = value.trim()
  if (trimmed.length === 0) return Number.NaN
  const num = Number(trimmed)
  if (!Number.isInteger(num)) return Number.NaN
  return num
}

export function RankingsPage() {
  const [master, setMaster] = useState<PublicMasterResponse | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null)
  const [draftRows, setDraftRows] = useState<RankingDraftRow[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const teamMap = useMemo(
    () => new Map((master?.teams ?? []).map((team) => [team.id, team.name])),
    [master],
  )

  const blockOptions = useMemo((): BlockWithEvent[] => {
    if (!master) return []
    const eventMap = new Map(master.events.map((event) => [event.id, event.name]))

    return master.blocks
      .map((block) => ({
        ...block,
        eventName: eventMap.get(block.eventId) ?? `event:${block.eventId}`,
      }))
      .sort((left, right) => left.id - right.id)
  }, [master])

  const selectedBlock = useMemo(
    () => blockOptions.find((block) => block.id === selectedBlockId) ?? null,
    [blockOptions, selectedBlockId],
  )

  async function loadData() {
    const response = await api.api.public.master.$get()
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'マスタ情報の取得に失敗しました'))
    }

    const data = await response.json() as PublicMasterResponse
    setMaster(data)

    if (selectedBlockId === null && data.blocks.length > 0) {
      setSelectedBlockId(data.blocks[0].id)
    }
  }

  useEffect(() => {
    loadData()
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : '初期化に失敗しました')
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!master || selectedBlockId === null) {
      setDraftRows([])
      return
    }

    const rows = master.blockRankings
      .filter((row) => row.eventBlockId === selectedBlockId)
      .sort((left, right) => left.rank - right.rank)
      .map((row) => ({
        teamId: row.teamId,
        rank: String(row.rank),
        points: String(row.points),
        note: row.note ?? '',
      }))

    setDraftRows(rows)
  }, [master, selectedBlockId])

  function updateDraftRow(teamId: number, next: Partial<RankingDraftRow>) {
    setDraftRows((current) => current.map((row) => (row.teamId === teamId ? { ...row, ...next } : row)))
  }

  async function saveRankings() {
    if (selectedBlockId === null) return

    const payload = draftRows.map((row) => ({
      teamId: row.teamId,
      rank: toIntOrNaN(row.rank),
      points: toIntOrNaN(row.points),
      note: row.note.trim().length === 0 ? null : row.note.trim(),
    }))

    if (payload.some((row) => Number.isNaN(row.rank) || row.rank < 1)) {
      setErrorMessage('順位は 1 以上の整数で入力してください')
      setInfoMessage(null)
      return
    }

    if (payload.some((row) => Number.isNaN(row.points))) {
      setErrorMessage('ポイントは整数で入力してください')
      setInfoMessage(null)
      return
    }

    const rankSet = new Set(payload.map((row) => row.rank))
    if (rankSet.size !== payload.length) {
      setErrorMessage('同じ順位を重複して設定できません')
      setInfoMessage(null)
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setInfoMessage(null)

    try {
      const response = await api.api.admin['block-rankings'].block[':eventBlockId'].$put({
        param: { eventBlockId: String(selectedBlockId) },
        json: {
          rankings: payload,
        },
      })

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, '順位の保存に失敗しました'))
      }

      await loadData()
      setInfoMessage(`EventBlock ID ${selectedBlockId} の順位を更新しました`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '順位の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">System Admin / EventBlock Rankings</p>
          <h1 className="mt-2 text-2xl font-semibold">EventBlock ごとの順位修正</h1>
          <p className="mt-2 text-sm text-slate-600">
            同率後のくじ引き結果など、EventBlock 単位の最終順位を直接編集します。
          </p>
        </section>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {infoMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {infoMessage}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">対象 EventBlock</span>
            <select
              value={selectedBlockId ?? ''}
              onChange={(event) => setSelectedBlockId(event.target.value.length === 0 ? null : Number(event.target.value))}
              className="max-w-xl rounded-md border border-slate-300 px-3 py-2"
              disabled={isLoading}
            >
              {blockOptions.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.id}: {block.eventName} / {block.name} ({block.type})
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">順位編集</h2>
          {selectedBlock ? (
            <p className="mt-1 text-sm text-slate-600">
              編集中: {selectedBlock.eventName} / {selectedBlock.name}
            </p>
          ) : null}
          {isLoading ? <p className="mt-3 text-sm text-slate-500">読み込み中...</p> : null}

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[720px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  {['チーム', '順位', 'ポイント', 'メモ'].map((label) => (
                    <th key={label} className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draftRows.map((row) => (
                  <tr key={row.teamId}>
                    <td className="border-b border-slate-100 px-3 py-3">{row.teamId}: {teamMap.get(row.teamId) ?? '不明'}</td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <input
                        value={row.rank}
                        onChange={(event) => updateDraftRow(row.teamId, { rank: event.target.value })}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1"
                        inputMode="numeric"
                      />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <input
                        value={row.points}
                        onChange={(event) => updateDraftRow(row.teamId, { points: event.target.value })}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1"
                        inputMode="numeric"
                      />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <input
                        value={row.note}
                        onChange={(event) => updateDraftRow(row.teamId, { note: event.target.value })}
                        className="w-full min-w-[220px] rounded-md border border-slate-300 px-2 py-1"
                        placeholder="任意"
                      />
                    </td>
                  </tr>
                ))}

                {draftRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                      順位データがありません
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                void saveRankings()
              }}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              disabled={isSaving || isLoading || selectedBlockId === null}
            >
              保存
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
