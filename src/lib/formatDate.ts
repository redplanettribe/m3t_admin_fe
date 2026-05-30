const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function parseCalendarDate(value: string): Date | null {
  const trimmed = value.trim()
  if (!DATE_ONLY_PATTERN.test(trimmed)) return null
  const [year, month, day] = trimmed.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const calendarDate = parseCalendarDate(trimmed)
  if (calendarDate) return calendarDate

  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

function isMidnightUtc(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  )
}

function shouldShowTimeOnly(value: string, date: Date): boolean {
  if (DATE_ONLY_PATTERN.test(value.trim())) return false
  return !isMidnightUtc(date)
}

export function formatDateOnly(value?: string): string {
  if (!value) return "—"
  const date = parseDate(value)
  if (!date) return value
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(value?: string): string {
  if (!value) return "—"
  const date = parseDate(value)
  if (!date) return value

  if (!shouldShowTimeOnly(value, date)) {
    return formatDateOnly(value)
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
