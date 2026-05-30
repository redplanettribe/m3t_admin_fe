import { formatDateOnly, parseCalendarDate } from "@/lib/formatDate"
import type {
  AdminEventTimelineBucket,
  AdminEventTimelineResult,
} from "@/types/admin"

export interface AdminEventTimelineChartPoint {
  date: string
  label: string
  eventCount: number
  registrations: number
  checkIns: number
  invitations: number
}

function bucketAxisLabel(bucketStart: string): string {
  const date = parseCalendarDate(bucketStart)
  if (!date) return bucketStart
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function aggregateTimelineBuckets(
  buckets: AdminEventTimelineBucket[]
): AdminEventTimelineChartPoint[] {
  return buckets
    .filter((bucket) => bucket.bucket_start)
    .map((bucket) => {
      const date = bucket.bucket_start!
      const events = bucket.events ?? []
      return {
        date,
        label: bucketAxisLabel(date),
        eventCount: events.length,
        registrations: events.reduce(
          (sum, event) => sum + (event.registration_count ?? 0),
          0
        ),
        checkIns: events.reduce((sum, event) => sum + (event.check_in_count ?? 0), 0),
        invitations: events.reduce(
          (sum, event) => sum + (event.invitation_sent_count ?? 0),
          0
        ),
      }
    })
}

export function formatTimelineRangeLabel(
  result: AdminEventTimelineResult | undefined,
  filterFrom?: string,
  filterTo?: string
): string | null {
  const from = result?.from ?? filterFrom
  const to = result?.to ?? filterTo
  if (!from && !to) return null
  if (from && to) {
    return `${formatDateOnly(from)} – ${formatDateOnly(to)}`
  }
  if (from) return `From ${formatDateOnly(from)}`
  return `Through ${formatDateOnly(to)}`
}
