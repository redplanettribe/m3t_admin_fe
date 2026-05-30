import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type {
  EventCheckInTimeline,
  EventCheckInTimelineGranularity,
} from "@/types/event"

function shouldRetryEventCheckInTimeline(failureCount: number, error: Error): boolean {
  if (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403 || error.status === 409)
  ) {
    return false
  }
  return failureCount < 2
}

export function useEventCheckInTimeline(
  eventId: string | null,
  eventEnded: boolean,
  granularity: EventCheckInTimelineGranularity = "hour"
) {
  return useQuery({
    queryKey: queryKeys.events.checkInTimeline(eventId ?? "", granularity),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.get<EventCheckInTimeline>(
        `/events/${eventId}/analytics/check-ins/timeline?granularity=${granularity}`
      )
    },
    enabled: !!eventId && eventEnded,
    retry: shouldRetryEventCheckInTimeline,
  })
}
