import type { AdminEventsOrder, AdminEventsSort, AdminEventsStatus, ListAdminEventsParams } from "@/types/admin"
import type { Event } from "@/types/event"

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const STATUS_ALL = "__all__"
export const HAS_OWNER_ALL = "__all__"

export type EventDisplayStatus = "active" | "past" | "upcoming" | "unknown"

export const EVENT_DISPLAY_STATUS_LABELS: Record<EventDisplayStatus, string> = {
  upcoming: "Scheduled",
  active: "Ongoing",
  past: "Ended",
  unknown: "—",
}

export const STATUS_FILTER_HELPER_TEXT =
  "Active includes scheduled and ongoing events."

export function hasActiveFilters(params: ListAdminEventsParams): boolean {
  return (
    getActiveFilterChips(params).length > 0 ||
    (params.status !== undefined && params.status !== "all")
  )
}

export type AdminEventFilterChip = {
  id: string
  label: string
}

export function getActiveFilterChips(params: ListAdminEventsParams): AdminEventFilterChip[] {
  const chips: AdminEventFilterChip[] = []

  if (params.search?.trim()) {
    chips.push({ id: "search", label: `Search: ${params.search.trim()}` })
  }
  if (params.owner_search?.trim()) {
    chips.push({ id: "owner_search", label: `Owner: ${params.owner_search.trim()}` })
  }
  if (params.event_code?.trim()) {
    chips.push({ id: "event_code", label: `Code: ${params.event_code.trim()}` })
  }
  if (params.owner_id?.trim()) {
    chips.push({ id: "owner_id", label: `Owner ID: ${params.owner_id.trim()}` })
  }
  if (params.has_owner === true) {
    chips.push({ id: "has_owner", label: "Has owner: yes" })
  }
  if (params.has_owner === false) {
    chips.push({ id: "has_owner", label: "Has owner: no" })
  }
  if (params.start_date_from?.trim() || params.start_date_to?.trim()) {
    const from = params.start_date_from?.trim() ?? "…"
    const to = params.start_date_to?.trim() ?? "…"
    chips.push({ id: "start_dates", label: `Start: ${from} – ${to}` })
  }
  if (params.created_from?.trim() || params.created_to?.trim()) {
    const from = params.created_from?.trim() ?? "…"
    const to = params.created_to?.trim() ?? "…"
    chips.push({ id: "created_dates", label: `Created: ${from} – ${to}` })
  }

  return chips
}

export function countAdvancedFilters(params: {
  eventCode: string
  hasOwner: string
  ownerId: string
  startDateFrom: string
  startDateTo: string
  createdFrom: string
  createdTo: string
}): number {
  let count = 0
  if (params.eventCode.trim()) count += 1
  if (params.hasOwner !== HAS_OWNER_ALL) count += 1
  if (params.ownerId.trim()) count += 1
  if (params.startDateFrom.trim() || params.startDateTo.trim()) count += 1
  if (params.createdFrom.trim() || params.createdTo.trim()) count += 1
  return count
}

export function hasAdvancedFilters(params: {
  eventCode: string
  hasOwner: string
  ownerId: string
  startDateFrom: string
  startDateTo: string
  createdFrom: string
  createdTo: string
}): boolean {
  return countAdvancedFilters(params) > 0
}

export function getEventDisplayStatus(event: Event): EventDisplayStatus {
  const startRaw = event.start_date?.trim()
  if (!startRaw) return "unknown"

  const start = new Date(
    DATE_ONLY_PATTERN.test(startRaw) ? `${startRaw}T00:00:00Z` : startRaw
  )
  if (Number.isNaN(start.getTime())) return "unknown"

  const duration = event.duration_days ?? 1
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + Math.max(duration, 1) - 1)
  end.setUTCHours(23, 59, 59, 999)

  const now = new Date()
  if (now < start) return "upcoming"
  if (now > end) return "past"
  return "active"
}

export const SORT_PRESETS: { value: string; label: string; sort: AdminEventsSort; order: AdminEventsOrder }[] = [
  { value: "created_at:desc", label: "Newest created", sort: "created_at", order: "desc" },
  { value: "created_at:asc", label: "Oldest created", sort: "created_at", order: "asc" },
  { value: "updated_at:desc", label: "Recently updated", sort: "updated_at", order: "desc" },
  { value: "updated_at:asc", label: "Least recently updated", sort: "updated_at", order: "asc" },
  { value: "start_date:desc", label: "Start date (newest)", sort: "start_date", order: "desc" },
  { value: "start_date:asc", label: "Start date (oldest)", sort: "start_date", order: "asc" },
  { value: "end_date:desc", label: "End date (newest)", sort: "end_date", order: "desc" },
  { value: "end_date:asc", label: "End date (oldest)", sort: "end_date", order: "asc" },
  { value: "name:asc", label: "Name (A–Z)", sort: "name", order: "asc" },
  { value: "name:desc", label: "Name (Z–A)", sort: "name", order: "desc" },
  { value: "event_code:asc", label: "Event code (A–Z)", sort: "event_code", order: "asc" },
  { value: "event_code:desc", label: "Event code (Z–A)", sort: "event_code", order: "desc" },
  { value: "owner_email:asc", label: "Owner email (A–Z)", sort: "owner_email", order: "asc" },
  { value: "owner_email:desc", label: "Owner email (Z–A)", sort: "owner_email", order: "desc" },
]

export function sortPresetValue(sort: AdminEventsSort, order: AdminEventsOrder): string {
  return `${sort}:${order}`
}

export function parseSortPreset(value: string): { sort: AdminEventsSort; order: AdminEventsOrder } {
  const preset = SORT_PRESETS.find((p) => p.value === value)
  if (preset) return { sort: preset.sort, order: preset.order }
  const [sort, order] = value.split(":") as [AdminEventsSort, AdminEventsOrder]
  return { sort: sort ?? "created_at", order: order ?? "desc" }
}

export function statusFilterLabel(status: AdminEventsStatus | typeof STATUS_ALL): string {
  if (status === STATUS_ALL) return "All"
  return status.charAt(0).toUpperCase() + status.slice(1)
}
