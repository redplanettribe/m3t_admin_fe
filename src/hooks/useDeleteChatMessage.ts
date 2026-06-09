import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"

type DeleteChatMessageVariables = {
  messageId: string
}

export function useDeleteChatMessage(eventId: string | null) {
  return useMutation({
    mutationFn: async ({ messageId }: DeleteChatMessageVariables) => {
      if (!eventId) throw new Error("No event selected")

      return apiClient.delete<undefined>(
        `/attendee/events/${eventId}/chat/messages/${messageId}`
      )
    },
  })
}
