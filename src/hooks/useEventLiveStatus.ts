import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import type { EventStatusStreamTicket } from "@/types/liveStatus"

export function useEventStatusStreamTicket(eventId: string | null) {
  return useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event selected")
      return apiClient.postNoBody<EventStatusStreamTicket>(
        `/events/${eventId}/live/status/ticket`
      )
    },
  })
}

