import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type {
  CreateSpeakerRequest,
  GetEventSpeakerResponse,
  Speaker,
} from "@/types/event"

export function useSpeakers(eventId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.speakers(eventId ?? ""),
    queryFn: () =>
      apiClient.get<Speaker[]>(`/events/${eventId}/speakers`),
    enabled: !!eventId,
  })
}

export function useSpeaker(eventId: string | null, speakerId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.speaker(eventId ?? "", speakerId ?? ""),
    queryFn: () =>
      apiClient.get<GetEventSpeakerResponse>(
        `/events/${eventId}/speakers/${speakerId}`
      ),
    enabled: !!eventId && !!speakerId,
  })
}

export function useSessionSpeakers(eventId: string | null, sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.sessionSpeakers(eventId ?? "", sessionId ?? ""),
    queryFn: () => {
      if (!eventId) throw new Error("No event selected")
      if (!sessionId) throw new Error("No session selected")
      return apiClient.get<Speaker[]>(
        `/events/${eventId}/sessions/${sessionId}/speakers`
      )
    },
    enabled: !!eventId && !!sessionId,
  })
}

export function useRemoveSessionSpeaker(eventId: string | null, sessionId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ speakerId }: { speakerId: string }) => {
      if (!eventId) throw new Error("No event selected")
      if (!sessionId) throw new Error("No session selected")
      return apiClient.delete<undefined>(
        `/events/${eventId}/sessions/${sessionId}/speakers/${speakerId}`
      )
    },
    onSuccess: (_data, variables) => {
      if (!eventId || !sessionId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.sessionSpeakers(eventId, sessionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(eventId),
      })
      // If speaker detail is cached, ensure its sessions list updates.
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.speaker(eventId, variables.speakerId),
      })
    },
  })
}

export function useAddSessionSpeaker(eventId: string | null, sessionId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ speakerId }: { speakerId: string }) => {
      if (!eventId) throw new Error("No event selected")
      if (!sessionId) throw new Error("No session selected")
      return apiClient.post<undefined>(
        `/events/${eventId}/sessions/${sessionId}/speakers`,
        { speaker_id: speakerId }
      )
    },
    onSuccess: (_data, variables) => {
      if (!eventId || !sessionId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.sessionSpeakers(eventId, sessionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(eventId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.speaker(eventId, variables.speakerId),
      })
    },
  })
}

export function useCreateSpeaker(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSpeakerRequest) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.post<Speaker>(`/events/${eventId}/speakers`, body)
    },
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.speakers(eventId),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.detail(eventId),
        })
      }
    },
  })
}

export function useDeleteSpeaker(eventId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ speakerId }: { speakerId: string }) => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.delete<unknown>(
        `/events/${eventId}/speakers/${speakerId}`
      )
    },
    onSuccess: (_, variables) => {
      if (eventId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.speakers(eventId),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.speaker(eventId, variables.speakerId),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.detail(eventId),
        })
      }
    },
  })
}
