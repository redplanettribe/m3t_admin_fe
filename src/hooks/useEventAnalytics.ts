import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type { EventAnalytics } from "@/types/event"

function shouldRetryEventAnalytics(failureCount: number, error: Error): boolean {
  if (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403 || error.status === 409)
  ) {
    return false
  }
  return failureCount < 2
}

export function useEventAnalytics(eventId: string | null, eventEnded: boolean) {
  return useQuery({
    queryKey: queryKeys.events.analytics(eventId ?? ""),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.get<EventAnalytics>(`/events/${eventId}/analytics`)
    },
    enabled: !!eventId && eventEnded,
    retry: shouldRetryEventAnalytics,
  })
}
