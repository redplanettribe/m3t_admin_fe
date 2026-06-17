import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type {
  EventSettings,
  ListEventUgcSocialNetworksParams,
  ListEventUgcSocialNetworksResult,
  PatchEventSettingsRequest,
} from "@/types/event"

function shouldRetryEventSettings(failureCount: number, error: Error): boolean {
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

async function fetchEventSettings(eventId: string): Promise<EventSettings> {
  return apiClient.get<EventSettings>(`/events/${eventId}/settings`)
}

async function fetchEventUgcSocialNetworks(
  eventId: string,
  params: ListEventUgcSocialNetworksParams
): Promise<ListEventUgcSocialNetworksResult> {
  return apiClient.get<ListEventUgcSocialNetworksResult>(
    `/events/${eventId}/ugc/social-networks${buildEventUgcSocialNetworksSearchParams(params)}`
  )
}

export function useEventSettings(eventId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.settings(eventId ?? ""),
    queryFn: () => fetchEventSettings(eventId!),
    enabled: !!eventId,
    retry: shouldRetryEventSettings,
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
    retry: shouldRetryEventSettings,
  })
}

function applyOptimisticPatch(
  prev: EventSettings | undefined,
  body: PatchEventSettingsRequest
): EventSettings {
  const next: EventSettings = {
    features: { ...prev?.features },
    ugc: prev?.ugc
      ? {
          ...prev.ugc,
          social_networks: [...(prev.ugc.social_networks ?? [])],
        }
      : undefined,
  }

  if (body.features?.chat?.enabled !== undefined) {
    next.features = {
      ...next.features,
      chat: { enabled: body.features.chat.enabled },
    }
  }

  if (body.features?.registration?.require_invitation !== undefined) {
    next.features = {
      ...next.features,
      registration: {
        require_invitation: body.features.registration.require_invitation,
      },
    }
  }

  if (body.features?.ugc?.enabled !== undefined) {
    const enabled = body.features.ugc.enabled
    next.features = {
      ...next.features,
      ugc: { enabled },
    }
    next.ugc = {
      enabled,
      social_networks: next.ugc?.social_networks ?? prev?.ugc?.social_networks ?? [],
    }
  }

  if (body.ugc?.social_network_codes !== undefined) {
    const codes = body.ugc.social_network_codes
    const prevNetworks = prev?.ugc?.social_networks ?? []
    next.ugc = {
      enabled: next.ugc?.enabled ?? prev?.ugc?.enabled ?? false,
      social_networks: codes.map((code) => {
        const existing = prevNetworks.find((n) => n.code === code)
        return existing ?? { id: code, code, display_name: code }
      }),
    }
  }

  return next
}

export function usePatchEventSettings(eventId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: PatchEventSettingsRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.patch<EventSettings>(`/events/${eventId}/settings`, body)
    },
    onMutate: async (body) => {
      if (!eventId) return
      const key = queryKeys.events.settings(eventId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<EventSettings>(key)
      queryClient.setQueryData<EventSettings>(key, (prev) =>
        applyOptimisticPatch(prev, body)
      )
      return { previous }
    },
    onError: (_error, _body, context) => {
      if (!eventId || context?.previous === undefined) return
      queryClient.setQueryData(queryKeys.events.settings(eventId), context.previous)
    },
    onSuccess: (data) => {
      if (!eventId) return
      queryClient.setQueryData(queryKeys.events.settings(eventId), data)
    },
  })
}
