'use client'

import { api } from '../../../lib/api/client'
import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'
import type {
  DataControlField,
  DataControlOption,
  DataControlRecord,
  DataControlResourceDefinition,
  DataControlValue,
} from './types'

type LocationResponse = {
  id: number
  mapId: number
  name: string
  xRatio: number
  yRatio: number
}

type TeamResponse = {
  id: number
  name: string
}

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

function omitReadonlyFields(fields: DataControlField[], input: Record<string, DataControlValue>) {
  return Object.fromEntries(
    fields
      .filter((field) => !field.readOnly && input[field.key] !== undefined)
      .map((field) => [field.key, input[field.key]]),
  )
}

export async function fetchMapOptions(): Promise<DataControlOption[]> {
  const response = await api.api.public.master.$get()
  await ensureSuccess(response, 'マップ一覧の取得に失敗しました')

  const master = await response.json() as PublicMasterResponse

  return master.maps.map((map) => ({
    label: `${map.id}: ${map.displayName}`,
    value: map.id,
  }))
}

export function createAdminResourceDefinitions(mapOptions: DataControlOption[]) {
  const teamFields: DataControlField[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'number',
      readOnly: true,
      widthClassName: 'w-28',
    },
    {
      key: 'name',
      label: 'チーム名',
      type: 'text',
      required: true,
      placeholder: '例: 2A',
    },
  ]

  const locationFields: DataControlField[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'number',
      readOnly: true,
      widthClassName: 'w-24',
    },
    {
      key: 'mapId',
      label: 'マップ',
      type: 'select',
      required: true,
      options: mapOptions,
      widthClassName: 'w-40',
    },
    {
      key: 'name',
      label: '会場名',
      type: 'text',
      required: true,
      placeholder: '例: 第一体育館 Aコート',
    },
    {
      key: 'xRatio',
      label: 'X座標(%)',
      type: 'number',
      required: true,
      widthClassName: 'w-32',
    },
    {
      key: 'yRatio',
      label: 'Y座標(%)',
      type: 'number',
      required: true,
      widthClassName: 'w-32',
    },
  ]

  const teams: DataControlResourceDefinition = {
    key: 'teams',
    label: 'チーム',
    description: '参加チーム一覧の編集と入出力を行います',
    fields: teamFields,
    primaryKey: 'id',
    async fetchRecords() {
      const response = await api.api.admin.teams.$get()
      await ensureSuccess(response, 'チーム一覧の取得に失敗しました')
      return await response.json() as TeamResponse[]
    },
    async createRecord(input) {
      const response = await api.api.admin.teams.$post({
        json: omitReadonlyFields(teamFields, input) as { name: string },
      })
      await ensureSuccess(response, 'チームの作成に失敗しました')
      return await response.json() as TeamResponse
    },
    async updateRecord(id, input) {
      const response = await api.api.admin.teams[':id'].$put({
        param: { id: String(id) },
        json: omitReadonlyFields(teamFields, input) as { name: string },
      })
      await ensureSuccess(response, 'チームの更新に失敗しました')
      return await response.json() as TeamResponse
    },
    async deleteRecord(id) {
      const response = await api.api.admin.teams[':id'].$delete({
        param: { id: String(id) },
      })
      await ensureSuccess(response, 'チームの削除に失敗しました')
    },
  }

  const locations: DataControlResourceDefinition = {
    key: 'locations',
    label: '会場',
    description: '地図上の会場マスタを編集し、JSON / CSV で入出力できます',
    fields: locationFields,
    primaryKey: 'id',
    async fetchRecords() {
      const response = await api.api.admin.locations.$get()
      await ensureSuccess(response, '会場一覧の取得に失敗しました')
      return await response.json() as LocationResponse[]
    },
    async createRecord(input) {
      const response = await api.api.admin.locations.$post({
        json: omitReadonlyFields(locationFields, input) as Omit<LocationResponse, 'id'>,
      })
      await ensureSuccess(response, '会場の作成に失敗しました')
      return await response.json() as LocationResponse
    },
    async updateRecord(id, input) {
      const response = await api.api.admin.locations[':id'].$put({
        param: { id: String(id) },
        json: omitReadonlyFields(locationFields, input) as Partial<Omit<LocationResponse, 'id'>>,
      })
      await ensureSuccess(response, '会場の更新に失敗しました')
      return await response.json() as LocationResponse
    },
    async deleteRecord(id) {
      const response = await api.api.admin.locations[':id'].$delete({
        param: { id: String(id) },
      })
      await ensureSuccess(response, '会場の削除に失敗しました')
    },
  }

  return [teams, locations]
}
