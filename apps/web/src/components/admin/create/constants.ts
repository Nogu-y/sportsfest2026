import type { DataControlField, DataControlOption, DataControlPreset } from '../data-control/types'

export const eventFormatOptions: DataControlOption[] = [
  { label: 'TOURNAMENT', value: 'TOURNAMENT' },
  { label: 'LEAGUE_TO_TOURNAMENT', value: 'LEAGUE_TO_TOURNAMENT' },
  { label: 'HEATS_AND_FINAL', value: 'HEATS_AND_FINAL' },
]

export const rankingOrderOptions: DataControlOption[] = [
  { label: 'ASC', value: 'ASC' },
  { label: 'DESC', value: 'DESC' },
]

export const matchStageOptions: DataControlOption[] = [
  'FINAL',
  'THIRD_PLACE',
  'SEMIFINAL',
  'QUARTERFINAL',
  'ROUND_2',
  'ROUND_1',
  'QUALIFIER',
  'CONSOLATION',
].map((value) => ({ label: value, value }))

export const matchStatusOptions: DataControlOption[] = [
  'Waiting',
  'Preparing',
  'Playing',
  'Finished',
  'Completed',
  'Cancelled',
].map((value) => ({ label: value, value }))

export const pointAllocationScopeOptions: DataControlOption[] = [
  { label: 'MATCH', value: 'MATCH' },
  { label: 'BLOCK', value: 'BLOCK' },
]

const pointAllocationPresets: DataControlPreset[] = [
  {
    label: '空',
    value: {},
  },
  {
    label: 'ソフトテニス',
    value: {
      MATCH: {
        FINAL: {
          '1': 1000,
          '2': 800,
        },
        THIRD_PLACE: {
          '1': 600,
          '2': 500,
        },
      },
      BLOCK: {
        QUALIFIER: {
          '1': 300,
          '2': 100,
        },
      },
    },
  },
  {
    label: 'バレーボール',
    value: {
      MATCH: {
        FINAL: {
          '1': 1000,
          '2': 800,
        },
        SEMIFINAL: {
          '2': 600,
        },
        ROUND_2: {
          '1': 300,
        },
        ROUND_1: {
          '1': 100,
        },
      },
    },
  },
  {
    label: 'バドミントン',
    value: {
      MATCH: {
        FINAL: {
          '1': 1000,
          '2': 800,
        },
        THIRD_PLACE: {
          '1': 600,
          '2': 500,
        },
        ROUND_2: {
          '1': 300,
        },
        ROUND_1: {
          '1': 200,
          '2': 100,
        },
      },
    },
  },
  {
    label: 'ソフトボール',
    value: {
      MATCH: {
        FINAL: {
          '1': 1000,
          '2': 800,
        },
        THIRD_PLACE: {
          '1': 600,
          '2': 500,
        },
        QUARTERFINAL: {
          '1': 300,
        },
        ROUND_2: {
          '1': 200,
        },
        ROUND_1: {
          '1': 100,
        },
      },
    },
  },
  {
    label: 'バスケットボール',
    value: {
      MATCH: {
        FINAL: {
          '1': 1000,
          '2': 800,
        },
        SEMIFINAL: {
          '2': 600,
        },
      },
      BLOCK: {
        QUALIFIER: {
          '1': 400,
          '2': 200,
          '3': 100,
        },
      },
    },
  },
  {
    label: '借り人競争・選抜リレー',
    value: {
      MATCH: {
        FINAL: {
          '1': 1000,
          '2': 800,
          '3': 600,
          '4': 400,
          '5': 200,
          '6': 100,
        },
      },
      BLOCK: {
        QUALIFIER: {
          '2': 50,
        },
      },
    },
  },
]

export const eventCreateFields: DataControlField[] = [
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
    options: rankingOrderOptions,
  },
  {
    key: 'format',
    label: '形式',
    type: 'select',
    required: true,
    options: eventFormatOptions,
  },
  {
    key: 'pointAllocation',
    label: '得点配分(GUI / JSON)',
    type: 'json',
    required: true,
    presets: pointAllocationPresets,
  },
  {
    key: 'isCompleted',
    label: '完了済み',
    type: 'boolean',
    required: true,
  },
]

export function createMatchFields(
  eventBlockOptions: DataControlOption[],
  locationOptions: DataControlOption[],
): DataControlField[] {
  return [
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
    },
    {
      key: 'status',
      label: '状態',
      type: 'select',
      required: true,
      options: matchStatusOptions,
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
  ]
}
