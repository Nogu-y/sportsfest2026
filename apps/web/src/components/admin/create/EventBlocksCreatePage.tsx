'use client'

import { useEffect, useState } from 'react'
import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'
import { BracketReferencePreview } from './BracketReferencePreview'
import { createEventBlockFields } from './constants'
import { CreateHelperPage } from './CreateHelperPage'
import type { BuilderRow } from './helpers'
import { fetchCreateHelperMasterData } from './masterData'

function EventBlocksPreview({
  rows,
  masterData,
}: {
  rows: BuilderRow[]
  masterData: PublicMasterResponse | null
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
        まだプレビューできるブロックがありません
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => {
        const eventId = typeof row.eventId === 'number' ? row.eventId : Number(row.eventId)
        const eventName = masterData?.events.find((event) => event.id === eventId)?.name

        return (
          <article key={row._localId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{String(row.type ?? '未設定')}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {String(row.name ?? '名称未設定')}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              イベント: {eventName ?? `ID ${String(row.eventId ?? '未設定')}`}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              ステージ: {String(row.stage ?? '未設定')}
            </p>
          </article>
        )
      })}
    </div>
  )
}

export function EventBlocksCreatePage() {
  const [masterData, setMasterData] = useState<PublicMasterResponse | null>(null)
  const [referenceLoadError, setReferenceLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchCreateHelperMasterData().then(({ masterData, referenceLoadError }) => {
      setMasterData(masterData)
      setReferenceLoadError(referenceLoadError)
    })
  }, [])

  const eventOptions = masterData?.events.map((event) => ({
    label: `${event.id}: ${event.name}`,
    value: event.id,
  })) ?? []

  return (
    <CreateHelperPage
      title="イベントブロック入力補助"
      description="イベントに紐づくブロック定義を UI で積み上げ、Import した内容へ追記しながら JSON / CSV を出力できます。参照候補が取れない場合でも ID 手入力で作業できます。"
      exportBaseName="event-blocks-helper"
      fields={createEventBlockFields(eventOptions)}
      referenceLoadError={referenceLoadError}
      renderPreview={(rows) => (
        <div className="space-y-4">
          <EventBlocksPreview rows={rows} masterData={masterData} />
          <BracketReferencePreview masterData={masterData} />
        </div>
      )}
    />
  )
}
