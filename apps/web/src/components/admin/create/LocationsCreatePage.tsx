'use client'

import { useEffect, useState } from 'react'
import { BracketReferencePreview } from './BracketReferencePreview'
import { createLocationFields } from './constants'
import { CreateHelperPage } from './CreateHelperPage'
import type { BuilderRow } from './helpers'
import { fetchCreateHelperMasterData } from './masterData'
import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'

function LocationsPreview({
  rows,
  masterData,
}: {
  rows: BuilderRow[]
  masterData: PublicMasterResponse | null
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
        まだプレビューできる会場がありません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        追加予定会場: {rows.length} 件
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const mapId = typeof row.mapId === 'number' ? row.mapId : Number(row.mapId)
          const mapName = masterData?.maps.find((map) => map.id === mapId)?.displayName

          return (
            <article key={row._localId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Location</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {String(row.name ?? '名称未設定')}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                マップ: {mapName ?? `ID ${String(row.mapId ?? '未設定')}`}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                座標: ({String(row.xRatio ?? '-')}, {String(row.yRatio ?? '-')})
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export function LocationsCreatePage() {
  const [masterData, setMasterData] = useState<PublicMasterResponse | null>(null)
  const [referenceLoadError, setReferenceLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchCreateHelperMasterData().then(({ masterData, referenceLoadError }) => {
      setMasterData(masterData)
      setReferenceLoadError(referenceLoadError)
    })
  }, [])

  const mapOptions = masterData?.maps.map((map) => ({
    label: `${map.id}: ${map.displayName}`,
    value: map.id,
  })) ?? []

  return (
    <CreateHelperPage
      title="会場入力補助"
      description="会場定義を UI で積み上げ、Import した内容へ追記しながら JSON / CSV を出力できます。"
      exportBaseName="locations-helper"
      fields={createLocationFields(mapOptions)}
      referenceLoadError={referenceLoadError}
      renderPreview={(rows) => (
        <div className="space-y-4">
          <LocationsPreview rows={rows} masterData={masterData} />
          <BracketReferencePreview masterData={masterData} />
        </div>
      )}
    />
  )
}
