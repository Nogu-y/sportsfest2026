export type DataControlJsonValue =
  | string
  | number
  | boolean
  | null
  | DataControlJsonValue[]
  | { [key: string]: DataControlJsonValue }

export type DataControlValue = DataControlJsonValue

export type DataControlRecord = {
  [key: string]: DataControlValue
}

export type DataControlFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'datetime'
  | 'json'

export type DataControlOption = {
  label: string
  value: string | number
}

export type DataControlPreset = {
  label: string
  value: DataControlValue
}

export type DataControlField = {
  key: string
  label: string
  type: DataControlFieldType
  required?: boolean
  nullable?: boolean
  readOnly?: boolean
  widthClassName?: string
  placeholder?: string
  description?: string
  options?: DataControlOption[]
  presets?: DataControlPreset[]
  allowCustomValue?: boolean
  customValueType?: 'text' | 'number'
  customValueLabel?: string
  customValuePlaceholder?: string
  participantTeamOptions?: DataControlOption[]
  participantPrereqMatchOptions?: DataControlOption[]
  participantPrereqBlockOptions?: DataControlOption[]
}

export type DataControlImportFormat = 'json' | 'csv'

export type DataControlResourceDefinition = {
  key: string
  label: string
  description: string
  fields: DataControlField[]
  primaryKey: string
  fetchRecords: () => Promise<DataControlRecord[]>
  createRecord: (input: Record<string, DataControlValue>) => Promise<DataControlRecord>
  updateRecord: (
    id: number,
    input: Record<string, DataControlValue>,
  ) => Promise<DataControlRecord>
  deleteRecord: (id: number) => Promise<void>
}
