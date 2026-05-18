'use client'

import { useMemo, useState } from 'react'
import { EventBracket } from '../../bracket/EventBracket'
import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'

type BracketReferencePreviewProps = {
  masterData: PublicMasterResponse | null
}

export function BracketReferencePreview({ masterData }: BracketReferencePreviewProps) {
  const eventIds = useMemo(() => masterData?.events.map((event) => event.id) ?? [], [masterData])
  const [activeEventId, setActiveEventId] = useState<number | null>(eventIds[0] ?? null)

  if (!masterData || eventIds.length === 0) {
    return null
  }

  const currentEventId = activeEventId ?? eventIds[0]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">対戦表プレビュー（参照）</h3>
      <p className="mt-1 text-sm text-slate-600">
        既存マスタの対戦表を見ながら、入力内容を調整できます。
      </p>

      {eventIds.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {eventIds.map((eventId) => {
            const event = masterData.events.find((item) => item.id === eventId)
            const isActive = currentEventId === eventId

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

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        <EventBracket
          eventId={currentEventId}
          previewData={{
            events: masterData.events,
            eventBlocks: masterData.blocks,
            matches: masterData.matches,
            teams: masterData.teams,
          }}
        />
      </div>
    </section>
  )
}
