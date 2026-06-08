import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type {
  ListEventPublicProfilesResponse,
  PublicAttendeeProfile,
} from "@/types/profile"

type UseEventPublicProfilesParams = {
  page?: number
  pageSize?: number
}

async function fetchPublicProfiles(
  eventId: string,
  page: number,
  pageSize: number
): Promise<ListEventPublicProfilesResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  return apiClient.get<ListEventPublicProfilesResponse>(
    `/attendee/events/${eventId}/public-profiles?${params.toString()}`
  )
}

export function useEventPublicProfiles(
  eventId: string | null,
  params: UseEventPublicProfilesParams = {}
) {
  const { page = 1, pageSize = 100 } = params

  return useQuery({
    queryKey: queryKeys.events.publicProfiles(eventId ?? "", page, pageSize),
    queryFn: () => fetchPublicProfiles(eventId!, page, pageSize),
    enabled: !!eventId,
  })
}

export function useEventPublicProfile(
  eventId: string | null,
  userId: string | null
) {
  return useQuery({
    queryKey: queryKeys.events.publicProfile(eventId ?? "", userId ?? ""),
    queryFn: () =>
      apiClient.get<PublicAttendeeProfile>(
        `/attendee/events/${eventId}/public-profiles/${userId}`
      ),
    enabled: !!eventId && !!userId,
  })
}
