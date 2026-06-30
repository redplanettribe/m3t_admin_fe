import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import type { EventChatMessageReactionsView } from "@/types/chat"

type SetReactionVariables = {
  messageId: string
  emoji: string
}

type RemoveReactionVariables = {
  messageId: string
}

export function useOrganizersMessageReactions(eventId: string | null) {
  const setReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: SetReactionVariables) => {
      if (!eventId) throw new Error("No event selected")

      return apiClient.put<EventChatMessageReactionsView>(
        `/events/${eventId}/chat/organizers/messages/${messageId}/reactions`,
        { emoji }
      )
    },
  })

  const removeReaction = useMutation({
    mutationFn: async ({ messageId }: RemoveReactionVariables) => {
      if (!eventId) throw new Error("No event selected")

      return apiClient.delete<EventChatMessageReactionsView>(
        `/events/${eventId}/chat/organizers/messages/${messageId}/reactions`
      )
    },
  })

  return { setReaction, removeReaction }
}
