'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { api } from '../../../lib/api/client'
import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'
import { buildBlockBatches, type BlockBatch, type MatchInputPayload } from './matchPlanDefinitions'

async function ensureSuccess(response: Response, fallbackMessage: string) {
  if (response.ok) return

  try {
    const data = await response.json() as { message?: string }
    throw new Error(data.message ?? fallbackMessage)
  } catch {
    throw new Error(fallbackMessage)
  }
}

async function fetchMaster() {
  const response = await api.api.public.master.$get()
  await ensureSuccess(response, 'マスタ情報の取得に失敗しました')
  return await response.json() as PublicMasterResponse
}

async function postMatch(payload: MatchInputPayload) {
  const response = await api.api.admin.matches.$post({ json: payload })
  await ensureSuccess(response, '試合計画の投入に失敗しました')
  return await response.json() as { id: number }
}

function stripRuntimeField(payload: MatchInputPayload) {
  return {
    ...payload,
    participants: payload.participants.map((participant) => ({
      teamId: participant.teamId,
      prereqMatchId: participant.prereqMatchId,
      prereqBlockId: participant.prereqBlockId,
      prereqRank: participant.prereqRank,
      score: participant.score,
      rank: participant.rank,
      isDisqualified: participant.isDisqualified,
    })),
  }
}

async function insertBlock(batch: BlockBatch) {
  const createdIdByKey = new Map<string, number>()

  for (const match of batch.matches) {
    const payload: MatchInputPayload = {
      ...match.payload,
      participants: match.payload.participants.map((participant) => ({
        ...participant,
        prereqMatchId: participant._prereqMatchKey
          ? (createdIdByKey.get(participant._prereqMatchKey) ?? null)
          : null,
      })),
    }

    const created = await postMatch(stripRuntimeField(payload))
    createdIdByKey.set(match.key, created.id)
  }
}

export function DataInputPage() {
  const [masterData, setMasterData] = useState<PublicMasterResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchMaster()
      .then((data) => {
        setMasterData(data)
      })
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : '読み込みに失敗しました')
      })
  }, [])

  const batches = useMemo(() => {
    if (!masterData) return []
    return buildBlockBatches(masterData)
  }, [masterData])

  const insertSingleBlock = (batch: BlockBatch) => {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      try {
        await insertBlock(batch)
        setSuccess(`${batch.label} を投入しました (${batch.matches.length}件)`)
      } catch (insertError) {
        setError(insertError instanceof Error ? insertError.message : '投入に失敗しました')
      }
    })
  }

  const insertAllBlocks = () => {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      try {
        for (const batch of batches) {
          await insertBlock(batch)
        }

        const count = batches.reduce((sum, batch) => sum + batch.matches.length, 0)
        setSuccess(`全ブロックの投入が完了しました (${count}件)`)
      } catch (insertError) {
        setError(insertError instanceof Error ? insertError.message : '一括投入に失敗しました')
      }
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">試合計画データ投入</h1>
        <p className="mt-2 text-sm text-slate-600">
          EventBlockごとのデータを確認し、ボタン操作で `admin/matches` へ投入します。
          借り人競争・リレーは対象外です。
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={insertAllBlocks}
            disabled={isPending || batches.length === 0}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            全ブロック投入
          </button>
          <span className="text-sm text-slate-500">対象ブロック: {batches.length}</span>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-emerald-700">{success}</p> : null}
      </section>

      {batches.map((batch) => (
        <section key={batch.eventBlockId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{batch.label}</h2>
            <button
              type="button"
              onClick={() => insertSingleBlock(batch)}
              disabled={isPending || batch.matches.length === 0}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              このブロックを投入
            </button>
          </div>

          <p className="mt-2 text-sm text-slate-500">試合数: {batch.matches.length}</p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">キー</th>
                  <th className="px-3 py-2 text-left font-medium">試合名</th>
                  <th className="px-3 py-2 text-left font-medium">会場ID</th>
                  <th className="px-3 py-2 text-left font-medium">開始</th>
                  <th className="px-3 py-2 text-left font-medium">終了</th>
                  <th className="px-3 py-2 text-left font-medium">参加枠</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {batch.matches.map((match) => (
                  <tr key={match.key}>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{match.key}</td>
                    <td className="px-3 py-2 text-slate-800">{match.payload.name}</td>
                    <td className="px-3 py-2 text-slate-700">{match.payload.locationId ?? '-'}</td>
                    <td className="px-3 py-2 text-slate-700">{new Date(match.payload.scheduledStartTime).toLocaleString('ja-JP')}</td>
                    <td className="px-3 py-2 text-slate-700">{new Date(match.payload.scheduledEndTime).toLocaleString('ja-JP')}</td>
                    <td className="px-3 py-2 text-slate-700">{match.payload.participants.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </main>
  )
}
