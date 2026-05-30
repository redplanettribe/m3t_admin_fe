import { formatDateOnly, formatDateTime } from "@/lib/formatDate"
import type {
  EventCheckInTimeline,
  EventCheckInTimelineBucket,
  EventCheckInTimelineGranularity,
} from "@/types/event"

export interface EventCheckInTimelineChartPoint {
  bucketStart: string
  label: string
  checkIns: number
}

function bucketAxisLabel(
  bucketStart: string,
  granularity: EventCheckInTimelineGranularity,
  showDate: boolean
): string {
  const date = new Date(bucketStart)
  if (Number.isNaN(date.getTime())) return bucketStart

  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: granularity === "15min" ? "2-digit" : undefined,
  }
  const time = date.toLocaleTimeString(undefined, timeOpts)

  if (!showDate) return time

  const dateLabel = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
  return `${dateLabel} ${time}`
}

function spansMultipleDays(buckets: EventCheckInTimelineBucket[]): boolean {
  const dates = new Set<string>()
  for (const bucket of buckets) {
    if (!bucket.bucket_start) continue
    const date = new Date(bucket.bucket_start)
    if (Number.isNaN(date.getTime())) continue
    dates.add(date.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }))
    if (dates.size > 1) return true
  }
  return false
}

export function mapCheckInTimelineBuckets(
  buckets: EventCheckInTimelineBucket[],
  granularity: EventCheckInTimelineGranularity
): EventCheckInTimelineChartPoint[] {
  const showDate = spansMultipleDays(buckets)

  return buckets
    .filter((bucket) => bucket.bucket_start)
    .map((bucket) => {
      const bucketStart = bucket.bucket_start!
      return {
        bucketStart,
        label: bucketAxisLabel(bucketStart, granularity, showDate),
        checkIns: bucket.check_in_count ?? 0,
      }
    })
}

export function formatCheckInTimelineRangeLabel(
  result: EventCheckInTimeline | undefined
): string | null {
  if (!result) return null

  const from = result.from
  const to = result.to
  const timezone = result.timezone?.trim()

  let range: string | null = null
  if (from && to) {
    range = `${formatDateOnly(from)} – ${formatDateOnly(to)}`
  } else if (from) {
    range = `From ${formatDateOnly(from)}`
  } else if (to) {
    range = `Through ${formatDateOnly(to)}`
  }

  if (!range) return timezone ? timezone : null
  return timezone ? `${range} (${timezone})` : range
}

export function formatCheckInTimelineTooltipLabel(bucketStart: string): string {
  return formatDateTime(bucketStart)
}
