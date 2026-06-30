import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import type { EventChatMessage } from "@/types/chat"

const MAX_BODY_LENGTH = 2000

type SendDmMessageVariables = {
  recipientUserId: string
  body: string
  clientMsgId: string
  replyToMessageId?: string
}

export function useSendDmMessage(eventId: string | null) {
  return useMutation({
    mutationFn: async ({
      recipientUserId,
      body,
      clientMsgId,
      replyToMessageId,
    }: SendDmMessageVariables) => {
      if (!eventId) throw new Error("No event selected")

      const trimmed = body.trim()
      if (!trimmed) throw new Error("Message cannot be empty")
      if (trimmed.length > MAX_BODY_LENGTH) {
        throw new Error(`Message must be at most ${MAX_BODY_LENGTH} characters`)
      }

      return apiClient.post<EventChatMessage>(
        `/attendee/events/${eventId}/chat/dm/${recipientUserId}/messages`,
        {
          body: trimmed,
          client_msg_id: clientMsgId,
          ...(replyToMessageId ? { reply_to_message_id: replyToMessageId } : {}),
        }
      )
    },
  })
}
