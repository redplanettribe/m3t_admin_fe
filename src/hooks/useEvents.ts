import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type { Event, EventSchedule } from "@/types/event"

export function useEventsMe() {
  return useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => apiClient.get<Event[]>("/events/me"),
  })
}

export function useEventSchedule(eventId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.detail(eventId ?? ""),
    queryFn: () =>
      apiClient.get<EventSchedule>(`/events/${eventId}`),
    enabled: !!eventId,
  })
}
