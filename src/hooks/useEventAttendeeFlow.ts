import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type { EventAttendeeFlow } from "@/types/event"

function shouldRetryEventAttendeeFlow(failureCount: number, error: Error): boolean {
  if (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403 || error.status === 409)
  ) {
    return false
  }
  return failureCount < 2
}

export function useEventAttendeeFlow(eventId: string | null, eventEnded: boolean) {
  return useQuery({
    queryKey: queryKeys.events.attendeeFlow(eventId ?? ""),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.get<EventAttendeeFlow>(`/events/${eventId}/analytics/flow`)
    },
    enabled: !!eventId && eventEnded,
    retry: shouldRetryEventAttendeeFlow,
  })
}
