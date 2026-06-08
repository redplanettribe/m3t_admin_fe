import { ApiError } from "@/lib/api"
import type { ChatConnectionState, EventChatMessage } from "@/types/chat"

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
