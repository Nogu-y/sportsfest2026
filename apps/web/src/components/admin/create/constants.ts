import type { DataControlField, DataControlOption, DataControlPreset } from '../data-control/types'

export const eventFormatOptions: DataControlOption[] = [
  { label: 'TOURNAMENT', value: 'TOURNAMENT' },
  { label: 'LEAGUE_TO_TOURNAMENT', value: 'LEAGUE_TO_TOURNAMENT' },
  { label: 'HEATS_AND_FINAL', value: 'HEATS_AND_FINAL' },
]

export const rankingOrderOptions: DataControlOption[] = [
  { label: 'タイム系なら ASC', value: 'ASC' },
  { label: '得点系なら DESC', value: 'DESC' },
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
    description: 'タイム・秒数のように小さい値が勝ちなら ASC、得点のように大きい値が勝ちなら DESC を選びます。',
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

export const teamCreateFields: DataControlField[] = [
  {
    key: 'name',
    label: 'チーム名',
    type: 'text',
    required: true,
    placeholder: '例: 1-1',
  },
]

export function createLocationFields(mapOptions: DataControlOption[]): DataControlField[] {
  return [
    {
      key: 'mapId',
      label: 'マップ',
      type: 'select',
      required: true,
      options: mapOptions,
      allowCustomValue: true,
      customValueType: 'number',
      customValueLabel: 'マップIDを直接入力',
      customValuePlaceholder: '例: 1',
    },
    {
      key: 'name',
      label: '会場名',
      type: 'text',
      required: true,
      placeholder: '例: グラウンドA',
    },
    {
      key: 'xRatio',
      label: 'X座標比率',
      type: 'number',
      required: true,
      placeholder: '0-100',
    },
    {
      key: 'yRatio',
      label: 'Y座標比率',
      type: 'number',
      required: true,
      placeholder: '0-100',
    },
  ]
}

export function createMatchFields(
  eventBlockOptions: DataControlOption[],
  locationOptions: DataControlOption[],
  teamOptions: DataControlOption[],
  prereqMatchOptions: DataControlOption[],
): DataControlField[] {
  return [
    {
      key: 'eventBlockId',
      label: 'ブロック',
      type: 'select',
      required: true,
      options: eventBlockOptions,
      allowCustomValue: true,
      customValueType: 'number',
      customValueLabel: 'ブロックIDを直接入力',
      customValuePlaceholder: '例: 12',
    },
    {
      key: 'locationId',
      label: '会場',
      type: 'select',
      nullable: true,
      options: locationOptions,
      allowCustomValue: true,
      customValueType: 'number',
      customValueLabel: '会場IDを直接入力',
      customValuePlaceholder: '例: 5',
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
      key: 'note',
      label: '備考',
      type: 'textarea',
      nullable: true,
    },
    {
      key: 'participants',
      label: '参加枠(GUI / JSON)',
      type: 'json',
      required: true,
      presets: [
        { label: '空', value: [] },
        {
          label: '2チーム直接指定',
          value: [
            { teamId: 1 },
            { teamId: 2 },
          ],
        },
        {
          label: '勝ち上がり2枠',
          value: [
            { prereqMatchId: 1 },
            { prereqMatchId: 2 },
          ],
        },
      ],
      participantTeamOptions: teamOptions,
      participantPrereqMatchOptions: prereqMatchOptions,
      participantPrereqBlockOptions: eventBlockOptions,
    },
  ]
}

export function createEventBlockFields(eventOptions: DataControlOption[]): DataControlField[] {
  return [
    {
      key: 'eventId',
      label: 'イベント',
      type: 'select',
      required: true,
      options: eventOptions,
      allowCustomValue: true,
      customValueType: 'number',
      customValueLabel: 'イベントIDを直接入力',
      customValuePlaceholder: '例: 8',
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
      options: [
        { label: 'LEAGUE', value: 'LEAGUE' },
        { label: 'TOURNAMENT', value: 'TOURNAMENT' },
        { label: 'CUMULATIVE', value: 'CUMULATIVE' },
        { label: 'SINGLE', value: 'SINGLE' },
      ],
    },
    {
      key: 'stage',
      label: 'ステージ',
      type: 'select',
      required: true,
      options: matchStageOptions,
    },
  ]
}
