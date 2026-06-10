import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type {
  EventUGCConfig,
  ListEventUgcSocialNetworksParams,
  ListEventUgcSocialNetworksResult,
  UpdateEventUGCConfigRequest,
} from "@/types/event"

function shouldRetryEventUgc(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return false
  }
  return failureCount < 2
}

function buildEventUgcSocialNetworksSearchParams(
  params: ListEventUgcSocialNetworksParams
): string {
  const searchParams = new URLSearchParams()
  if (params.page != null) {
    searchParams.set("page", String(params.page))
  }
  if (params.page_size != null) {
    searchParams.set("page_size", String(params.page_size))
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

async function fetchEventUgcConfig(eventId: string): Promise<EventUGCConfig> {
  return apiClient.get<EventUGCConfig>(`/events/${eventId}/ugc`)
}

async function fetchEventUgcSocialNetworks(
  eventId: string,
  params: ListEventUgcSocialNetworksParams
): Promise<ListEventUgcSocialNetworksResult> {
  return apiClient.get<ListEventUgcSocialNetworksResult>(
    `/events/${eventId}/ugc/social-networks${buildEventUgcSocialNetworksSearchParams(params)}`
  )
}

export function useEventUgcConfig(eventId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.ugcConfig(eventId ?? ""),
    queryFn: () => fetchEventUgcConfig(eventId!),
    enabled: !!eventId,
    retry: shouldRetryEventUgc,
  })
}

export function useEventUgcSocialNetworks(
  eventId: string | null,
  params: ListEventUgcSocialNetworksParams
) {
  return useQuery({
    queryKey: queryKeys.events.ugcSocialNetworks(eventId ?? "", params),
    queryFn: () => fetchEventUgcSocialNetworks(eventId!, params),
    enabled: !!eventId,
    retry: shouldRetryEventUgc,
  })
}

function toOptimisticUgcConfig(
  prev: EventUGCConfig | undefined,
  body: UpdateEventUGCConfigRequest
): EventUGCConfig {
  return {
    enabled: body.enabled,
    social_networks: body.social_network_codes.map((code) => {
      const existing = prev?.social_networks.find((n) => n.code === code)
      return existing ?? { id: code, code, display_name: code }
    }),
  }
}

export function useUpdateEventUgcConfig(eventId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: UpdateEventUGCConfigRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.put<EventUGCConfig>(`/events/${eventId}/ugc`, body)
    },
    onMutate: async (body) => {
      if (!eventId) return
      const key = queryKeys.events.ugcConfig(eventId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<EventUGCConfig>(key)
      queryClient.setQueryData<EventUGCConfig>(key, (prev) =>
        toOptimisticUgcConfig(prev, body)
      )
      return { previous }
    },
    onError: (_error, _body, context) => {
      if (!eventId || context?.previous === undefined) return
      queryClient.setQueryData(queryKeys.events.ugcConfig(eventId), context.previous)
    },
    onSuccess: (data) => {
      if (!eventId) return
      queryClient.setQueryData(queryKeys.events.ugcConfig(eventId), data)
    },
  })
}
