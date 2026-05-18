'use client'

import { api } from '../../../lib/api/client'
import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'
import type { DataControlOption } from '../data-control/types'

async function readErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const data = await response.json() as { message?: string }
    return data.message ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

async function ensureSuccess(response: Response, fallbackMessage: string) {
  if (response.ok) return
  throw new Error(await readErrorMessage(response, fallbackMessage))
}

export async function fetchCreateHelperMasterData() {
  const response = await api.api.public.master.$get()
  await ensureSuccess(response, 'マスタ情報の取得に失敗しました')
  const masterData = await response.json() as PublicMasterResponse

  const eventBlockOptions: DataControlOption[] = masterData.blocks.map((block) => ({
    label: `${block.id}: ${block.name}`,
    value: block.id,
  }))

  const locationOptions: DataControlOption[] = masterData.locations.map((location) => ({
    label: `${location.id}: ${location.name}`,
    value: location.id,
  }))

  return {
    masterData,
    eventBlockOptions,
    locationOptions,
  }
}
