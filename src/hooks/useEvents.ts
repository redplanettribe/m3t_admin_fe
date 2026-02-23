import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useEventStore } from "@/store/eventStore"
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

export function useImportSessionize(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionizeId }: { sessionizeId: string }) =>
      apiClient.post(
        `/events/${eventId}/import/sessionize/${sessionizeId}`,
        {}
      ),
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
      }
    },
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; slug: string }) =>
      apiClient.post<Event>("/events", body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.list })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(data.id) })
      useEventStore.getState().setActiveEventId(data.id)
    },
  })
}
