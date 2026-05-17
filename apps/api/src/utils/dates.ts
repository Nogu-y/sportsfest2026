export const toIsoString = (value: Date | null) => {
  if (!value) {
    return null
  }

  return value.toISOString()
}

export const toUnixTime = (value: Date | null) => {
  if (!value) {
    return null
  }

  return value.getTime()
}
