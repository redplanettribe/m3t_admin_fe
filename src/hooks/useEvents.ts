import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useEventStore } from "@/store/eventStore"
import type {
  Event,
  EventSchedule,
  Room,
  Session,
  SendEventInvitationsResult,
  ListEventInvitationsResult,
  UpdateRoomRequest,
  UpdateEventRequest,
  UpdateSessionScheduleRequest,
  UpdateSessionContentRequest,
  CreateSessionRequest,
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

export function useDeleteSession(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId }: { sessionId: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.delete<{ status?: string }>(
        `/events/${eventId}/sessions/${sessionId}`
      )
    },
    onSuccess: (_data, _variables) => {
      if (!eventId) return
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

export function useCreateSession(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSessionRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<{
        id: string
        room_id: string
        start_time: string
        end_time: string
        title?: string
        description?: string
        tags?: string[]
      }>(`/events/${eventId}/sessions`, body)
    },
    onSuccess: (_created, _variables) => {
      if (!eventId) return
      const key = queryKeys.events.detail(eventId)
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

/** API returns start_time/end_time; we normalize to starts_at/ends_at for cache. */
function sessionFromApiResponse(data: { id: string; room_id: string; start_time: string; end_time: string; title?: string; description?: string; tags?: string[] }): Session {
  return {
    id: data.id,
    room_id: data.room_id,
    starts_at: data.start_time,
    ends_at: data.end_time,
    title: data.title,
    description: data.description,
    tags: data.tags,
  }
}

export function useUpdateSessionContent(eventId: string | null, sessionId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateSessionContentRequest) => {
      if (!eventId) throw new Error("No event selected")
      if (!sessionId) throw new Error("No session selected")
      return apiClient.patch<{ id: string; room_id: string; start_time: string; end_time: string; title?: string; description?: string; tags?: string[] }>(
        `/events/${eventId}/sessions/${sessionId}/content`,
        body
      )
    },
    onSuccess: (updated, _variables) => {
      if (!eventId) return
      const key = queryKeys.events.detail(eventId)
      queryClient.setQueryData<EventSchedule>(key, (prev) => {
        if (!prev?.sessions) {
          queryClient.invalidateQueries({ queryKey: key })
          return prev
        }
        const session = sessionFromApiResponse(updated)
        return {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === updated.id ? session : s
          ),
        }
      })
    },
    onError: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
      }
    },
  })
}

export function useUpdateSessionSchedule(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      ...body
    }: { sessionId: string } & UpdateSessionScheduleRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.patch<{ id: string; room_id: string; start_time: string; end_time: string; title?: string; description?: string; tags?: string[] }>(
        `/events/${eventId}/sessions/${sessionId}`,
        body
      )
    },
    onSuccess: (updated, variables) => {
      if (!eventId) return
      const key = queryKeys.events.detail(eventId)
      queryClient.setQueryData<EventSchedule>(key, (prev) => {
        if (!prev?.sessions) {
          queryClient.invalidateQueries({ queryKey: key })
          return prev
        }
        const session = sessionFromApiResponse(updated)
        return {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === variables.sessionId ? session : s
          ),
        }
      })
    },
    onError: () => {
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
