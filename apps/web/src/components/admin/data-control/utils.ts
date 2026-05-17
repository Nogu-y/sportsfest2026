import type {
  DataControlField,
  DataControlImportFormat,
  DataControlRecord,
  DataControlValue,
} from './types'

const CSV_LINE_BREAK = /\r?\n/

function escapeCsvValue(value: DataControlValue) {
  if (value === null || value === undefined) return ''

  const stringValue = String(value)
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

function normalizeBooleanValue(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1') return true
  if (normalized === 'false' || normalized === '0') return false
  return null
}

export function convertImportedValue(field: DataControlField, value: unknown): DataControlValue {
  if (value === null || value === undefined || value === '') {
    return field.required ? '' : null
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

  return String(value)
}

export function parseImportedRecords(
  format: DataControlImportFormat,
  fields: DataControlField[],
  rawText: string,
) {
  if (format === 'json') {
    const parsed = JSON.parse(rawText)
    if (!Array.isArray(parsed)) {
      throw new Error('JSON は配列形式で指定してください')
    }

    return parsed.map((record) => normalizeImportedRecord(record, fields))
  }

  const lines = rawText.trim().split(CSV_LINE_BREAK).filter(Boolean)
  if (lines.length === 0) return []

  const [headerLine, ...dataLines] = lines
  const headers = parseCsvLine(headerLine)

  return dataLines.map((line) => {
    const columns = parseCsvLine(line)
    const rawRecord = Object.fromEntries(headers.map((header, index) => [header, columns[index] ?? '']))
    return normalizeImportedRecord(rawRecord, fields)
  })
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
