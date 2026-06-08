import { useInfiniteQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type { ChatMessagesListResponse, EventChatMessage } from "@/types/chat"

const PAGE_SIZE = 50

async function fetchDmMessages(
  eventId: string,
  recipientUserId: string,
  cursor?: string
): Promise<ChatMessagesListResponse> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
  if (cursor) {
    params.set("cursor", cursor)
  }
  return apiClient.get<ChatMessagesListResponse>(
    `/attendee/events/${eventId}/chat/dm/${recipientUserId}/messages?${params.toString()}`
  )
}

function flattenMessages(pages: ChatMessagesListResponse[]): EventChatMessage[] {
  const byId = new Map<string, EventChatMessage>()
  for (const page of pages) {
    for (const msg of page.items) {
      byId.set(msg.message_id, msg)
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

export function useEventDmMessages(
  eventId: string | null,
  recipientUserId: string | null
) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.events.chatDmThread(
      eventId ?? "",
      recipientUserId ?? ""
    ),
    queryFn: ({ pageParam }) =>
      fetchDmMessages(
        eventId!,
        recipientUserId!,
        pageParam as string | undefined
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!eventId && !!recipientUserId,
  })

  const messages = query.data ? flattenMessages(query.data.pages) : []

  return {
    ...query,
    messages,
  }
}
