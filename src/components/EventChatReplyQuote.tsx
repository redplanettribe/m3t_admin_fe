import * as React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { replyPreviewDisplayName, replyPreviewText } from "@/lib/chatUtils"
import { cn } from "@/lib/utils"
import type { EventChatReplyPreview } from "@/types/chat"

type EventChatReplyQuoteProps = {
  reply: EventChatReplyPreview
  variant: "embedded" | "composer"
  onCancel?: () => void
  className?: string
}

export function EventChatReplyQuote({
  reply,
  variant,
  onCancel,
  className,
}: EventChatReplyQuoteProps): React.ReactElement {
  const name = replyPreviewDisplayName(reply)
  const text = replyPreviewText(reply)
  const isDeleted = reply.deleted

  if (variant === "composer") {
    return (
      <div
        className={cn(
          "border-border/60 bg-muted/50 mb-2 flex items-start gap-2 rounded-lg border px-3 py-2",
          className
        )}
      >
        <div className="border-primary min-w-0 flex-1 border-l-2 pl-2">
          <p className="text-xs font-medium">{name}</p>
          <p
            className={cn(
              "truncate text-xs",
              isDeleted ? "text-muted-foreground italic" : "text-muted-foreground"
            )}
          >
            {text}
          </p>
        </div>
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground shrink-0"
            aria-label="Cancel reply"
            onClick={onCancel}
          >
            <X className="size-3.5" />
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "border-primary/40 bg-background/40 mb-1.5 border-l-2 pl-2",
        className
      )}
    >
      <p className="text-[11px] font-medium opacity-90">{name}</p>
      <p
        className={cn(
          "text-xs opacity-80",
          isDeleted ? "italic" : "line-clamp-2"
        )}
      >
        {text}
      </p>
    </div>
  )
}
