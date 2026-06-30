import type { QueryClient, InfiniteData } from "@tanstack/react-query"
import { ApiError } from "@/lib/api"
import type {
  ChatConnectionState,
  ChatMessagesListResponse,
  EventChatMessage,
  EventChatReplyPreview,
} from "@/types/chat"

export const MAX_MESSAGE_LENGTH = 2000

export function formatConnectionState(state: ChatConnectionState) {
  if (state === "connecting") return "Connecting"
  if (state === "reconnecting") return "Reconnecting"
  if (state === "live") return "Live"
  return "Error"
}

export function connectionDotClass(state: ChatConnectionState) {
  if (state === "live") return "bg-green-500"
  if (state === "error") return "bg-destructive"
  return "bg-amber-500"
}

export function isNotRegisteredError(error: unknown) {
  if (!(error instanceof ApiError)) return false
  return error.status === 403 && error.code === "not_registered_for_event"
}

export function isForbiddenStreamError(code?: string) {
  return code === "forbidden" || code === "not_registered_for_event"
}

export function mergeMessages(
  restMessages: EventChatMessage[],
  liveMessages: EventChatMessage[]
): EventChatMessage[] {
  const byId = new Map<string, EventChatMessage>()
  for (const msg of restMessages) {
    byId.set(msg.message_id, msg)
  }
  for (const msg of liveMessages) {
    byId.set(msg.message_id, msg)
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

export function profileDisplayName(profile: {
  name?: string
  last_name?: string
}): string {
  const parts = [profile.name, profile.last_name].filter(Boolean)
  return parts.join(" ").trim() || "Unknown"
}

export function replyPreviewDisplayName(reply: EventChatReplyPreview): string {
  return profileDisplayName({
    name: reply.sender_name,
    last_name: reply.sender_last_name,
  })
}

export function replyPreviewText(reply: EventChatReplyPreview): string {
  if (reply.deleted) return "Message deleted"
  return reply.body.trim() || "…"
}

export function replyPreviewFromMessage(
  message: EventChatMessage
): EventChatReplyPreview {
  return {
    message_id: message.message_id,
    sender_user_id: message.sender_user_id,
    sender_name: message.sender_name,
    sender_last_name: message.sender_last_name,
    body: message.body,
    deleted: false,
  }
}

export function filterOutMessage(
  messages: EventChatMessage[],
  messageId: string
): EventChatMessage[] {
  return messages.filter((m) => m.message_id !== messageId)
}

export function removeMessageFromChatInfiniteCache(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  messageId: string
): void {
  queryClient.setQueryData<InfiniteData<ChatMessagesListResponse>>(
    queryKey,
    (old) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.filter((m) => m.message_id !== messageId),
        })),
      }
    }
  )
}
