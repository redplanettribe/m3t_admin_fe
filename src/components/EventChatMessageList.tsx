import * as React from "react"
import { EventChatMessageActionMenu } from "@/components/EventChatMessageActionMenu"
import { EventChatMessageReactions } from "@/components/EventChatMessageReactions"
import { EventChatReactionPicker } from "@/components/EventChatReactionPicker"
import { EventChatReplyQuote } from "@/components/EventChatReplyQuote"
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
  if (current.reply_to) return false
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
  onSenderClick?: (userId: string, message: EventChatMessage) => void
  onReplyMessage?: (message: EventChatMessage) => void
  onReactMessage?: (messageId: string, emoji: string) => void
  onRemoveReaction?: (messageId: string) => void
  reactingMessageId?: string | null
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
  onSenderClick,
  onReplyMessage,
  onReactMessage,
  onRemoveReaction,
  reactingMessageId,
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
          const isDeleting = deletingMessageId === message.message_id
          const isReacting = reactingMessageId === message.message_id
          const canReact = !!(onReactMessage && onRemoveReaction)
          const showModerateDelete = canModerateMessages && onDeleteMessage

          if (isOwn) {
            return (
              <div
                key={message.message_id}
                className={cn(
                  "group flex justify-end gap-1",
                  isContinuation ? "mt-0.5" : "mt-3"
                )}
              >
                <div className="flex max-w-[85%] flex-col items-end gap-1">
                  {!isContinuation && (
                    <span className="text-muted-foreground text-[11px]">
                      You · {formatMessageTime(message.created_at)}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    {canReact && (
                      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                        <EventChatReactionPicker
                          disabled={isReacting}
                          onSelect={(emoji) => onReactMessage(message.message_id, emoji)}
                        />
                      </div>
                    )}
                    <div className="relative">
                      <EventChatMessageActionMenu
                        showReply={!!onReplyMessage}
                        showDelete={!!onDeleteMessage}
                        onReply={
                          onReplyMessage ? () => onReplyMessage(message) : undefined
                        }
                        onDelete={
                          onDeleteMessage
                            ? () => onDeleteMessage(message.message_id)
                            : undefined
                        }
                        isDeleting={isDeleting}
                        align="end"
                      />
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-sm whitespace-pre-wrap break-words">
                        {message.reply_to ? (
                          <EventChatReplyQuote
                            reply={message.reply_to}
                            variant="embedded"
                            className="border-primary-foreground/40 bg-primary-foreground/10"
                          />
                        ) : null}
                        {message.body}
                      </div>
                    </div>
                  </div>
                  {canReact && message.reactions && message.reactions.length > 0 && (
                    <EventChatMessageReactions
                      reactions={message.reactions}
                      isOwn
                      disabled={isReacting}
                      onReact={(emoji) => onReactMessage(message.message_id, emoji)}
                      onRemove={() => onRemoveReaction(message.message_id)}
                    />
                  )}
                </div>
              </div>
            )
          }

          const handleSenderClick = onSenderClick
            ? () => onSenderClick(message.sender_user_id, message)
            : undefined

          return (
            <div
              key={message.message_id}
              className={cn(
                "group flex gap-2.5",
                isContinuation ? "mt-0.5 pl-11" : "mt-3"
              )}
            >
              {!isContinuation ? (
                onSenderClick ? (
                  <button
                    type="button"
                    onClick={handleSenderClick}
                    className="shrink-0 cursor-pointer rounded-full hover:opacity-80"
                    aria-label={`View ${name}'s profile`}
                  >
                    <Avatar className="size-8">
                      {message.sender_profile_picture_url ? (
                        <AvatarImage
                          src={message.sender_profile_picture_url}
                          alt={name}
                        />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                ) : (
                  <Avatar className="size-8 shrink-0">
                    {message.sender_profile_picture_url ? (
                      <AvatarImage
                        src={message.sender_profile_picture_url}
                        alt={name}
                      />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                )
              ) : null}

              <div className="min-w-0 max-w-[85%] flex-1">
                {!isContinuation && (
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
                    {onSenderClick ? (
                      <button
                        type="button"
                        onClick={handleSenderClick}
                        className="cursor-pointer text-sm font-medium hover:underline"
                      >
                        {name}
                      </button>
                    ) : (
                      <span className="text-sm font-medium">{name}</span>
                    )}
                    <span className="text-muted-foreground text-[11px]">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <div className="relative inline-block max-w-full">
                    <EventChatMessageActionMenu
                      showReply={!!onReplyMessage}
                      showDelete={!!showModerateDelete}
                      onReply={
                        onReplyMessage ? () => onReplyMessage(message) : undefined
                      }
                      onDelete={
                        showModerateDelete
                          ? () => onDeleteMessage(message.message_id)
                          : undefined
                      }
                      isDeleting={isDeleting}
                      align="end"
                    />
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm whitespace-pre-wrap break-words">
                      {message.reply_to ? (
                        <EventChatReplyQuote reply={message.reply_to} variant="embedded" />
                      ) : null}
                      {message.body}
                    </div>
                  </div>
                  {canReact && (
                    <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                      <EventChatReactionPicker
                        disabled={isReacting}
                        onSelect={(emoji) => onReactMessage(message.message_id, emoji)}
                      />
                    </div>
                  )}
                </div>
                {canReact && message.reactions && message.reactions.length > 0 && (
                  <EventChatMessageReactions
                    reactions={message.reactions}
                    isOwn={false}
                    disabled={isReacting}
                    onReact={(emoji) => onReactMessage(message.message_id, emoji)}
                    onRemove={() => onRemoveReaction(message.message_id)}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
