import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useEventStore } from "@/store/eventStore"
import type { CreateEventFormValues } from "@/lib/schemas/event"
import type {
  Event,
  ConfirmThumbnailRequest,
  EventSchedule,
  EventTag,
  EventTier,
  RequestThumbnailUploadResult,
  Room,
  RoomWithSessions,
  Session,
  Speaker,
  SendEventInvitationsResult,
  ListEventInvitationsResult,
  ListEventRegistrationsResult,
  UpdateRoomRequest,
  UpdateEventRequest,
  UpdateSessionScheduleRequest,
  UpdateSessionContentRequest,
  CreateSessionRequest,
  CreateRoomRequest,
  CreateEventTierRequest,
  UpdateEventTierRequest,
  AssignTierUsersResult,
} from "@/types/event"

/** Normalize tags from API (Tag[] or string[]) to EventTag[] for Session. */
function normalizeTags(tags: EventTag[] | string[] | undefined): EventTag[] | undefined {
  if (!tags?.length) return undefined
  if (typeof tags[0] === "string") {
    return (tags as string[]).map((name) => ({ id: "", name }))
  }
  return tags as EventTag[]
}

type ApiSessionResponse = {
  id: string
  room_id: string
  event_day?: number
  start_time: string
  end_time: string
  title?: string
  description?: string
  tags?: EventTag[]
  speakers?: Speaker[]
}

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

export function useCreateRoom(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateRoomRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<Room>(`/events/${eventId}/rooms`, body)
    },
    onSuccess: () => {
      if (!eventId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.events.rooms(eventId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
    },
  })
}

export function useEventTags(eventId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.tags(eventId ?? ""),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.get<EventTag[]>(`/events/${eventId}/tags`)
    },
    enabled: !!eventId,
  })
}

/** Add tags to the event by name (creates if missing). */
export function useAddEventTags(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tags }: { tags: string[] }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<EventTag[]>(`/events/${eventId}/tags`, { tags })
    },
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.tags(eventId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
      }
    },
  })
}

/** Remove a tag from the event. */
export function useDeleteEventTag(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tagId }: { tagId: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.delete<undefined>(`/events/${eventId}/tags/${tagId}`)
    },
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.tags(eventId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
      }
    },
  })
}

export function useEventTiers(eventId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.tiers(eventId ?? ""),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.get<EventTier[]>(`/events/${eventId}/tiers`)
    },
    enabled: !!eventId,
  })
}

export function useCreateEventTier(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateEventTierRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<EventTier>(`/events/${eventId}/tiers`, body)
    },
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.tiers(eventId) })
      }
    },
  })
}

export function useUpdateEventTier(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tierId,
      body,
    }: { tierId: string; body: UpdateEventTierRequest }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.patch<EventTier>(`/events/${eventId}/tiers/${tierId}`, body)
    },
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.tiers(eventId) })
      }
    },
  })
}

export function useDeleteEventTier(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tierId }: { tierId: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.delete<undefined>(`/events/${eventId}/tiers/${tierId}`)
    },
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.tiers(eventId) })
      }
    },
  })
}

export function useAssignTierUsers(eventId: string | null) {
  return useMutation({
    mutationFn: ({
      tierId,
      emails,
    }: { tierId: string; emails: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<AssignTierUsersResult>(
        `/events/${eventId}/tiers/${tierId}/assignments`,
        { emails }
      )
    },
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
      return apiClient.post<ApiSessionResponse>(`/events/${eventId}/sessions`, body)
    },
    onSuccess: (created, _variables) => {
      if (!eventId) return
      const key = queryKeys.events.detail(eventId)
      queryClient.setQueryData<EventSchedule>(key, (prev) => {
        if (!prev?.rooms) {
          queryClient.invalidateQueries({ queryKey: key })
          return prev
        }
        const session = sessionFromApiResponse(created)
        const roomIndex = prev.rooms.findIndex((rw) => rw.room.id === created.room_id)
        if (roomIndex < 0) {
          queryClient.invalidateQueries({ queryKey: key })
          return prev
        }
        const rooms: RoomWithSessions[] = prev.rooms.map((rw, i) =>
          i === roomIndex ? { ...rw, sessions: [...rw.sessions, session] } : rw
        )
        return { ...prev, rooms }
      })
    },
  })
}

/** API returns event_day, start_time (HH:mm), end_time (HH:mm) and tags; we normalize to Session for cache. */
function sessionFromApiResponse(data: ApiSessionResponse): Session {
  return {
    id: data.id,
    room_id: data.room_id,
    event_day: data.event_day ?? 1,
    start_time: data.start_time,
    end_time: data.end_time,
    title: data.title,
    description: data.description,
    tags: normalizeTags(data.tags),
    speakers: data.speakers,
  }
}

export function useUpdateSessionContent(eventId: string | null, sessionId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateSessionContentRequest) => {
      if (!eventId) throw new Error("No event selected")
      if (!sessionId) throw new Error("No session selected")
      return apiClient.patch<ApiSessionResponse>(
        `/events/${eventId}/sessions/${sessionId}/content`,
        body
      )
    },
    onSuccess: (updated, _variables) => {
      if (!eventId) return
      const key = queryKeys.events.detail(eventId)
      queryClient.setQueryData<EventSchedule>(key, (prev) => {
        if (!prev?.rooms) {
          queryClient.invalidateQueries({ queryKey: key })
          return prev
        }
        const session = sessionFromApiResponse(updated)
        const rooms: RoomWithSessions[] = prev.rooms.map((rw) => ({
          ...rw,
          sessions: rw.sessions.map((s) => (String(s.id) === updated.id ? session : s)),
        }))
        return { ...prev, rooms }
      })
    },
    onError: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
      }
    },
  })
}

/** Add a tag (by id) to a session. Tag must belong to the event. */
export function useAddSessionTag(eventId: string | null, sessionId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tagId }: { tagId: string }) => {
      if (!eventId) throw new Error("No event selected")
      if (!sessionId) throw new Error("No session selected")
      return apiClient.post<undefined>(
        `/events/${eventId}/sessions/${sessionId}/tags`,
        { tag_id: tagId }
      )
    },
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
      }
    },
  })
}

/** Remove a tag from a session. */
export function useRemoveSessionTag(eventId: string | null, sessionId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tagId }: { tagId: string }) => {
      if (!eventId) throw new Error("No event selected")
      if (!sessionId) throw new Error("No session selected")
      return apiClient.delete<undefined>(
        `/events/${eventId}/sessions/${sessionId}/tags/${tagId}`
      )
    },
    onSuccess: () => {
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
      return apiClient.patch<ApiSessionResponse>(
        `/events/${eventId}/sessions/${sessionId}`,
        body
      )
    },
    onSuccess: (updated, variables) => {
      if (!eventId) return
      const key = queryKeys.events.detail(eventId)
      queryClient.setQueryData<EventSchedule>(key, (prev) => {
        if (!prev?.rooms) {
          queryClient.invalidateQueries({ queryKey: key })
          return prev
        }
        const session = sessionFromApiResponse(updated)
        const rooms: RoomWithSessions[] = prev.rooms.map((rw) => {
          if (rw.room.id === updated.room_id) {
            const idx = rw.sessions.findIndex((s) => String(s.id) === variables.sessionId)
            if (idx >= 0) {
              return { ...rw, sessions: rw.sessions.map((s, i) => (i === idx ? session : s)) }
            }
            return { ...rw, sessions: [...rw.sessions, session] }
          }
          return { ...rw, sessions: rw.sessions.filter((s) => String(s.id) !== variables.sessionId) }
        })
        return { ...prev, rooms }
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
    mutationFn: (body: CreateEventFormValues) =>
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

export function useRequestEventThumbnailUpload(eventId: string | null) {
  return useMutation({
    mutationFn: () => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<RequestThumbnailUploadResult>(
        `/events/${eventId}/thumbnail/upload-url`,
        {}
      )
    },
  })
}

export function useConfirmEventThumbnail(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key }: ConfirmThumbnailRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.put<Event>(`/events/${eventId}/thumbnail`, { key })
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
          rooms: prev.rooms.map((rw) =>
            rw.room.id === updatedRoom.id ? { ...rw, room: updatedRoom } : rw
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

export interface UseEventRegistrationsParams {
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

export function useEventRegistrations(
  eventId: string | null,
  params: UseEventRegistrationsParams
) {
  const { page, pageSize, search = "" } = params
  return useQuery({
    queryKey: queryKeys.events.registrations(eventId ?? "", page, pageSize, search),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      const searchParams = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      })
      if (search.trim()) {
        searchParams.set("search", search.trim())
      }
      return apiClient.get<ListEventRegistrationsResult>(
        `/events/${eventId}/registrations?${searchParams.toString()}`
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

/** Check in an attendee for the event (POST /events/{eventID}/check-ins). */
export function useCheckInAttendee(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<{ data?: unknown }>(
        `/events/${eventId}/check-ins`,
        { user_id: userId }
      )
    },
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ["events", eventId, "registrations"] })
      }
    },
  })
}
