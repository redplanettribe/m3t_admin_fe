import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import type { EventChatMessage } from "@/types/chat"

const MAX_BODY_LENGTH = 2000

type SendGeneralChatMessageVariables = {
  body: string
  clientMsgId: string
}

export function useSendGeneralChatMessage(eventId: string | null) {
  return useMutation({
    mutationFn: async ({ body, clientMsgId }: SendGeneralChatMessageVariables) => {
      if (!eventId) throw new Error("No event selected")

      const trimmed = body.trim()
      if (!trimmed) throw new Error("Message cannot be empty")
      if (trimmed.length > MAX_BODY_LENGTH) {
        throw new Error(`Message must be at most ${MAX_BODY_LENGTH} characters`)
      }

      return apiClient.post<EventChatMessage>(
        `/attendee/events/${eventId}/chat/general/messages`,
        { body: trimmed, client_msg_id: clientMsgId }
      )
    },
  })
}
