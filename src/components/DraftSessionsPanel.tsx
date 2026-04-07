import * as React from "react"
import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen, Plus, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Session, Speaker } from "@/types/event"

const PANEL_WIDTH = 280
const COLLAPSED_WIDTH = 40

function speakerInitials(speaker: Speaker): string {
  const first = speaker.first_name?.charAt(0) ?? ""
  const last = speaker.last_name?.charAt(0) ?? ""
  return (first + last).toUpperCase() || "?"
}

interface DraftSessionItemProps {
  session: Session
  onPointerDown: (e: React.PointerEvent, session: Session) => void
}

function DraftSessionItem({ session, onPointerDown }: DraftSessionItemProps) {
  const speakers = session.speakers ?? []
  return (
    <div
      className="flex items-start gap-2 rounded-md border bg-card px-3 py-2 cursor-grab active:cursor-grabbing select-none touch-none hover:bg-accent/50 transition-colors"
      onPointerDown={(e) => onPointerDown(e, session)}
    >
      <GripVertical className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/50" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium leading-tight truncate">
          {session.title || "Untitled session"}
        </div>
        {speakers.length > 0 && (
          <AvatarGroup className="mt-1.5">
            {speakers.slice(0, 4).map((speaker) => (
              <Avatar key={speaker.id} size="sm">
                {speaker.profile_picture ? (
                  <AvatarImage
                    src={speaker.profile_picture}
                    alt={`${speaker.first_name ?? ""} ${speaker.last_name ?? ""}`}
                  />
                ) : null}
                <AvatarFallback>{speakerInitials(speaker)}</AvatarFallback>
              </Avatar>
            ))}
            {speakers.length > 4 && (
              <Avatar size="sm">
                <AvatarFallback>+{speakers.length - 4}</AvatarFallback>
              </Avatar>
            )}
          </AvatarGroup>
        )}
      </div>
    </div>
  )
}

export interface DraftSessionsPanelProps {
  sessions: Session[]
  isLoading: boolean
  isOverUnscheduleZone: boolean
  onCreateDraft: (title: string) => void
  isCreating: boolean
  onDraftPointerDown: (e: React.PointerEvent, session: Session) => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export function DraftSessionsPanel({
  sessions,
  isLoading,
  isOverUnscheduleZone,
  onCreateDraft,
  isCreating,
  onDraftPointerDown,
  collapsed,
  onCollapsedChange,
}: DraftSessionsPanelProps): React.ReactElement {
  const [newTitle, setNewTitle] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    onCreateDraft(title)
    setNewTitle("")
  }

  if (collapsed) {
    return (
      <div
        className="shrink-0 flex flex-col items-center border-r bg-muted/30 py-2"
        style={{ width: COLLAPSED_WIDTH }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onCollapsedChange(false)}
          aria-label="Expand drafts panel"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
        <span
          className="text-xs text-muted-foreground mt-2"
          style={{ writingMode: "vertical-lr" }}
        >
          Drafts ({sessions.length})
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "shrink-0 flex flex-col border-r bg-muted/30 transition-colors",
        isOverUnscheduleZone &&
          "bg-primary/10 border-primary/40 ring-2 ring-inset ring-primary/30",
      )}
      style={{ width: PANEL_WIDTH }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <h3 className="text-sm font-semibold">
          Drafts{" "}
          <span className="text-muted-foreground font-normal">
            ({sessions.length})
          </span>
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onCollapsedChange(true)}
          aria-label="Collapse drafts panel"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-1.5 px-3 py-2 border-b"
      >
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New draft title…"
          className="h-8 text-sm"
          disabled={isCreating}
        />
        <Button
          type="submit"
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0"
          disabled={isCreating || !newTitle.trim()}
          aria-label="Create draft session"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {isLoading ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            Loading…
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No draft sessions.
            <br />
            Create one above or drag a session here to unschedule it.
          </p>
        ) : (
          sessions.map((session) => (
            <DraftSessionItem
              key={session.id}
              session={session}
              onPointerDown={onDraftPointerDown}
            />
          ))
        )}
      </div>

      {isOverUnscheduleZone && (
        <div className="px-3 py-2 border-t bg-primary/5 text-center">
          <p className="text-xs font-medium text-primary">
            Release to unschedule
          </p>
        </div>
      )}
    </div>
  )
}
