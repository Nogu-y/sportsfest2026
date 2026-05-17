export type DataControlValue = string | number | boolean | null

export type DataControlRecord = {
  [key: string]: DataControlValue
}

export type DataControlFieldType = 'text' | 'number' | 'boolean' | 'select'

export type DataControlOption = {
  label: string
  value: string | number
}

export type DataControlField = {
  key: string
  label: string
  type: DataControlFieldType
  required?: boolean
  readOnly?: boolean
  widthClassName?: string
  placeholder?: string
  description?: string
  options?: DataControlOption[]
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
