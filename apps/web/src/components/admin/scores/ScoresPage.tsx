'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../lib/api/client'

type MatchStatus = 'Waiting' | 'Preparing' | 'Playing' | 'Finished' | 'Completed' | 'Cancelled'

type MatchParticipant = {
  id: number
  teamId: number | null
  score: number | null
  rank: number | null
  isDisqualified: boolean
}

type MatchRow = {
  id: number
  eventBlockId: number
  name: string | null
  status: MatchStatus
  scheduledStartTime: string
  participants: MatchParticipant[]
}

type EventRow = {
  id: number
  name: string
}

type TeamRow = {
  id: number
  name: string
}

type BlockRow = {
  id: number
  eventId: number
  name: string
}

type ParticipantDraft = {
  participantId: number
  teamId: number | null
  score: string
  rank: string
  isDisqualified: boolean
}

const statusOptions: MatchStatus[] = [
  'Waiting',
  'Preparing',
  'Playing',
  'Finished',
  'Completed',
  'Cancelled',
]

async function parseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const payload = await response.json() as { message?: string }
    return payload.message ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

function toNullableInteger(value: string) {
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  const num = Number(trimmed)
  if (!Number.isInteger(num)) return Number.NaN
  return num
}

export function ScoresPage() {
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [blocks, setBlocks] = useState<BlockRow[]>([])

  const [selectedEventId, setSelectedEventId] = useState<number | 'all'>('all')
  const [selectedTeamId, setSelectedTeamId] = useState<number | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<MatchStatus | 'all'>('all')
  const [matchNameQuery, setMatchNameQuery] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isManualTriggering, setIsManualTriggering] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [manualTriggerError, setManualTriggerError] = useState<string | null>(null)
  const [manualTriggerInfo, setManualTriggerInfo] = useState<string | null>(null)
  const [manualTargetEventId, setManualTargetEventId] = useState<number | null>(null)

  const [editingMatchId, setEditingMatchId] = useState<number | null>(null)
  const [draftParticipants, setDraftParticipants] = useState<ParticipantDraft[]>([])

  const eventMap = useMemo(() => new Map(events.map((event) => [event.id, event])), [events])
  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams])
  const blockMap = useMemo(() => new Map(blocks.map((block) => [block.id, block])), [blocks])

  const matchesWithEvent = useMemo(() => {
    return matches.map((match) => {
      const block = blockMap.get(match.eventBlockId)
      const eventId = block?.eventId ?? null
      return {
        ...match,
        eventId,
      }
    })
  }, [blockMap, matches])

  const filteredMatches = useMemo(() => {
    const query = matchNameQuery.trim().toLowerCase()

    return matchesWithEvent.filter((match) => {
      if (selectedEventId !== 'all' && match.eventId !== selectedEventId) return false
      if (selectedStatus !== 'all' && match.status !== selectedStatus) return false

      if (selectedTeamId !== 'all') {
        const hasTeam = match.participants.some((participant) => participant.teamId === selectedTeamId)
        if (!hasTeam) return false
      }

      if (query.length > 0) {
        const name = (match.name ?? '').toLowerCase()
        if (!name.includes(query)) return false
      }

      return true
    })
  }, [matchNameQuery, matchesWithEvent, selectedEventId, selectedStatus, selectedTeamId])

  const editingMatch = useMemo(
    () => matches.find((match) => match.id === editingMatchId) ?? null,
    [editingMatchId, matches],
  )

  async function loadData() {
    const masterResponse = await api.api.public.master.$get()
    if (!masterResponse.ok) {
      throw new Error(await parseErrorMessage(masterResponse, 'マスタ情報の取得に失敗しました'))
    }

    const master = await masterResponse.json() as {
      matches: MatchRow[]
      events: EventRow[]
      teams: TeamRow[]
      blocks: BlockRow[]
    }

    setMatches(master.matches)
    setEvents(master.events)
    setTeams(master.teams)
    setBlocks(master.blocks)
  }

  useEffect(() => {
    loadData()
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : '初期化に失敗しました')
      })
      .finally(() => setIsLoading(false))
  }, [])

  function startEdit(match: MatchRow) {
    setEditingMatchId(match.id)
    setDraftParticipants(
      match.participants.map((participant) => ({
        participantId: participant.id,
        teamId: participant.teamId,
        score: participant.score === null ? '' : String(participant.score),
        rank: participant.rank === null ? '' : String(participant.rank),
        isDisqualified: participant.isDisqualified,
      })),
    )
    setErrorMessage(null)
    setInfoMessage(null)
  }

  function cancelEdit() {
    setEditingMatchId(null)
    setDraftParticipants([])
  }

  function updateDraftParticipant(participantId: number, next: Partial<ParticipantDraft>) {
    setDraftParticipants((current) =>
      current.map((row) => (row.participantId === participantId ? { ...row, ...next } : row)),
    )
  }

  async function submitEdit() {
    if (!editingMatch) return

    const participants = draftParticipants.map((row) => {
      const score = toNullableInteger(row.score)
      const rank = toNullableInteger(row.rank)

      return {
        participantId: row.participantId,
        score,
        rank,
        isDisqualified: row.isDisqualified,
      }
    })

    if (participants.some((row) => Number.isNaN(row.score) || Number.isNaN(row.rank))) {
      setErrorMessage('スコア・順位は整数で入力してください（空欄は未設定）')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setInfoMessage(null)

    try {
      const response = await api.api.staff.matches[':matchId'].result.$patch({
        param: { matchId: String(editingMatch.id) },
        json: {
          participants,
        },
      })

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, '試合スコアの更新に失敗しました'))
      }

      await loadData()
      setInfoMessage(`試合ID ${editingMatch.id} のスコアを更新しました`)
      cancelEdit()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '試合スコアの更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function runManualTrigger(action: 'rankings' | 'advance' | 'score') {
    if (manualTargetEventId === null) {
      setManualTriggerError('手動トリガー対象のイベントを選択してください')
      setManualTriggerInfo(null)
      return
    }

    setIsManualTriggering(true)
    setManualTriggerError(null)
    setManualTriggerInfo(null)
    setErrorMessage(null)
    setInfoMessage(null)

    try {
      const response = action === 'rankings'
        ? await api.api.staff.events[':eventId'].rankings.$post({
            param: { eventId: manualTargetEventId },
          })
        : action === 'advance'
          ? await api.api.staff.events[':eventId'].advance.$post({
              param: { eventId: manualTargetEventId },
            })
          : await api.api.staff.events[':eventId'].score.$post({
            param: { eventId: manualTargetEventId },
          })

      if (!response.ok) {
        throw new Error(
          await parseErrorMessage(
            response,
            action === 'rankings'
              ? '予選順位確定に失敗しました'
              : action === 'advance'
                ? '勝ち上がり反映に失敗しました'
                : '得点再計算に失敗しました',
          ),
        )
      }

      await loadData()
      setManualTriggerInfo(
        action === 'rankings'
          ? `イベントID ${manualTargetEventId} の予選順位を確定しました`
          : action === 'advance'
            ? `イベントID ${manualTargetEventId} の勝ち上がりを反映しました`
            : `イベントID ${manualTargetEventId} の得点を再計算しました`,
      )
    } catch (error) {
      setManualTriggerError(
        error instanceof Error
          ? error.message
          : action === 'rankings'
            ? '予選順位確定に失敗しました'
            : action === 'advance'
              ? '勝ち上がり反映に失敗しました'
              : '得点再計算に失敗しました',
      )
    } finally {
      setIsManualTriggering(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">System Admin / Match Scores</p>
          <h1 className="mt-2 text-2xl font-semibold">試合ごとのスコア修正</h1>
          <p className="mt-2 text-sm text-slate-600">
            各試合の参加者スコア・順位を表示し、Staff API で直接修正します。
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
          <h2 className="text-lg font-semibold">手動トリガー（フォールバック）</h2>
          <p className="mt-1 text-sm text-slate-600">
            試合結果更新時の自動処理が動作しなかった場合のみ、ここからイベント単位で実行してください。
          </p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex min-w-[280px] flex-col gap-1 text-sm">
              <span className="text-slate-600">対象イベント</span>
              <select
                value={manualTargetEventId === null ? '' : manualTargetEventId}
                onChange={(event) =>
                  setManualTargetEventId(event.target.value.length === 0 ? null : Number(event.target.value))
                }
                className="rounded-md border border-slate-300 px-3 py-2"
                disabled={isManualTriggering}
              >
                <option value="">選択してください</option>
                {events.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id}: {item.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void runManualTrigger('rankings')
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                disabled={isManualTriggering}
              >
                予選順位を確定
              </button>
              <button
                type="button"
                onClick={() => {
                  void runManualTrigger('advance')
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                disabled={isManualTriggering}
              >
                勝ち上がり反映
              </button>
              <button
                type="button"
                onClick={() => {
                  void runManualTrigger('score')
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                disabled={isManualTriggering}
              >
                得点再計算
              </button>
            </div>
          </div>
          {manualTriggerError ? (
            <p className="mt-3 text-sm text-rose-700">{manualTriggerError}</p>
          ) : null}
          {manualTriggerInfo ? (
            <p className="mt-3 text-sm text-emerald-700">{manualTriggerInfo}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">フィルター</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">イベント</span>
              <select
                value={selectedEventId}
                onChange={(event) =>
                  setSelectedEventId(event.target.value === 'all' ? 'all' : Number(event.target.value))
                }
                className="rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="all">すべて</option>
                {events.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id}: {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">チーム</span>
              <select
                value={selectedTeamId}
                onChange={(event) =>
                  setSelectedTeamId(event.target.value === 'all' ? 'all' : Number(event.target.value))
                }
                className="rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="all">すべて</option>
                {teams.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id}: {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">試合ステータス</span>
              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as MatchStatus | 'all')
                }
                className="rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="all">すべて</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">試合名</span>
              <input
                value={matchNameQuery}
                onChange={(event) => setMatchNameQuery(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
                placeholder="部分一致"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">試合一覧</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  {['試合ID', 'イベント', 'ブロック', '試合名', 'ステータス', '参加者スコア', '操作'].map((label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((match) => {
                  const block = blockMap.get(match.eventBlockId)
                  const event = block ? eventMap.get(block.eventId) : null

                  return (
                    <tr key={match.id}>
                      <td className="border-b border-slate-100 px-3 py-3">{match.id}</td>
                      <td className="border-b border-slate-100 px-3 py-3">
                        {event ? `${event.id}: ${event.name}` : '-'}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3">
                        {block ? `${block.id}: ${block.name}` : '-'}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3">{match.name ?? '-'}</td>
                      <td className="border-b border-slate-100 px-3 py-3">{match.status}</td>
                      <td className="border-b border-slate-100 px-3 py-3">
                        <div className="flex flex-col gap-1">
                          {match.participants.map((participant) => (
                            <span key={participant.id}>
                              {participant.teamId === null
                                ? '未確定チーム'
                                : `${participant.teamId}: ${teamMap.get(participant.teamId)?.name ?? '不明'}`}
                              {' / '}S:{participant.score ?? '-'} R:{participant.rank ?? '-'}
                              {participant.isDisqualified ? ' (DQ)' : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3">
                        <button
                          type="button"
                          onClick={() => startEdit(match)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          編集
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                      該当する試合がありません
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">試合スコア編集</h2>
          {editingMatch ? (
            <div className="mt-3 flex flex-col gap-3">
              <p className="text-sm text-slate-600">
                対象試合: ID {editingMatch.id} / {editingMatch.name ?? '名称未設定'}
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-[720px] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr>
                      {['participantId', 'チーム', 'スコア', '順位', '失格'].map((label) => (
                        <th
                          key={label}
                          className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {draftParticipants.map((row) => (
                      <tr key={row.participantId}>
                        <td className="border-b border-slate-100 px-3 py-3">{row.participantId}</td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          {row.teamId === null
                            ? '未確定チーム'
                            : `${row.teamId}: ${teamMap.get(row.teamId)?.name ?? '不明'}`}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          <input
                            value={row.score}
                            onChange={(event) =>
                              updateDraftParticipant(row.participantId, { score: event.target.value })
                            }
                            className="w-28 rounded-md border border-slate-300 px-2 py-1"
                            inputMode="numeric"
                          />
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          <input
                            value={row.rank}
                            onChange={(event) =>
                              updateDraftParticipant(row.participantId, { rank: event.target.value })
                            }
                            className="w-28 rounded-md border border-slate-300 px-2 py-1"
                            inputMode="numeric"
                          />
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={row.isDisqualified}
                              onChange={(event) =>
                                updateDraftParticipant(row.participantId, {
                                  isDisqualified: event.target.checked,
                                })
                              }
                            />
                            <span>DQ</span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void submitEdit()
                  }}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                  disabled={isSubmitting}
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">一覧の「編集」から対象試合を選んでください。</p>
          )}
        </section>
      </div>
    </main>
  )
}
