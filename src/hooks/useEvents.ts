import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useEventStore } from "@/store/eventStore"
import type { Event, EventSchedule, Room, SendEventInvitationsResult } from "@/types/event"

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
    mutationFn: (body: { name: string }) =>
      apiClient.post<Event>("/events", body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.list })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(data.id) })
      useEventStore.getState().setActiveEventId(data.id)
    },
  })
}

export function useDeleteEvent(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.delete<{ status?: string }>(`/events/${eventId}`)
    },
    onSuccess: () => {
      if (!eventId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.events.list })
      queryClient.removeQueries({ queryKey: queryKeys.events.detail(eventId) })
      useEventStore.getState().setActiveEventId(null)
    },
  })
}

export function useToggleRoomNotBookable(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roomId }: { roomId: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.patch<Room>(
        `/events/${eventId}/rooms/${roomId}/not-bookable`
      )
    },
    onSuccess: (updatedRoom, _variables, _context) => {
      if (!eventId) return
      const key = queryKeys.events.detail(eventId)
      queryClient.setQueryData<EventSchedule>(key, (prev) => {
        if (!prev?.rooms) {
          queryClient.invalidateQueries({ queryKey: key })
          return prev
        }
        return {
          ...prev,
          rooms: prev.rooms.map((r) =>
            r.id === updatedRoom.id ? updatedRoom : r
          ),
        }
      })
    },
  })
}

export function useSendEventInvitations(eventId: string | null) {
  return useMutation({
    mutationFn: ({ emails }: { emails: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<SendEventInvitationsResult>(
        `/events/${eventId}/invitations`,
        { emails }
      )
    },
  })
}
