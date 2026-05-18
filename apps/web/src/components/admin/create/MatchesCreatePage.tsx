'use client'

import { useEffect, useMemo, useState } from 'react'
import { EventBracket } from '../../bracket/EventBracket'
import { createMatchFields } from './constants'
import { CreateHelperPage } from './CreateHelperPage'
import type { BuilderRow } from './helpers'
import { fetchCreateHelperMasterData } from './masterData'
import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'

function MatchesPreview({
  rows,
  masterData,
}: {
  rows: BuilderRow[]
  masterData: PublicMasterResponse
}) {
  const [activeEventId, setActiveEventId] = useState<number | null>(null)

  const previewMatches = useMemo(() => {
    const maxId = masterData.matches.reduce((max, match) => Math.max(max, match.id), 0)

    return rows.map((row, index) => ({
      id: maxId + index + 1,
      eventBlockId: Number(row.eventBlockId),
      locationId: typeof row.locationId === 'number' ? row.locationId : null,
      name: typeof row.name === 'string' && row.name ? row.name : null,
      description: typeof row.description === 'string' && row.description ? row.description : null,
      stage: String(row.stage || 'FINAL') as PublicMasterResponse['matches'][number]['stage'],
      status: String(row.status || 'Waiting') as PublicMasterResponse['matches'][number]['status'],
      scheduledStartTime: String(row.scheduledStartTime || new Date().toISOString()),
      scheduledEndTime: String(row.scheduledEndTime || new Date().toISOString()),
      startedAt: typeof row.startedAt === 'string' ? row.startedAt : null,
      endedAt: typeof row.endedAt === 'string' ? row.endedAt : null,
      note: typeof row.note === 'string' && row.note ? row.note : null,
      participants: [],
    }))
  }, [masterData.matches, rows])

  const eventIds = useMemo(() => {
    const ids = previewMatches
      .map((match) => masterData.blocks.find((block) => block.id === match.eventBlockId)?.eventId)
      .filter((value): value is number => typeof value === 'number')

    return Array.from(new Set(ids))
  }, [masterData.blocks, previewMatches])

  useEffect(() => {
    setActiveEventId(eventIds[0] ?? null)
  }, [eventIds])

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
        まだプレビューできる試合計画がありません
      </div>
    )
  }

  if (eventIds.length === 0 || activeEventId === null) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
        指定されたブロックに紐づくイベントが見つかりません
      </div>
    )
  }

  const selectedEvent = masterData.events.find((event) => event.id === activeEventId)
  const selectedMatches = previewMatches.filter((match) => {
    const eventId = masterData.blocks.find((block) => block.id === match.eventBlockId)?.eventId
    return eventId === activeEventId
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-600">積み上げ中の試合計画</p>
        <p className="mt-1 text-sm text-slate-500">
          プレビュー対象イベント: {selectedEvent?.name ?? '不明'} / {selectedMatches.length} 件
        </p>
      </div>

      {eventIds.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {eventIds.map((eventId) => {
            const event = masterData.events.find((item) => item.id === eventId)
            const isActive = activeEventId === eventId
            return (
              <button
                key={eventId}
                type="button"
                onClick={() => setActiveEventId(eventId)}
                className={
                  isActive
                    ? 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white'
                    : 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700'
                }
              >
                {event?.name ?? `event:${eventId}`}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <EventBracket
          eventId={activeEventId}
          previewData={{
            events: masterData.events,
            eventBlocks: masterData.blocks,
            matches: selectedMatches,
            teams: masterData.teams,
          }}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold">スケジュール簡易プレビュー</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {selectedMatches.map((match) => {
            const location = match.locationId
              ? masterData.locations.find((item) => item.id === match.locationId)?.name
              : '会場未設定'

            return (
              <article key={match.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">{match.status}</p>
                <h4 className="mt-1 text-lg font-semibold text-slate-900">
                  {match.name ?? '名称未設定'}
                </h4>
                <p className="mt-2 text-sm text-slate-600">{location}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {new Date(match.scheduledStartTime).toLocaleString('ja-JP')} -
                  {' '}
                  {new Date(match.scheduledEndTime).toLocaleString('ja-JP')}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function MatchesCreatePage() {
  const [masterData, setMasterData] = useState<PublicMasterResponse | null>(null)
  const [referenceLoadError, setReferenceLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchCreateHelperMasterData()
      .then(({ masterData, referenceLoadError }) => {
        setMasterData(masterData)
        setReferenceLoadError(referenceLoadError)
      })
  }, [])

  const eventBlockOptions = masterData?.blocks.map((block) => {
    const eventName =
      masterData.events.find((event) => event.id === block.eventId)?.name ?? `event:${block.eventId}`

    return {
      label: `${block.id}: ${eventName} / ${block.name}`,
      value: block.id,
    }
  }) ?? []
  const locationOptions = masterData?.locations.map((location) => ({
    label: `${location.id}: ${location.name}`,
    value: location.id,
  })) ?? []

  return (
    <CreateHelperPage
      title="試合計画入力補助"
      description="試合計画を UI で積み上げ、Import した内容へ追記しながら JSON / CSV を出力できます。既存の対戦表コンポーネントによる視覚プレビュー付きです。"
      exportBaseName="matches-helper"
      fields={createMatchFields(eventBlockOptions, locationOptions)}
      referenceLoadError={referenceLoadError}
      renderPreview={
        masterData
          ? (rows) => <MatchesPreview rows={rows} masterData={masterData} />
          : undefined
      }
    />
  )
}
