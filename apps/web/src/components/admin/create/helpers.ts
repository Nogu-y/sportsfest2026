import type { DataControlField, DataControlValue } from '../data-control/types'

export type BuilderRow = Record<string, DataControlValue> & {
  _localId: number
}

const DEFAULT_DATE = '2026-05-21'

function createDefaultDateTimeValue(fieldKey: string) {
  const localValue = fieldKey.toLowerCase().includes('end')
    ? `${DEFAULT_DATE}T09:30`
    : `${DEFAULT_DATE}T09:00`

  return new Date(localValue).toISOString()
}

export function formatDateTimeInputValue(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function toDisplayValue(value: DataControlValue) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function resolveDefaultValue(field: DataControlField) {
  if (field.defaultValue !== undefined) return field.defaultValue

  if (field.type === 'boolean') {
    return false
  }

  if (field.type === 'json') {
    return {}
  }

  if (field.type === 'datetime') {
    return createDefaultDateTimeValue(field.key)
  }

  return field.nullable ? null : ''
}

export function createInitialDraft(
  fields: DataControlField[],
  overrides: Record<string, DataControlValue> = {},
) {
  return fields.reduce<Record<string, DataControlValue>>((acc, field) => {
    if (field.key in overrides) {
      acc[field.key] = overrides[field.key]
      return acc
    }

    acc[field.key] = resolveDefaultValue(field)
    return acc
  }, {})
}

export function normalizeDraftValue(field: DataControlField, rawValue: string) {
  if (field.type === 'number') {
    if (rawValue === '') return field.nullable ? null : ''
    return Number(rawValue)
  }

  if (field.type === 'boolean') {
    return rawValue === 'true'
  }

  if (field.type === 'select') {
    if (rawValue === '') return field.nullable ? null : ''
    const numericValue = Number(rawValue)
    return Number.isNaN(numericValue) ? rawValue : numericValue
  }

  if (field.type === 'datetime') {
    if (rawValue === '') return field.nullable ? null : ''
    return new Date(rawValue).toISOString()
  }

  if (field.type === 'json') {
    return rawValue
  }

  if (rawValue === '' && field.nullable) return null
  return rawValue
}

export function prepareDraftForSubmit(
  fields: DataControlField[],
  draft: Record<string, DataControlValue>,
) {
  return fields.reduce<Record<string, DataControlValue>>((acc, field) => {
    const value = draft[field.key]

    if (value === undefined) return acc

    if (field.type === 'json' && typeof value === 'string') {
      const normalized = value.trim()
      acc[field.key] = normalized === '' ? (field.nullable ? null : {}) : JSON.parse(normalized)
      return acc
    }

    acc[field.key] = value
    return acc
  }, {})
}

export function validateDraft(fields: DataControlField[], draft: Record<string, DataControlValue>) {
  const missingField = fields.find((field) => {
    if (!field.required) return false
    const value = draft[field.key]
    return value === '' || value === null || value === undefined
  })

  if (missingField) {
    throw new Error(`${missingField.label} は必須です`)
  }
}

export function validateParticipantsValue(value: DataControlValue) {
  if (!Array.isArray(value)) {
    throw new Error('参加枠は配列で指定してください')
  }

  value.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`参加枠 ${index + 1} 行目: オブジェクト形式で指定してください`)
    }

    const record = item as Record<string, unknown>
    const teamId = typeof record.teamId === 'number' ? record.teamId : null
    const prereqMatchId = typeof record.prereqMatchId === 'number' ? record.prereqMatchId : null
    const prereqBlockId = typeof record.prereqBlockId === 'number' ? record.prereqBlockId : null
    const prereqRank = typeof record.prereqRank === 'number' ? record.prereqRank : null
    const rowNumber = index + 1

    const sourceCount =
      (teamId !== null ? 1 : 0) +
      (prereqMatchId !== null ? 1 : 0) +
      (prereqBlockId !== null ? 1 : 0)

    if (sourceCount !== 1) {
      throw new Error(
        `参加枠 ${rowNumber} 行目: teamId / prereqMatchId / prereqBlockId は1つだけ指定してください`,
      )
    }

    if (prereqBlockId !== null) {
      if (prereqRank === null || !Number.isInteger(prereqRank) || prereqRank < 1) {
        throw new Error(`参加枠 ${rowNumber} 行目: prereqBlockId を使う場合 prereqRank は1以上の整数が必須です`)
      }
    } else if (prereqRank !== null) {
      throw new Error(`参加枠 ${rowNumber} 行目: prereqRank は prereqBlockId 指定時のみ設定できます`)
    }
  })
}

export function buildDraftFromRow(fields: DataControlField[], row: BuilderRow) {
  return fields.reduce<Record<string, DataControlValue>>((acc, field) => {
    if (row[field.key] !== undefined) {
      acc[field.key] = row[field.key]
      return acc
    }

    acc[field.key] = resolveDefaultValue(field)
    return acc
  }, {})
}

export function attachLocalIds(rows: Record<string, DataControlValue>[], startId = 1) {
  return rows.map((row, index) => ({
    ...row,
    _localId: startId + index,
  }))
}

export function stripLocalIds(rows: BuilderRow[]) {
  return rows.map(({ _localId, ...rest }) => rest)
}
