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
  try {
    const response = await api.api.public.master.$get()
    await ensureSuccess(response, 'マスタ情報の取得に失敗しました')
    const masterData = await response.json() as PublicMasterResponse

    const eventOptions: DataControlOption[] = masterData.events.map((event) => ({
      label: `${event.id}: ${event.name}`,
      value: event.id,
    }))

    const eventBlockOptions: DataControlOption[] = masterData.blocks.map((block) => {
      const eventName =
        masterData.events.find((event) => event.id === block.eventId)?.name ?? `event:${block.eventId}`

      return {
        label: `${block.id}: ${eventName} / ${block.name}`,
        value: block.id,
      }
    })

    const locationOptions: DataControlOption[] = masterData.locations.map((location) => ({
      label: `${location.id}: ${location.name}`,
      value: location.id,
    }))

    const mapOptions: DataControlOption[] = masterData.maps.map((map) => ({
      label: `${map.id}: ${map.displayName}`,
      value: map.id,
    }))

    return {
      masterData,
      eventOptions,
      eventBlockOptions,
      locationOptions,
      mapOptions,
      referenceLoadError: null,
    }
  } catch (error) {
    return {
      masterData: null,
      eventOptions: [],
      eventBlockOptions: [],
      locationOptions: [],
      mapOptions: [],
      referenceLoadError: error instanceof Error ? error.message : '参照データの取得に失敗しました',
    }
  }
}
