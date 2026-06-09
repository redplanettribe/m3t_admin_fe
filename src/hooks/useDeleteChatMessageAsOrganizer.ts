import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"

type DeleteChatMessageAsOrganizerVariables = {
  messageId: string
}

export function useDeleteChatMessageAsOrganizer(eventId: string | null) {
  return useMutation({
    mutationFn: async ({ messageId }: DeleteChatMessageAsOrganizerVariables) => {
      if (!eventId) throw new Error("No event selected")

      return apiClient.delete<undefined>(
        `/events/${eventId}/chat/messages/${messageId}`
      )
    },
  })
}
