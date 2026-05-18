'use client'

import { CreateHelperPage } from './CreateHelperPage'
import { eventCreateFields } from './constants'
import type { BuilderRow } from './helpers'

function EventsPreview({ rows }: { rows: BuilderRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
        まだプレビューできるイベントがありません
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <article
          key={row._localId}
          className="rounded-2xl border border-slate-200 p-5 text-white shadow-sm"
          style={{ backgroundColor: typeof row.color === 'string' && row.color ? row.color : '#3b6e9b' }}
        >
          <p className="text-xs font-medium opacity-80">{String(row.format ?? '')}</p>
          <h3 className="mt-2 text-xl font-bold">{String(row.name ?? '名称未設定')}</h3>
          <p className="mt-3 line-clamp-4 text-sm opacity-90">
            {typeof row.description === 'string' && row.description
              ? row.description
              : '説明はまだ設定されていません'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/20 px-2 py-1">
              順位方向: {String(row.rankingOrder ?? '-')}
            </span>
            <span className="rounded-full bg-white/20 px-2 py-1">
              完了: {row.isCompleted ? 'true' : 'false'}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

export function EventsCreatePage() {
  return (
    <CreateHelperPage
      title="イベント入力補助"
      description="イベント定義を UI で積み上げ、Import した内容に追記しながら JSON / CSV を新規出力できます。"
      exportBaseName="events-helper"
      fields={eventCreateFields}
      renderPreview={(rows) => <EventsPreview rows={rows} />}
    />
  )
}
