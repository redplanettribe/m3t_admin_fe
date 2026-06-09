import * as React from "react"
import { Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/user"
import { cn } from "@/lib/utils"
import type { EventChatMessage } from "@/types/chat"

const GROUP_WINDOW_MS = 5 * 60 * 1000

function formatMessageTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function senderDisplayName(message: EventChatMessage) {
  const parts = [message.sender_name, message.sender_last_name].filter(Boolean)
  return parts.join(" ").trim() || "Unknown"
}

function isGroupContinuation(
  current: EventChatMessage,
  previous: EventChatMessage | undefined
) {
  if (!previous) return false
  if (previous.sender_user_id !== current.sender_user_id) return false
  const prevTime = new Date(previous.created_at).getTime()
  const currTime = new Date(current.created_at).getTime()
  if (Number.isNaN(prevTime) || Number.isNaN(currTime)) return false
  return currTime - prevTime <= GROUP_WINDOW_MS
}

type EventChatMessageListProps = {
  messages: EventChatMessage[]
  currentUserId: string | undefined
  listRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadOlder: () => void
  isLoading: boolean
  isEmpty: boolean
  onDeleteMessage?: (messageId: string) => void
  deletingMessageId?: string | null
  canModerateMessages?: boolean
}

export function EventChatMessageList({
  messages,
  currentUserId,
  listRef,
  onScroll,
  hasNextPage,
  isFetchingNextPage,
  onLoadOlder,
  isLoading,
  isEmpty,
  onDeleteMessage,
  deletingMessageId,
  canModerateMessages,
}: EventChatMessageListProps): React.ReactElement {
  return (
    <div
      ref={listRef}
      onScroll={onScroll}
      className="flex flex-1 flex-col overflow-y-auto bg-muted/30 px-4 py-3"
    >
      {hasNextPage && (
        <div className="mb-3 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            disabled={isFetchingNextPage}
            onClick={onLoadOlder}
          >
            {isFetchingNextPage ? "Loading…" : "Load older messages"}
          </Button>
        </div>
      )}

      {isLoading && isEmpty && (
        <p className="text-muted-foreground m-auto text-sm">Loading messages…</p>
      )}

      {!isLoading && isEmpty && (
        <p className="text-muted-foreground m-auto text-sm">No messages yet.</p>
      )}

      <div className="mt-auto space-y-1">
        {messages.map((message, index) => {
          const previous = index > 0 ? messages[index - 1] : undefined
          const isOwn = !!currentUserId && message.sender_user_id === currentUserId
          const isContinuation = isGroupContinuation(message, previous)
          const name = senderDisplayName(message)

          if (isOwn) {
            const isDeleting = deletingMessageId === message.message_id
            return (
              <div
                key={message.message_id}
                className={cn(
                  "group flex justify-end gap-1",
                  isContinuation ? "mt-0.5" : "mt-3"
                )}
              >
                {onDeleteMessage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive shrink-0 self-end opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Delete message"
                    disabled={isDeleting}
                    onClick={() => onDeleteMessage(message.message_id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
                <div className="flex max-w-[85%] flex-col items-end gap-1">
                  {!isContinuation && (
                    <span className="text-muted-foreground text-[11px]">
                      You · {formatMessageTime(message.created_at)}
                    </span>
                  )}
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-sm whitespace-pre-wrap break-words">
                    {message.body}
                  </div>
                </div>
              </div>
            )
          }

          const isDeleting = deletingMessageId === message.message_id
          const showModerateDelete = canModerateMessages && onDeleteMessage

          return (
            <div
              key={message.message_id}
              className={cn(
                "group flex gap-2.5",
                isContinuation ? "mt-0.5 pl-11" : "mt-3"
              )}
            >
              {!isContinuation ? (
                <Avatar className="size-8 shrink-0">
                  {message.sender_profile_picture_url ? (
                    <AvatarImage src={message.sender_profile_picture_url} alt={name} />
                  ) : null}
                  <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                </Avatar>
              ) : null}

              <div className="min-w-0 max-w-[85%] flex-1">
                {!isContinuation && (
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-muted-foreground text-[11px]">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                )}
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm whitespace-pre-wrap break-words">
                  {message.body}
                </div>
              </div>

              {showModerateDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive shrink-0 self-end opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Delete message"
                  disabled={isDeleting}
                  onClick={() => onDeleteMessage(message.message_id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
