'use client'

import { api } from '../../../lib/api/client'
import type { PublicMasterResponse } from '../../../../../api/src/schemas/public/master'
import { matchStageOptions } from '../create/constants'
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

type MapResponse = {
  id: number
  filePath: string
  displayName: string
  width: number
  height: number
}

type TeamResponse = {
  id: number
  name: string
}

type EventBlockResponse = {
  id: number
  eventId: number
  name: string
  type: 'LEAGUE' | 'TOURNAMENT' | 'CUMULATIVE' | 'SINGLE'
  stage:
    | 'FINAL'
    | 'THIRD_PLACE'
    | 'SEMIFINAL'
    | 'QUARTERFINAL'
    | 'ROUND_2'
    | 'ROUND_1'
    | 'QUALIFIER'
    | 'CONSOLATION'
}

type EventResponse = {
  id: number
  name: string
  description: string | null
  color: string | null
  ruleMd: string | null
  rankingOrder: 'ASC' | 'DESC'
  format: 'TOURNAMENT' | 'LEAGUE_TO_TOURNAMENT' | 'HEATS_AND_FINAL'
  pointAllocation: DataControlValue
  isCompleted: boolean
}

type EventRequest = Omit<EventResponse, 'id'> & {
  pointAllocation: Record<string, unknown>
}

type MatchResponse = {
  id: number
  eventBlockId: number
  locationId: number | null
  name: string | null
  description: string | null
  stage:
    | 'FINAL'
    | 'THIRD_PLACE'
    | 'SEMIFINAL'
    | 'QUARTERFINAL'
    | 'ROUND_2'
    | 'ROUND_1'
    | 'QUALIFIER'
    | 'CONSOLATION'
  status: 'Waiting' | 'Preparing' | 'Playing' | 'Finished' | 'Completed' | 'Cancelled'
  scheduledStartTime: string
  scheduledEndTime: string
  startedAt: string | null
  endedAt: string | null
  note: string | null
  participants: DataControlValue[]
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

async function fetchPublicMasterData() {
  const response = await api.api.public.master.$get()
  await ensureSuccess(response, 'マスタ情報の取得に失敗しました')
  return await response.json() as PublicMasterResponse
}

function omitReadonlyFields(fields: DataControlField[], input: Record<string, DataControlValue>) {
  return Object.fromEntries(
    fields
      .filter((field) => !field.readOnly && input[field.key] !== undefined)
      .map((field) => [field.key, input[field.key]]),
  )
}

export async function fetchAdminMasterOptions() {
  const master = await fetchPublicMasterData()

  return {
    masterData: master,
    mapOptions: master.maps.map((map) => ({
      label: `${map.id}: ${map.displayName}`,
      value: map.id,
    })),
    locationOptions: master.locations.map((location) => ({
      label: `${location.id}: ${location.name}`,
      value: location.id,
    })),
    eventOptions: master.events.map((event) => ({
      label: `${event.id}: ${event.name}`,
      value: event.id,
    })),
    eventBlockOptions: master.blocks.map((block) => {
      const eventName =
        master.events.find((event) => event.id === block.eventId)?.name ?? `event:${block.eventId}`

      return {
        label: `${block.id}: ${eventName} / ${block.name}`,
        value: block.id,
      }
    }),
  }
}

export function createAdminResourceDefinitions(
  mapOptions: DataControlOption[],
  locationOptions: DataControlOption[],
  eventOptions: DataControlOption[],
  eventBlockOptions: DataControlOption[],
) {
  const mapFields: DataControlField[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'number',
      readOnly: true,
      widthClassName: 'w-24',
    },
    {
      key: 'filePath',
      label: 'ファイルパス',
      type: 'text',
      required: true,
      placeholder: '/img/map/campus.svg',
    },
    {
      key: 'displayName',
      label: '表示名',
      type: 'text',
      required: true,
      placeholder: '例: 校内マップ',
    },
    {
      key: 'width',
      label: '幅',
      type: 'number',
      required: true,
      widthClassName: 'w-32',
    },
    {
      key: 'height',
      label: '高さ',
      type: 'number',
      required: true,
      widthClassName: 'w-32',
    },
  ]

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

  const eventFields: DataControlField[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'number',
      readOnly: true,
      widthClassName: 'w-24',
    },
    {
      key: 'name',
      label: 'イベント名',
      type: 'text',
      required: true,
    },
    {
      key: 'description',
      label: '説明',
      type: 'textarea',
      nullable: true,
    },
    {
      key: 'color',
      label: '色',
      type: 'text',
      nullable: true,
      placeholder: '#D9480F',
    },
    {
      key: 'ruleMd',
      label: 'ルール Markdown',
      type: 'textarea',
      nullable: true,
    },
    {
      key: 'rankingOrder',
      label: '順位方向',
      type: 'select',
      required: true,
      options: [
        { label: 'タイム系なら ASC', value: 'ASC' },
        { label: '得点系なら DESC', value: 'DESC' },
      ],
      description: 'タイム・秒数のように小さい値が勝ちなら ASC、得点のように大きい値が勝ちなら DESC を選びます。',
    },
    {
      key: 'format',
      label: '形式',
      type: 'select',
      required: true,
      options: [
        { label: 'TOURNAMENT', value: 'TOURNAMENT' },
        { label: 'LEAGUE_TO_TOURNAMENT', value: 'LEAGUE_TO_TOURNAMENT' },
        { label: 'HEATS_AND_FINAL', value: 'HEATS_AND_FINAL' },
      ],
    },
    {
      key: 'pointAllocation',
      label: '得点配分(JSON)',
      type: 'json',
      required: true,
    },
    {
      key: 'isCompleted',
      label: '完了済み',
      type: 'boolean',
      required: true,
    },
  ]

  const eventBlockFields: DataControlField[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'number',
      readOnly: true,
      widthClassName: 'w-24',
    },
    {
      key: 'eventId',
      label: 'イベント',
      type: 'select',
      required: true,
      options: eventOptions,
    },
    {
      key: 'name',
      label: 'ブロック名',
      type: 'text',
      required: true,
      placeholder: '例: Aブロック',
    },
    {
      key: 'type',
      label: 'ブロック種別',
      type: 'select',
      required: true,
      options: ['LEAGUE', 'TOURNAMENT', 'CUMULATIVE', 'SINGLE'].map((value) => ({
        label: value,
        value,
      })),
    },
    {
      key: 'stage',
      label: 'ステージ',
      type: 'select',
      required: true,
      options: matchStageOptions,
    },
  ]

  const matchFields: DataControlField[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'number',
      readOnly: true,
      widthClassName: 'w-24',
    },
    {
      key: 'eventBlockId',
      label: 'ブロック',
      type: 'select',
      required: true,
      options: eventBlockOptions,
    },
    {
      key: 'locationId',
      label: '会場',
      type: 'select',
      nullable: true,
      options: locationOptions,
    },
    {
      key: 'name',
      label: '試合名',
      type: 'text',
      nullable: true,
    },
    {
      key: 'description',
      label: '説明',
      type: 'textarea',
      nullable: true,
    },
    {
      key: 'stage',
      label: 'ステージ',
      type: 'select',
      required: true,
      options: matchStageOptions,
      description: '同一ブロック内で、その試合が何回戦・決勝・予選に当たるかを表します。',
    },
    {
      key: 'status',
      label: '状態',
      type: 'select',
      required: true,
      options: [
        'Waiting',
        'Preparing',
        'Playing',
        'Finished',
        'Completed',
        'Cancelled',
      ].map((value) => ({ label: value, value })),
      defaultValue: 'Waiting',
    },
    {
      key: 'scheduledStartTime',
      label: '開始予定',
      type: 'datetime',
      required: true,
    },
    {
      key: 'scheduledEndTime',
      label: '終了予定',
      type: 'datetime',
      required: true,
    },
    {
      key: 'startedAt',
      label: '開始実績',
      type: 'datetime',
      nullable: true,
    },
    {
      key: 'endedAt',
      label: '終了実績',
      type: 'datetime',
      nullable: true,
    },
    {
      key: 'note',
      label: '備考',
      type: 'textarea',
      nullable: true,
    },
    {
      key: 'participants',
      label: '参加枠(JSON)',
      type: 'json',
      readOnly: true,
    },
  ]

  const maps: DataControlResourceDefinition = {
    key: 'maps',
    label: 'マップ',
    description: '地図画像マスタを編集し、会場が参照するベースマップを管理します',
    fields: mapFields,
    primaryKey: 'id',
    async fetchRecords() {
      const response = await api.api.admin.maps.$get()
      await ensureSuccess(response, 'マップ一覧の取得に失敗しました')
      return await response.json() as MapResponse[]
    },
    async createRecord(input) {
      const response = await api.api.admin.maps.$post({
        json: omitReadonlyFields(mapFields, input) as Omit<MapResponse, 'id'>,
      })
      await ensureSuccess(response, 'マップの作成に失敗しました')
      return await response.json() as MapResponse
    },
    async updateRecord(id, input) {
      const response = await api.api.admin.maps[':id'].$put({
        param: { id: String(id) },
        json: omitReadonlyFields(mapFields, input) as Partial<Omit<MapResponse, 'id'>>,
      })
      await ensureSuccess(response, 'マップの更新に失敗しました')
      return await response.json() as MapResponse
    },
    async deleteRecord(id) {
      const response = await api.api.admin.maps[':id'].$delete({
        param: { id: String(id) },
      })
      await ensureSuccess(response, 'マップの削除に失敗しました')
    },
  }

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

  const events: DataControlResourceDefinition = {
    key: 'events',
    label: 'イベント',
    description: 'イベントマスタを編集し、JSON / CSV で入出力できます',
    fields: eventFields,
    primaryKey: 'id',
    async fetchRecords() {
      const response = await api.api.admin.events.$get()
      await ensureSuccess(response, 'イベント一覧の取得に失敗しました')
      return await response.json() as EventResponse[]
    },
    async createRecord(input) {
      const response = await api.api.admin.events.$post({
        json: omitReadonlyFields(eventFields, input) as EventRequest,
      })
      await ensureSuccess(response, 'イベントの作成に失敗しました')
      return await response.json() as EventResponse
    },
    async updateRecord(id, input) {
      const response = await api.api.admin.events[':id'].$put({
        param: { id: String(id) },
        json: omitReadonlyFields(eventFields, input) as Partial<EventRequest>,
      })
      await ensureSuccess(response, 'イベントの更新に失敗しました')
      return await response.json() as EventResponse
    },
    async deleteRecord(id) {
      const response = await api.api.admin.events[':id'].$delete({
        param: { id: String(id) },
      })
      await ensureSuccess(response, 'イベントの削除に失敗しました')
    },
  }

  const eventBlocks: DataControlResourceDefinition = {
    key: 'eventBlocks',
    label: 'イベントブロック',
    description: 'イベント配下のブロックを編集し、既存イベントへ紐づけられます',
    fields: eventBlockFields,
    primaryKey: 'id',
    async fetchRecords() {
      const response = await api.api.admin['event-blocks'].$get()
      await ensureSuccess(response, 'イベントブロック一覧の取得に失敗しました')
      return await response.json() as EventBlockResponse[]
    },
    async createRecord(input) {
      const response = await api.api.admin['event-blocks'].$post({
        json: omitReadonlyFields(eventBlockFields, input) as Omit<EventBlockResponse, 'id'>,
      })
      await ensureSuccess(response, 'イベントブロックの作成に失敗しました')
      return await response.json() as EventBlockResponse
    },
    async updateRecord(id, input) {
      const response = await api.api.admin['event-blocks'][':id'].$put({
        param: { id: String(id) },
        json: omitReadonlyFields(eventBlockFields, input) as Partial<Omit<EventBlockResponse, 'id'>>,
      })
      await ensureSuccess(response, 'イベントブロックの更新に失敗しました')
      return await response.json() as EventBlockResponse
    },
    async deleteRecord(id) {
      const response = await api.api.admin['event-blocks'][':id'].$delete({
        param: { id: String(id) },
      })
      await ensureSuccess(response, 'イベントブロックの削除に失敗しました')
    },
  }

  const matches: DataControlResourceDefinition = {
    key: 'matches',
    label: '試合',
    description: '試合計画を編集し、JSON / CSV で入出力できます',
    fields: matchFields,
    primaryKey: 'id',
    async fetchRecords() {
      const master = await fetchPublicMasterData()
      return master.matches as MatchResponse[]
    },
    async createRecord(input) {
      const response = await api.api.admin.matches.$post({
        json: omitReadonlyFields(matchFields, input) as Omit<MatchResponse, 'id' | 'participants'>,
      })
      await ensureSuccess(response, '試合の作成に失敗しました')
      return await response.json() as MatchResponse
    },
    async updateRecord(id, input) {
      const response = await api.api.admin.matches[':id'].$put({
        param: { id: String(id) },
        json: omitReadonlyFields(matchFields, input) as Partial<Omit<MatchResponse, 'id' | 'participants'>>,
      })
      await ensureSuccess(response, '試合の更新に失敗しました')
      return await response.json() as MatchResponse
    },
    async deleteRecord(id) {
      const response = await api.api.admin.matches[':id'].$delete({
        param: { id: String(id) },
      })
      await ensureSuccess(response, '試合の削除に失敗しました')
    },
  }

  return [maps, teams, locations, eventBlocks, events, matches]
}
