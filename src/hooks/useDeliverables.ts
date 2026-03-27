import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type {
  CreateEventDeliverableRequest,
  EventDeliverable,
  ListEventDeliverablesResult,
  UpdateEventDeliverableRequest,
} from "@/types/event"

export interface UseEventDeliverablesParams {
  page: number
  pageSize: number
}

export function useEventDeliverables(
  eventId: string | null,
  params: UseEventDeliverablesParams
) {
  const { page, pageSize } = params
  return useQuery({
    queryKey: queryKeys.events.deliverables(eventId ?? "", page, pageSize),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      const searchParams = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      })
      return apiClient.get<ListEventDeliverablesResult>(
        `/events/${eventId}/deliverables?${searchParams.toString()}`
      )
    },
    enabled: !!eventId,
  })
}

export function useCreateEventDeliverable(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateEventDeliverableRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<EventDeliverable>(`/events/${eventId}/deliverables`, body)
    },
    onSuccess: () => {
      if (!eventId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.deliverables(eventId, 1, 20).slice(0, 3),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
    },
  })
}

export function useUpdateEventDeliverable(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      deliverableId,
      body,
    }: {
      deliverableId: string
      body: UpdateEventDeliverableRequest
    }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.patch<EventDeliverable>(
        `/events/${eventId}/deliverables/${deliverableId}`,
        body
      )
    },
    onSuccess: (_, variables) => {
      if (!eventId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.deliverables(eventId, 1, 20).slice(0, 3),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.deliverable(eventId, variables.deliverableId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
    },
  })
}

export function useDeleteEventDeliverable(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ deliverableId }: { deliverableId: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.delete<undefined>(`/events/${eventId}/deliverables/${deliverableId}`)
    },
    onSuccess: (_, variables) => {
      if (!eventId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.deliverables(eventId, 1, 20).slice(0, 3),
      })
      queryClient.removeQueries({
        queryKey: queryKeys.events.deliverable(eventId, variables.deliverableId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
    },
  })
}
