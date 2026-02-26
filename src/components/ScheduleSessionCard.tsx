import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { EventTag, Session } from "@/types/event"
import { Button } from "@/components/ui/button"
import { ExternalLink, Trash2 } from "lucide-react"

const TAG_PILL_CLASS =
  "text-[10px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground shrink-0"
const TAGS_WRAPPER_MAX_LINES = 2
const LINE_HEIGHT_PX = 18
const RESIZE_HANDLE_HEIGHT_PX = 6

/** Tags with max 2 lines; ellipsis pill appears inline when content overflows. Always shows at least one tag. */
function SessionTags({ tags }: { tags: EventTag[] }) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [showEllipsis, setShowEllipsis] = React.useState(false)
  const [visibleCount, setVisibleCount] = React.useState(tags.length)
  const maxHeight = TAGS_WRAPPER_MAX_LINES * LINE_HEIGHT_PX

  React.useEffect(() => {
    setVisibleCount(tags.length)
    setShowEllipsis(false)
  }, [tags])

  React.useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const overflow = el.scrollHeight > el.clientHeight
    if (!showEllipsis && overflow) {
      setShowEllipsis(true)
    } else if (showEllipsis && overflow && visibleCount > 1) {
      setVisibleCount((n) => n - 1)
    }
  }, [tags, showEllipsis, visibleCount])

  const visibleTags = showEllipsis ? tags.slice(0, visibleCount) : tags
  return (
    <div
      ref={wrapperRef}
      className="flex flex-wrap gap-1 mt-1 overflow-hidden shrink-0"
      style={{ maxHeight }}
    >
      {visibleTags.map((tag) => (
        <span key={tag.id || tag.name} className={TAG_PILL_CLASS}>
          {tag.name}
        </span>
      ))}
      {showEllipsis && visibleCount < tags.length && (
        <span className={TAG_PILL_CLASS}>…</span>
      )}
    </div>
  )
}

export type SessionInteractionMode = "drag" | "resize-top" | "resize-bottom"

export interface ScheduleSessionCardProps {
  session: Session
  top: number
  height: number
  roomNotBookable: boolean
  /** When set, a hover "View" button links to the session detail page. */
  eventId?: string
  /** When set, a delete icon is shown; called when user clicks it (confirmation is handled by parent). */
  onDeleteClick?: (session: Session) => void
  isDraggingOrResizing?: boolean
  previewTransform?: { translateX: number; translateY: number; heightDelta?: number }
  onPointerDown: (e: React.PointerEvent, mode: SessionInteractionMode) => void
}

export function ScheduleSessionCard({
  session,
  top,
  height,
  roomNotBookable,
  eventId,
  onDeleteClick,
  isDraggingOrResizing = false,
  previewTransform,
  onPointerDown,
}: ScheduleSessionCardProps): React.ReactElement {
  const startTime = new Date(session.starts_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
  const endTime = new Date(session.ends_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
  const durationMin = Math.round(
    (new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) /
      60000
  )
  const speakerLabel =
    session.speaker ??
    (session.speakers?.length ? session.speakers.join(", ") : null)

  const style: React.CSSProperties = {
    top,
    height: Math.max(height + (previewTransform?.heightDelta ?? 0), 44),
    minHeight: 44,
    ...(previewTransform && {
      transform: `translate(${previewTransform.translateX}px, ${previewTransform.translateY}px) scale(1.02)`,
      zIndex: 50,
    }),
  }

  return (
    <div
      data-session-card=""
      className={cn(
        "absolute left-1 right-1 rounded-md border shadow-sm overflow-hidden flex flex-col gap-0.5 select-none touch-none group",
        roomNotBookable
          ? "border-muted bg-muted/60 text-muted-foreground opacity-90"
          : "border-primary/30 bg-primary/15",
        isDraggingOrResizing && "shadow-md ring-2 ring-primary/40"
      )}
      style={style}
    >
      {eventId && (
        <div
          className="absolute top-1 right-1 z-20 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button
            asChild
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded shadow-sm"
            aria-label="View session details"
          >
            <Link to={`/events/${eventId}/sessions/${session.id}`}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
          {onDeleteClick && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded shadow-sm text-muted-foreground hover:text-destructive"
              aria-label="Delete session"
              onClick={() => onDeleteClick(session)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
      {/* Resize handle: top edge */}
      <div
        className="absolute left-0 right-0 top-0 z-10 cursor-n-resize"
        style={{ height: RESIZE_HANDLE_HEIGHT_PX }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onPointerDown(e, "resize-top")
        }}
        aria-label="Resize session start time"
      />
      {/* Card body: drag handle */}
      <div
        className="flex flex-col gap-0.5 p-2 cursor-grab active:cursor-grabbing flex-1 min-h-0"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("[data-resize-handle]")) return
          onPointerDown(e, "drag")
        }}
      >
        <div className="text-xs font-semibold leading-tight line-clamp-2">
          {session.title ?? `Session ${session.id}`}
        </div>
        <div className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {startTime} – {endTime}
          {durationMin > 0 && ` (${durationMin} min)`}
        </div>
        {speakerLabel && (
          <div className="text-[10px] text-muted-foreground truncate">
            {speakerLabel}
          </div>
        )}
        {session.description && (
          <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
            {session.description}
          </div>
        )}
        {session.tags && session.tags.length > 0 && (
          <SessionTags tags={session.tags} />
        )}
      </div>
      {/* Resize handle: bottom edge */}
      <div
        data-resize-handle
        className="absolute left-0 right-0 bottom-0 z-10 cursor-n-resize"
        style={{ height: RESIZE_HANDLE_HEIGHT_PX }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onPointerDown(e, "resize-bottom")
        }}
        aria-label="Resize session end time"
      />
    </div>
  )
}
