import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useEventStore } from "@/store/eventStore"
import type {
  Event,
  EventSchedule,
  Room,
  SendEventInvitationsResult,
  ListEventInvitationsResult,
  UpdateRoomRequest,
  UpdateEventRequest,
} from "@/types/event"

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

export function useEventRooms(eventId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.rooms(eventId ?? ""),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.get<Room[]>(`/events/${eventId}/rooms`)
    },
    enabled: !!eventId,
  })
}

export function useRoom(eventId: string | null, roomId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.room(eventId ?? "", roomId ?? ""),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      if (!roomId) throw new Error("No room selected")
      return apiClient.get<Room>(`/events/${eventId}/rooms/${roomId}`)
    },
    enabled: !!eventId && !!roomId,
  })
}

export function useDeleteRoom(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roomId }: { roomId: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.delete<{ status?: string }>(
        `/events/${eventId}/rooms/${roomId}`
      )
    },
    onSuccess: (_data, _variables) => {
      if (!eventId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.events.rooms(eventId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
    },
  })
}

export function useUpdateRoom(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      roomId,
      ...body
    }: {
      roomId: string
    } & UpdateRoomRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.patch<Room>(`/events/${eventId}/rooms/${roomId}`, body)
    },
    onSuccess: (_room, variables) => {
      if (!eventId) return
      const roomKey = queryKeys.events.room(eventId, variables.roomId)
      queryClient.invalidateQueries({ queryKey: roomKey })
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.rooms(eventId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(eventId),
      })
    },
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

export function useUpdateEvent(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateEventRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.patch<Event>(`/events/${eventId}`, body)
    },
    onSuccess: () => {
      if (!eventId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.list })
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

export interface UseEventInvitationsParams {
  page: number
  pageSize: number
  search?: string
}

export function useEventInvitations(
  eventId: string | null,
  params: UseEventInvitationsParams
) {
  const { page, pageSize, search = "" } = params
  return useQuery({
    queryKey: queryKeys.events.invitations(eventId ?? "", page, pageSize, search),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      const searchParams = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      })
      if (search.trim()) {
        searchParams.set("search", search.trim())
      }
      return apiClient.get<ListEventInvitationsResult>(
        `/events/${eventId}/invitations?${searchParams.toString()}`
      )
    },
    enabled: !!eventId,
  })
}

export function useSendEventInvitations(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ emails }: { emails: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<SendEventInvitationsResult>(
        `/events/${eventId}/invitations`,
        { emails }
      )
    },
    onSuccess: (_data, _variables, _context) => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ["events", eventId, "invitations"] })
      }
    },
  })
}
