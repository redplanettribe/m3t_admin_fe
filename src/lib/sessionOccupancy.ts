import type { EventAnalyticsSession } from "@/types/event"

export function getSessionUtilizationPct(session: EventAnalyticsSession): number {
  if (
    session.capacity_utilization != null &&
    Number.isFinite(session.capacity_utilization)
  ) {
    return session.capacity_utilization * 100
  }
  const capacity = session.room?.capacity ?? 0
  const count = session.check_in_count ?? 0
  if (capacity <= 0) return 0
  return (count / capacity) * 100
}

export function getSessionBarWidthPct(utilizationPct: number): number {
  if (Number.isNaN(utilizationPct) || !Number.isFinite(utilizationPct)) return 0
  return Math.max(0, Math.min(100, utilizationPct))
}

export function isSessionOverCapacity(session: EventAnalyticsSession): boolean {
  if ((session.overflow_count ?? 0) > 0) return true
  if (
    session.capacity_utilization != null &&
    session.capacity_utilization > 1
  ) {
    return true
  }
  const capacity = session.room?.capacity ?? 0
  const count = session.check_in_count ?? 0
  return capacity > 0 && count > capacity
}

export function isSessionAtCapacity(session: EventAnalyticsSession): boolean {
  if (isSessionOverCapacity(session)) return false
  const capacity = session.room?.capacity ?? 0
  if (capacity <= 0) return false
  if (
    session.capacity_utilization != null &&
    Number.isFinite(session.capacity_utilization)
  ) {
    return session.capacity_utilization >= 1
  }
  return (session.check_in_count ?? 0) >= capacity
}

export function sortSessionsByOccupancy(
  sessions: EventAnalyticsSession[]
): EventAnalyticsSession[] {
  return [...sessions].sort((a, b) => {
    const aOver = isSessionOverCapacity(a)
    const bOver = isSessionOverCapacity(b)
    if (aOver !== bOver) return aOver ? -1 : 1
    const aPct = getSessionUtilizationPct(a)
    const bPct = getSessionUtilizationPct(b)
    if (aPct !== bPct) return bPct - aPct
    return (a.title || "").localeCompare(b.title || "")
  })
}
