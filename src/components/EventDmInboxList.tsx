import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { profileDisplayName, replyPreviewText } from "@/lib/chatUtils"
import { getInitials } from "@/lib/user"
import { cn } from "@/lib/utils"
import type { DMConversationPreview } from "@/types/chat"
import type { PublicAttendeeProfile } from "@/types/profile"

function formatPreviewTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

function otherParticipantName(
  conv: DMConversationPreview,
  currentUserId: string | undefined,
  profileByUserId: Map<string, PublicAttendeeProfile>
): string {
  const profile = profileByUserId.get(conv.other_user_id)
  if (profile) return profileDisplayName(profile)

  const msg = conv.last_message
  if (msg.sender_user_id === conv.other_user_id) {
    return profileDisplayName({
      name: msg.sender_name,
      last_name: msg.sender_last_name,
    })
  }
  if (currentUserId && msg.recipient_user_id === conv.other_user_id) {
    return "Attendee"
  }
  return "Unknown"
}

function otherParticipantAvatar(
  conv: DMConversationPreview,
  profileByUserId: Map<string, PublicAttendeeProfile>
): string | undefined {
  const profile = profileByUserId.get(conv.other_user_id)
  if (profile?.profile_picture_url) return profile.profile_picture_url

  const msg = conv.last_message
  if (msg.sender_user_id === conv.other_user_id) {
    return msg.sender_profile_picture_url
  }
  return undefined
}

type EventDmInboxListProps = {
  conversations: DMConversationPreview[]
  currentUserId: string | undefined
  profileByUserId: Map<string, PublicAttendeeProfile>
  selectedRecipientId: string | null
  onSelect: (recipientUserId: string) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  isLoading: boolean
  isEmpty: boolean
}

export function EventDmInboxList({
  conversations,
  currentUserId,
  profileByUserId,
  selectedRecipientId,
  onSelect,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  isLoading,
  isEmpty,
}: EventDmInboxListProps): React.ReactElement {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-muted/30">
      {isLoading && isEmpty && (
        <p className="text-muted-foreground m-auto p-4 text-sm">Loading conversations…</p>
      )}

      {!isLoading && isEmpty && (
        <p className="text-muted-foreground m-auto p-4 text-center text-sm">
          No conversations yet. Start a new message to chat with an attendee.
        </p>
      )}

      <ul className="divide-border/60 divide-y">
        {conversations.map((conv) => {
          const name = otherParticipantName(conv, currentUserId, profileByUserId)
          const avatarUrl = otherParticipantAvatar(conv, profileByUserId)
          const isSelected = selectedRecipientId === conv.other_user_id
          const preview = conv.last_message.reply_to
            ? `↩ ${replyPreviewText(conv.last_message.reply_to)}`
            : conv.last_message.body
          const time = formatPreviewTime(conv.last_message.created_at)

          return (
            <li key={conv.conversation_id}>
              <button
                type="button"
                onClick={() => onSelect(conv.other_user_id)}
                className={cn(
                  "hover:bg-muted/60 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                  isSelected && "bg-muted"
                )}
              >
                <Avatar className="size-10 shrink-0">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
                  <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{name}</span>
                    {time ? (
                      <span className="text-muted-foreground shrink-0 text-[11px]">
                        {time}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">{preview}</p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {hasNextPage && (
        <div className="flex justify-center p-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  )
}
