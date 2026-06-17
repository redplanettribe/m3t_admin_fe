import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type {
  EventAnnouncement,
  ListEventAnnouncementsResult,
  SendEventAnnouncementRequest,
} from "@/types/event"

export interface UseEventAnnouncementsParams {
  page: number
  pageSize: number
}

export function useEventAnnouncements(
  eventId: string | null,
  params: UseEventAnnouncementsParams
) {
  const { page, pageSize } = params
  return useQuery({
    queryKey: queryKeys.events.announcements(eventId ?? "", page, pageSize),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      const searchParams = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      })
      return apiClient.get<ListEventAnnouncementsResult>(
        `/events/${eventId}/announcements?${searchParams.toString()}`
      )
    },
    enabled: !!eventId,
  })
}

export function useSendEventAnnouncement(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SendEventAnnouncementRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<EventAnnouncement>(`/events/${eventId}/announcements`, body)
    },
    onSuccess: () => {
      if (!eventId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.announcements(eventId, 1, 20).slice(0, 3),
      })
    },
  })
}
