import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"

type DeleteOrganizersChatMessageVariables = {
  messageId: string
}

export function useDeleteOrganizersChatMessage(eventId: string | null) {
  return useMutation({
    mutationFn: async ({ messageId }: DeleteOrganizersChatMessageVariables) => {
      if (!eventId) throw new Error("No event selected")

      return apiClient.delete<undefined>(
        `/events/${eventId}/chat/organizers/messages/${messageId}`
      )
    },
  })
}
