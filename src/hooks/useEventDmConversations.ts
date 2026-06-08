import { useInfiniteQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type { DMConversationPreview, DMConversationsListResponse } from "@/types/chat"

const PAGE_SIZE = 50

async function fetchDmConversations(
  eventId: string,
  cursor?: string
): Promise<DMConversationsListResponse> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
  if (cursor) {
    params.set("cursor", cursor)
  }
  return apiClient.get<DMConversationsListResponse>(
    `/attendee/events/${eventId}/chat/dm/conversations?${params.toString()}`
  )
}

function flattenConversations(
  pages: DMConversationsListResponse[]
): DMConversationPreview[] {
  const byId = new Map<string, DMConversationPreview>()
  for (const page of pages) {
    for (const conv of page.items) {
      byId.set(conv.conversation_id, conv)
    }
  }
  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.last_message.created_at).getTime() -
      new Date(a.last_message.created_at).getTime()
  )
}

export function useEventDmConversations(eventId: string | null) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.events.chatDmConversations(eventId ?? ""),
    queryFn: ({ pageParam }) =>
      fetchDmConversations(eventId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!eventId,
  })

  const conversations = query.data ? flattenConversations(query.data.pages) : []

  return {
    ...query,
    conversations,
  }
}
