import type {
  DataControlField,
  DataControlImportFormat,
  DataControlRecord,
  DataControlValue,
} from './types'

const CSV_LINE_BREAK = /\r?\n/
const UTF8_BOM = '\uFEFF'

function escapeCsvValue(value: DataControlValue) {
  if (value === null || value === undefined) return ''

  const stringValue =
    typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (!/[,"\n]/.test(stringValue)) return stringValue

  return `"${stringValue.replaceAll('"', '""')}"`
}

export function exportRecordsAsJson(records: DataControlRecord[]) {
  return JSON.stringify(records, null, 2)
}

export function exportRecordsAsCsv(fields: DataControlField[], records: DataControlRecord[]) {
  const header = fields.map((field) => escapeCsvValue(field.key)).join(',')
  const lines = records.map((record) =>
    fields.map((field) => escapeCsvValue(record[field.key] ?? null)).join(','),
  )

  return [header, ...lines].join('\n')
}

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
        continue
      }

      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)

  return values
}

function stripBom(value: string) {
  return value.startsWith(UTF8_BOM) ? value.slice(1) : value
}

function parseCsvRecords(rawText: string) {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentValue = ''
  let inQuotes = false
  const text = stripBom(rawText)

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentValue += '"'
        index += 1
        continue
      }

      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentValue)
      currentValue = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1
      }

      currentRow.push(currentValue)
      if (currentRow.some((value) => value !== '')) {
        rows.push(currentRow)
      }
      currentRow = []
      currentValue = ''
      continue
    }

    currentValue += char
  }

  currentRow.push(currentValue)
  if (currentRow.some((value) => value !== '')) {
    rows.push(currentRow)
  }

  return rows
}

function normalizeBooleanValue(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1') return true
  if (normalized === 'false' || normalized === '0') return false
  return null
}

export function convertImportedValue(field: DataControlField, value: unknown): DataControlValue {
  if (value === null || value === undefined || value === '') {
    return field.nullable || !field.required ? null : ''
  }

  if (field.type === 'number') {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : value.toString()
  }

  if (field.type === 'boolean') {
    if (typeof value === 'boolean') return value

    const parsed = normalizeBooleanValue(String(value))
    return parsed ?? false
  }

  if (field.type === 'json') {
    if (typeof value === 'object') return value as DataControlValue
    return JSON.parse(String(value)) as DataControlValue
  }

  return String(value)
}

export function parseImportedRecords(
  format: DataControlImportFormat,
  fields: DataControlField[],
  rawText: string,
) {
  if (format === 'json') {
    const parsed = JSON.parse(stripBom(rawText))
    if (!Array.isArray(parsed)) {
      throw new Error('JSON は配列形式で指定してください')
    }

    return parsed.map((record) => normalizeImportedRecord(record, fields))
  }

  const rows = parseCsvRecords(rawText)
  if (rows.length === 0) return []

  const [headers, ...dataRows] = rows

  return dataRows.map((columns) => {
    const rawRecord = Object.fromEntries(headers.map((header, index) => [header, columns[index] ?? '']))
    return normalizeImportedRecord(rawRecord, fields)
  })
}

export function inferImportFormatFromText(rawText: string): DataControlImportFormat | null {
  const normalized = stripBom(rawText).trimStart()
  if (normalized.startsWith('[') || normalized.startsWith('{')) return 'json'
  if (normalized.includes(',') || CSV_LINE_BREAK.test(normalized)) return 'csv'
  return null
}

export function normalizeImportedRecord(
  record: Record<string, unknown>,
  fields: DataControlField[],
) {
  return fields.reduce<DataControlRecord>((acc, field) => {
    if (!(field.key in record)) return acc

    acc[field.key] = convertImportedValue(field, record[field.key])
    return acc
  }, {})
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}
