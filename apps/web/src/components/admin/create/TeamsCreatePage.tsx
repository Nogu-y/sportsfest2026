'use client'

import { useEffect, useState } from 'react'
import { BracketReferencePreview } from './BracketReferencePreview'
import { CreateHelperPage } from './CreateHelperPage'
import { teamCreateFields } from './constants'
import type { BuilderRow } from './helpers'
import { fetchCreateHelperMasterData } from './masterData'
import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'

function TeamsPreview({ rows }: { rows: BuilderRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
        まだプレビューできるチームがありません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        追加予定チーム: {rows.length} 件
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article key={row._localId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Team</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {String(row.name ?? '名称未設定')}
            </h3>
          </article>
        ))}
      </div>
    </div>
  )
}

export function TeamsCreatePage() {
  const [masterData, setMasterData] = useState<PublicMasterResponse | null>(null)
  const [referenceLoadError, setReferenceLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchCreateHelperMasterData().then(({ masterData, referenceLoadError }) => {
      setMasterData(masterData)
      setReferenceLoadError(referenceLoadError)
    })
  }, [])

  return (
    <CreateHelperPage
      title="チーム入力補助"
      description="チーム定義を UI で積み上げ、Import した内容へ追記しながら JSON / CSV を出力できます。"
      exportBaseName="teams-helper"
      fields={teamCreateFields}
      referenceLoadError={referenceLoadError}
      renderPreview={(rows) => (
        <div className="space-y-4">
          <TeamsPreview rows={rows} />
          <BracketReferencePreview masterData={masterData} />
        </div>
      )}
    />
  )
}
