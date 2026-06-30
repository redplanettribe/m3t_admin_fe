import * as React from "react"
import { cn } from "@/lib/utils"
import type { EventChatReactionSummary } from "@/types/chat"

type EventChatMessageReactionsProps = {
  reactions: EventChatReactionSummary[]
  isOwn: boolean
  disabled?: boolean
  onReact: (emoji: string) => void
  onRemove: () => void
}

export function EventChatMessageReactions({
  reactions,
  isOwn,
  disabled,
  onReact,
  onRemove,
}: EventChatMessageReactionsProps): React.ReactElement | null {
  if (reactions.length === 0) return null

  return (
    <div
      className={cn(
        "mt-1 flex flex-wrap gap-1",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          disabled={disabled}
          className={cn(
            "border-border/60 bg-background inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
            reaction.reacted_by_me
              ? "border-primary/50 bg-primary/10"
              : "hover:bg-muted"
          )}
          aria-label={
            reaction.reacted_by_me
              ? `Remove ${reaction.emoji} reaction`
              : `React with ${reaction.emoji}`
          }
          onClick={() => {
            if (reaction.reacted_by_me) {
              onRemove()
            } else {
              onReact(reaction.emoji)
            }
          }}
        >
          <span className="text-sm leading-none">{reaction.emoji}</span>
          <span className="text-muted-foreground tabular-nums">{reaction.count}</span>
        </button>
      ))}
    </div>
  )
}
