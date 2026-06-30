import type { QueryClient, InfiniteData } from "@tanstack/react-query"
import { ApiError } from "@/lib/api"
import type {
  ChatConnectionState,
  ChatMessagesListResponse,
  ChatReactionEnvelope,
  ChatReactionEvent,
  EventChatMessage,
  EventChatReactionSummary,
  EventChatReplyPreview,
} from "@/types/chat"

export const MAX_MESSAGE_LENGTH = 2000

export const QUICK_REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"] as const

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

export function reactionDedupeKey(frame: ChatReactionEnvelope): string {
  const { type, data } = frame
  return `${type}:${data.message_id}:${data.user_id}:${data.emoji}`
}

export function applyReactionDelta(
  reactions: EventChatReactionSummary[] | undefined,
  event: ChatReactionEvent,
  added: boolean,
  currentUserId: string | undefined
): EventChatReactionSummary[] {
  const list = [...(reactions ?? [])]
  const isCurrentUser = !!currentUserId && event.user_id === currentUserId
  const idx = list.findIndex((r) => r.emoji === event.emoji)

  if (added) {
    if (idx >= 0) {
      const row = { ...list[idx], count: list[idx].count + 1 }
      if (isCurrentUser) row.reacted_by_me = true
      list[idx] = row
    } else {
      list.push({
        emoji: event.emoji,
        count: 1,
        reacted_by_me: isCurrentUser,
      })
    }
    if (isCurrentUser) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].emoji !== event.emoji && list[i].reacted_by_me) {
          const row = { ...list[i], reacted_by_me: false, count: Math.max(0, list[i].count - 1) }
          if (row.count === 0) {
            list.splice(i, 1)
            i--
          } else {
            list[i] = row
          }
        }
      }
    }
  } else if (idx >= 0) {
    const row = {
      ...list[idx],
      count: Math.max(0, list[idx].count - 1),
      reacted_by_me: isCurrentUser ? false : list[idx].reacted_by_me,
    }
    if (row.count === 0) {
      list.splice(idx, 1)
    } else {
      list[idx] = row
    }
  }

  return list
}

export function setMessageReactionsOnMessages(
  messages: EventChatMessage[],
  messageId: string,
  reactions: EventChatReactionSummary[]
): EventChatMessage[] {
  const hasMessage = messages.some((m) => m.message_id === messageId)
  if (!hasMessage) return messages

  const nextReactions = reactions.length > 0 ? reactions : undefined
  return messages.map((m) =>
    m.message_id === messageId ? { ...m, reactions: nextReactions } : m
  )
}

export function updateMessageReactionsInChatInfiniteCache(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  messageId: string,
  reactions: EventChatReactionSummary[]
): void {
  const nextReactions = reactions.length > 0 ? reactions : undefined
  queryClient.setQueryData<InfiniteData<ChatMessagesListResponse>>(
    queryKey,
    (old) => {
      if (!old) return old
      let found = false
      const pages = old.pages.map((page) => ({
        ...page,
        items: page.items.map((m) => {
          if (m.message_id !== messageId) return m
          found = true
          return { ...m, reactions: nextReactions }
        }),
      }))
      if (!found) return old
      return { ...old, pages }
    }
  )
}
