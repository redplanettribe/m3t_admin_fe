import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type { EventTeamMember } from "@/types/event"

export function useTeamMembers(eventId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.teamMembers(eventId ?? ""),
    queryFn: () =>
      apiClient.get<EventTeamMember[]>(`/events/${eventId}/team-members`),
    enabled: !!eventId,
  })
}

export function useAddTeamMember(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email }: { email: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<EventTeamMember>(
        `/events/${eventId}/team-members`,
        { email }
      )
    },
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.teamMembers(eventId),
        })
      }
    },
  })
}

export function useRemoveTeamMember(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userID }: { userID: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.delete<{ status?: string }>(
        `/events/${eventId}/team-members/${userID}`
      )
    },
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.teamMembers(eventId),
        })
      }
    },
  })
}
