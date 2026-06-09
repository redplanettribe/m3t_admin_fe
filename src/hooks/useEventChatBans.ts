import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type { EventChatBan, EventChatBansListResponse } from "@/types/chat"

type UseEventChatBansParams = {
  page?: number
  pageSize?: number
  enabled?: boolean
}

export function useEventChatBans(
  eventId: string | null,
  params: UseEventChatBansParams = {}
) {
  const { page = 1, pageSize = 100, enabled = true } = params

  return useQuery({
    queryKey: queryKeys.events.chatBans(eventId ?? "", page, pageSize),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      const searchParams = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      })
      return apiClient.get<EventChatBansListResponse>(
        `/events/${eventId}/chat/bans?${searchParams.toString()}`
      )
    },
    enabled: !!eventId && enabled,
  })
}

function invalidateChatBanQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  eventId: string,
  userId: string
) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.events.chatBans(eventId, 1, 100).slice(0, 4),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.events.publicProfiles(eventId, 1, 100).slice(0, 3),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.events.publicProfile(eventId, userId),
  })
}

export function useBanChatUser(eventId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.postNoBody<EventChatBan>(
        `/events/${eventId}/chat/bans/${userId}`
      )
    },
    onSuccess: (_data, { userId }) => {
      if (eventId) invalidateChatBanQueries(queryClient, eventId, userId)
    },
  })
}

export function useUnbanChatUser(eventId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.delete<undefined>(`/events/${eventId}/chat/bans/${userId}`)
    },
    onSuccess: (_data, { userId }) => {
      if (eventId) invalidateChatBanQueries(queryClient, eventId, userId)
    },
  })
}
