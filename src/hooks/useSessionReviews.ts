import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type {
  ListEventSessionReviewsParams,
  ListSessionReviewsParams,
  ListSessionReviewsResult,
} from "@/types/event"

export function useSessionReviews(
  eventId: string | null,
  sessionId: string | null,
  params: ListSessionReviewsParams
) {
  const { page, page_size, rating, search } = params
  return useQuery({
    queryKey: queryKeys.events.sessionReviews(eventId ?? "", sessionId ?? "", params),
    queryFn: () => {
      if (!eventId || !sessionId) throw new Error("Missing event or session")
      const searchParams = new URLSearchParams({
        page: String(page),
        page_size: String(page_size),
      })
      if (rating != null) {
        searchParams.set("rating", String(rating))
      }
      if (search?.trim()) {
        searchParams.set("search", search.trim())
      }
      return apiClient.get<ListSessionReviewsResult>(
        `/events/${eventId}/sessions/${sessionId}/reviews?${searchParams.toString()}`
      )
    },
    enabled: !!eventId && !!sessionId,
  })
}

export function useEventSessionReviews(
  eventId: string | null,
  params: ListEventSessionReviewsParams
) {
  return useQuery({
    queryKey: queryKeys.events.eventSessionReviews(eventId ?? "", params),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      const searchParams = new URLSearchParams({
        page: String(params.page),
        page_size: String(params.page_size),
      })
      if (params.session_id?.trim()) {
        searchParams.set("session_id", params.session_id.trim())
      }
      if (params.rating != null) {
        searchParams.set("rating", String(params.rating))
      }
      if (params.search?.trim()) {
        searchParams.set("search", params.search.trim())
      }
      return apiClient.get<ListSessionReviewsResult>(
        `/events/${eventId}/reviews?${searchParams.toString()}`
      )
    },
    enabled: !!eventId,
    placeholderData: (previousData, previousQuery) => {
      if (!eventId || previousData == null) return undefined
      const key = previousQuery?.queryKey
      if (!Array.isArray(key) || key[1] !== eventId) return undefined
      return previousData
    },
  })
}
