import type { PaginationMeta } from "@/types/event"

export type EventChatReplyPreview = {
  message_id: string
  sender_user_id: string
  sender_name: string
  sender_last_name: string
  body: string
  deleted: boolean
}

export type EventChatReactionSummary = {
  emoji: string
  count: number
  reacted_by_me: boolean
}

export type EventChatMessageReactionsView = {
  message_id: string
  reactions: EventChatReactionSummary[]
}

export type EventChatMessage = {
  message_id: string
  event_id: string
  channel_type: string
  conversation_id: string | null
  sender_user_id: string
  sender_name: string
  sender_last_name: string
  sender_profile_picture_url?: string
  recipient_user_id: string | null
  body: string
  reply_to?: EventChatReplyPreview
  reactions?: EventChatReactionSummary[]
  created_at: string
}

export type ChatMessagesListResponse = {
  items: EventChatMessage[]
  next_cursor?: string
}

export type ChatMessageEnvelope = {
  type: string
  topic: string
  data: EventChatMessage
  ts?: string
}

export type ChatMessageDeleted = {
  message_id: string
  event_id: string
  channel_type: string
  conversation_id: string | null
  deleted_at: string
}

export type ChatMessageDeletedEnvelope = {
  type: string
  topic: string
  data: ChatMessageDeleted
  ts?: string
}

export type ChatReactionEvent = {
  message_id: string
  event_id: string
  channel_type: string
  conversation_id: string | null
  emoji: string
  user_id: string
  user_name: string
  user_last_name: string
}

export type ChatReactionEnvelope = {
  type: "chat.reaction.added" | "chat.reaction.removed"
  topic: string
  data: ChatReactionEvent
  ts?: string
}

export type ChatWsErrorEnvelope = {
  type: "error"
  topic?: string
  data?: { code?: string; message?: string }
}

export type ChatConnectionState = "connecting" | "live" | "reconnecting" | "error"

export type ChatStreamError = {
  message: string
  code?: string
  status?: number
}

export type AgendaWsTicket = {
  ticket: string
  expires_at: string
}

export type SendChatMessageRequest = {
  body: string
  client_msg_id?: string
  reply_to_message_id?: string
}

export type DMConversationPreview = {
  conversation_id: string
  other_user_id: string
  last_message: EventChatMessage
}

export type DMConversationsListResponse = {
  items: DMConversationPreview[]
  next_cursor?: string
}

export type EventChatBan = {
  user_id: string
  user_name: string
  user_last_name: string
  banned_at: string
  banned_by_user_id: string
  banned_by_name: string
  banned_by_last_name: string
}

export type EventChatBansListResponse = {
  items: EventChatBan[]
  pagination: PaginationMeta
}
