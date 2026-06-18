import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type {
  ConfirmSponsorLogoRequest,
  CreateEventSponsorOfferingRequest,
  CreateEventSponsorRequest,
  EventSponsor,
  EventSponsorOffering,
  ListEventSponsorsParams,
  ListEventSponsorsResult,
  RequestSponsorLogoUploadRequest,
  RequestSponsorLogoUploadResult,
  SponsorAnalytics,
  UpdateEventSponsorOfferingRequest,
  UpdateEventSponsorRequest,
} from "@/types/event"

const DEFAULT_PAGE_SIZE = 20

function buildSponsorsSearchParams(params: ListEventSponsorsParams): string {
  const searchParams = new URLSearchParams()
  if (params.page != null) {
    searchParams.set("page", String(params.page))
  }
  if (params.page_size != null) {
    searchParams.set("page_size", String(params.page_size))
  }
  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim())
  }
  if (params.status?.trim()) {
    searchParams.set("status", params.status.trim())
  }
  if (params.sponsorship_level?.trim()) {
    searchParams.set("sponsorship_level", params.sponsorship_level.trim())
  }
  if (params.booth_type?.trim()) {
    searchParams.set("booth_type", params.booth_type.trim())
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

function invalidateSponsorLists(queryClient: ReturnType<typeof useQueryClient>, eventId: string) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.events.sponsors(eventId, 1, DEFAULT_PAGE_SIZE).slice(0, 3),
  })
}

export function useEventSponsors(
  eventId: string | null,
  params: ListEventSponsorsParams
) {
  const page = params.page ?? 1
  const pageSize = params.page_size ?? DEFAULT_PAGE_SIZE
  return useQuery({
    queryKey: queryKeys.events.sponsors(eventId ?? "", page, pageSize, params),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.get<ListEventSponsorsResult>(
        `/events/${eventId}/sponsors${buildSponsorsSearchParams({ ...params, page, page_size: pageSize })}`
      )
    },
    enabled: !!eventId,
  })
}

export function useEventSponsorAnalytics(
  eventId: string | null,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true
  return useQuery({
    queryKey: queryKeys.events.sponsorAnalytics(eventId ?? ""),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.get<SponsorAnalytics>(`/events/${eventId}/sponsors/analytics`)
    },
    enabled: !!eventId && enabled,
  })
}

export function useEventSponsor(eventId: string | null, sponsorId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.sponsor(eventId ?? "", sponsorId ?? ""),
    queryFn: () => {
      if (!eventId || !sponsorId) throw new Error("Invalid sponsor link")
      return apiClient.get<EventSponsor>(`/events/${eventId}/sponsors/${sponsorId}`)
    },
    enabled: !!eventId && !!sponsorId,
  })
}

export function useCreateEventSponsor(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateEventSponsorRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<EventSponsor>(`/events/${eventId}/sponsors`, body)
    },
    onSuccess: () => {
      if (!eventId) return
      invalidateSponsorLists(queryClient, eventId)
    },
  })
}

export function useUpdateEventSponsor(eventId: string | null, sponsorId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateEventSponsorRequest) => {
      if (!eventId || !sponsorId) throw new Error("Invalid sponsor")
      return apiClient.patch<EventSponsor>(
        `/events/${eventId}/sponsors/${sponsorId}`,
        body
      )
    },
    onSuccess: () => {
      if (!eventId || !sponsorId) return
      invalidateSponsorLists(queryClient, eventId)
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.sponsor(eventId, sponsorId),
      })
    },
  })
}

export function useDeleteEventSponsor(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sponsorId }: { sponsorId: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.delete<undefined>(`/events/${eventId}/sponsors/${sponsorId}`)
    },
    onSuccess: (_, variables) => {
      if (!eventId) return
      invalidateSponsorLists(queryClient, eventId)
      queryClient.removeQueries({
        queryKey: queryKeys.events.sponsor(eventId, variables.sponsorId),
      })
    },
  })
}

export function useRequestSponsorLogoUpload(
  eventId: string | null,
  sponsorId: string | null
) {
  return useMutation({
    mutationFn: (body: RequestSponsorLogoUploadRequest) => {
      if (!eventId || !sponsorId) throw new Error("Invalid sponsor")
      return apiClient.post<RequestSponsorLogoUploadResult>(
        `/events/${eventId}/sponsors/${sponsorId}/logo/upload-url`,
        body
      )
    },
  })
}

export function useConfirmSponsorLogo(eventId: string | null, sponsorId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ConfirmSponsorLogoRequest) => {
      if (!eventId || !sponsorId) throw new Error("Invalid sponsor")
      return apiClient.put<undefined>(
        `/events/${eventId}/sponsors/${sponsorId}/logo`,
        body
      )
    },
    onSuccess: () => {
      if (!eventId || !sponsorId) return
      invalidateSponsorLists(queryClient, eventId)
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.sponsor(eventId, sponsorId),
      })
    },
  })
}

export function useCreateSponsorOffering(
  eventId: string | null,
  sponsorId: string | null
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateEventSponsorOfferingRequest) => {
      if (!eventId || !sponsorId) throw new Error("Invalid sponsor")
      return apiClient.post<EventSponsorOffering>(
        `/events/${eventId}/sponsors/${sponsorId}/offerings`,
        body
      )
    },
    onSuccess: () => {
      if (!eventId || !sponsorId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.sponsor(eventId, sponsorId),
      })
    },
  })
}

export function useUpdateSponsorOffering(
  eventId: string | null,
  sponsorId: string | null
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      offeringId,
      body,
    }: {
      offeringId: string
      body: UpdateEventSponsorOfferingRequest
    }) => {
      if (!eventId || !sponsorId) throw new Error("Invalid sponsor")
      return apiClient.patch<EventSponsorOffering>(
        `/events/${eventId}/sponsors/${sponsorId}/offerings/${offeringId}`,
        body
      )
    },
    onSuccess: () => {
      if (!eventId || !sponsorId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.sponsor(eventId, sponsorId),
      })
    },
  })
}

export function useDeleteSponsorOffering(
  eventId: string | null,
  sponsorId: string | null
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ offeringId }: { offeringId: string }) => {
      if (!eventId || !sponsorId) throw new Error("Invalid sponsor")
      return apiClient.delete<undefined>(
        `/events/${eventId}/sponsors/${sponsorId}/offerings/${offeringId}`
      )
    },
    onSuccess: () => {
      if (!eventId || !sponsorId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.sponsor(eventId, sponsorId),
      })
    },
  })
}
