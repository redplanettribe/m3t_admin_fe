import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const MAX_MESSAGE_LENGTH = 2000
const SHOW_COUNT_THRESHOLD = 1800

type EventChatComposerProps = {
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  disabled: boolean
  isSending: boolean
  canSend: boolean
  sendError: string | null
}

export function EventChatComposer({
  draft,
  onDraftChange,
  onSend,
  onKeyDown,
  disabled,
  isSending,
  canSend,
  sendError,
}: EventChatComposerProps): React.ReactElement {
  const showCount = draft.length > SHOW_COUNT_THRESHOLD

  return (
    <div className="border-border/60 shrink-0 border-t p-3">
      <div className="flex items-end gap-2">
        <label className="sr-only" htmlFor="chat-message">
          Message
        </label>
        <div className="bg-muted/50 flex min-w-0 flex-1 items-end rounded-xl px-3 py-2">
          <textarea
            id="chat-message"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled || isSending}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Message general chat…"
            rows={1}
            className={cn(
              "max-h-32 min-h-[44px] w-full resize-none border-0 bg-transparent text-sm",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
        </div>
        <Button
          onClick={onSend}
          disabled={!canSend}
          className="shrink-0"
        >
          {isSending ? "Sending…" : "Send"}
        </Button>
      </div>
      {(showCount || sendError) && (
        <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
          {showCount ? (
            <span className="text-muted-foreground text-xs">
              {draft.length}/{MAX_MESSAGE_LENGTH}
            </span>
          ) : (
            <span />
          )}
          {sendError ? (
            <p className="text-destructive text-xs">{sendError}</p>
          ) : null}
        </div>
      )}
      {!showCount && !sendError && (
        <p className="text-muted-foreground mt-1.5 px-1 text-xs">
          Enter to send · Shift+Enter for new line
        </p>
      )}
    </div>
  )
}
