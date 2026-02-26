import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEventSchedule, useToggleRoomNotBookable, useUpdateSessionSchedule, useDeleteSession, useCreateSession, useEventTags } from "@/hooks/useEvents"
import { useSessionDrag } from "@/hooks/useSessionDrag"
import { useEventStore } from "@/store/eventStore"
import type { EventSchedule, EventTag, Session, SessionInput } from "@/types/event"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { SessionizeImportModal } from "@/components/SessionizeImportModal"
import { ScheduleSessionCard } from "@/components/ScheduleSessionCard"
import { TagInput } from "@/components/TagInput"

const PIXELS_PER_MINUTE = 3
const TIME_LABEL_INTERVAL_MINUTES = 30
const ROOM_COLUMN_WIDTH = 200
const TIME_COLUMN_WIDTH = 64
const MIN_BODY_HEIGHT_PX = 320
const SCROLL_RIGHT_PADDING_PX = 24
const DEFAULT_SESSION_DURATION_MINUTES = 30

/** Format a Date as "HH:mm" for use with <input type="time"> */
function toTimeValue(date: Date): string {
  const h = date.getHours()
  const m = date.getMinutes()
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

/** Parse "HH:mm" and return a Date on the given day (start of day in ms) */
function timeValueToDate(timeValue: string, dayStartMs: number): Date {
  const [h, m] = timeValue.split(":").map(Number)
  const d = new Date(dayStartMs)
  d.setHours(h, m ?? 0, 0, 0)
  return d
}

/** Extract sessions array from API response (may be under different keys). */
function extractSessions(schedule: Record<string, unknown>): unknown[] {
  const s = schedule.sessions
  if (Array.isArray(s)) return s
  const scheduleNested = schedule.schedule
  if (scheduleNested != null && typeof scheduleNested === "object") {
    const nested = (scheduleNested as Record<string, unknown>).sessions
    if (Array.isArray(nested)) return nested
  }
  const slots = schedule.slots
  if (Array.isArray(slots)) return slots
  const items = schedule.items
  if (Array.isArray(items)) return items
  return []
}

function normalizeSession(s: SessionInput): Session | null {
  const raw = s as Record<string, unknown>
  const roomId =
    s.room_id ??
    (s as { roomId?: string }).roomId ??
    (typeof raw.room === "object" && raw.room != null && "id" in raw.room
      ? (raw.room as { id: string }).id
      : undefined)
  const startsAt =
    s.starts_at ??
    (s as { startsAt?: string }).startsAt ??
    (s as { start_time?: string }).start_time ??
    (s as { startTime?: string }).startTime ??
    (s as { start?: string }).start
  const endsAt =
    s.ends_at ??
    (s as { endsAt?: string }).endsAt ??
    (s as { end_time?: string }).end_time ??
    (s as { endTime?: string }).endTime ??
    (s as { end?: string }).end
  if (!roomId || !startsAt || !endsAt) return null
  const tagsRaw = s.tags ?? (raw.tags as string[] | EventTag[] | undefined)
  const tags: EventTag[] | undefined = Array.isArray(tagsRaw)
    ? tagsRaw.every((t) => typeof t === "string")
      ? (tagsRaw as string[]).map((name) => ({ id: "", name }))
      : (tagsRaw as EventTag[])
    : undefined
  return {
    id: String(s.id),
    room_id: String(roomId),
    starts_at: String(startsAt),
    ends_at: String(endsAt),
    title: s.title,
    description: s.description,
    speaker: s.speaker,
    speakers: s.speakers,
    tags,
  }
}

function getTimeRangeMinutes(sessions: Session[]): {
  startMinutes: number
  endMinutes: number
  scheduleDayStart: number
} {
  if (sessions.length === 0) {
    return {
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
      scheduleDayStart: new Date().setHours(0, 0, 0, 0),
    }
  }
  const firstStart = new Date(sessions[0].starts_at)
  const scheduleDayStart = new Date(firstStart)
  scheduleDayStart.setHours(0, 0, 0, 0)
  const scheduleDayStartMs = scheduleDayStart.getTime()
  let minStart = Infinity
  let maxEnd = -Infinity
  for (const s of sessions) {
    const startMs = new Date(s.starts_at).getTime()
    const endMs = new Date(s.ends_at).getTime()
    const startMinutes = (startMs - scheduleDayStartMs) / (60 * 1000)
    const endMinutes = (endMs - scheduleDayStartMs) / (60 * 1000)
    minStart = Math.min(minStart, startMinutes)
    maxEnd = Math.max(maxEnd, endMinutes)
  }
  const padding = 60
  return {
    startMinutes: Math.max(0, Math.floor(minStart / 60) * 60 - padding),
    endMinutes: Math.min(24 * 60, Math.ceil(maxEnd / 60) * 60 + padding),
    scheduleDayStart: scheduleDayStartMs,
  }
}

export function SchedulePage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const savedSessionizeId = useEventStore((s) =>
    activeEventId ? s.sessionizeIdByEventId[activeEventId] ?? "" : ""
  )
  const { data: schedule, isLoading, isError } = useEventSchedule(activeEventId)
  const toggleNotBookable = useToggleRoomNotBookable(activeEventId)
  const updateSessionSchedule = useUpdateSessionSchedule(activeEventId)
  const deleteSession = useDeleteSession(activeEventId)
  const createSession = useCreateSession(activeEventId)
  const { data: eventTags, isLoading: tagsLoading } = useEventTags(activeEventId)
  const [sessionizeOpen, setSessionizeOpen] = React.useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [createSessionDraft, setCreateSessionDraft] = useState<{
    roomId: string
    startsAt: Date
    endsAt: Date
  } | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [hoverPreview, setHoverPreview] = useState<{
    roomIndex: number
    topPx: number
    timeLabel: string
  } | null>(null)

  const scheduleRecord = schedule != null ? (schedule as unknown as Record<string, unknown>) : null
  const rooms: EventSchedule["rooms"] = (scheduleRecord?.rooms ?? []) as EventSchedule["rooms"]
  const roomsList = (rooms ?? [])
    .slice()
    .sort((a, b) => {
      const aNotBookable = Boolean(a.not_bookable)
      const bNotBookable = Boolean(b.not_bookable)

      if (aNotBookable && !bNotBookable) return -1
      if (!aNotBookable && bNotBookable) return 1
      if (aNotBookable && bNotBookable) return 0

      const aCapacity = a.capacity ?? Number.NEGATIVE_INFINITY
      const bCapacity = b.capacity ?? Number.NEGATIVE_INFINITY

      if (aCapacity === bCapacity) return 0
      return bCapacity - aCapacity
    })
  const rawSessions = extractSessions(scheduleRecord ?? {})
  const sessions = rawSessions
    .map((s) => normalizeSession(s as SessionInput))
    .filter((s): s is Session => s !== null)
  const {
    startMinutes: rangeStart,
    endMinutes: rangeEnd,
    scheduleDayStart,
  } = getTimeRangeMinutes(sessions)

  const { preview, handlePointerDown, activeSessionId } = useSessionDrag({
    rooms: roomsList,
    roomColumnWidth: ROOM_COLUMN_WIDTH,
    pixelsPerMinute: PIXELS_PER_MINUTE,
    rangeStartMinutes: rangeStart,
    scheduleDayStartMs: scheduleDayStart,
    updateSession: updateSessionSchedule.mutateAsync,
  })

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })

  function snapMinutesFromEvent(
    e: React.MouseEvent<HTMLDivElement>
  ): number {
    const rect = e.currentTarget.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    const rawMinutes = rangeStart + relativeY / PIXELS_PER_MINUTE
    return Math.round(rawMinutes / 15) * 15
  }

  function handleRoomColumnClick(
    e: React.MouseEvent<HTMLDivElement>,
    room: NonNullable<EventSchedule["rooms"]>[number]
  ) {
    const target = e.target as HTMLElement
    if (target.closest("[data-session-card]")) return

    const snappedMinutes = snapMinutesFromEvent(e)
    const startsAt = new Date(scheduleDayStart + snappedMinutes * 60_000)
    const endsAt = new Date(
      startsAt.getTime() + DEFAULT_SESSION_DURATION_MINUTES * 60_000
    )

    setCreateSessionDraft({
      roomId: String(room.id),
      startsAt,
      endsAt,
    })
  }

  function handleRoomColumnMouseMove(
    e: React.MouseEvent<HTMLDivElement>,
    roomIndex: number
  ) {
    if (activeSessionId) {
      if (hoverPreview) setHoverPreview(null)
      return
    }
    const target = e.target as HTMLElement
    if (target.closest("[data-session-card]")) {
      if (hoverPreview) setHoverPreview(null)
      return
    }

    const snappedMinutes = snapMinutesFromEvent(e)
    const topPx = (snappedMinutes - rangeStart) * PIXELS_PER_MINUTE
    const endMinutes = snappedMinutes + DEFAULT_SESSION_DURATION_MINUTES

    const fmt = (mins: number) => {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    }
    const timeLabel = `${fmt(snappedMinutes)} – ${fmt(endMinutes)}`

    setHoverPreview((prev) => {
      if (
        prev &&
        prev.roomIndex === roomIndex &&
        prev.topPx === topPx
      )
        return prev
      return { roomIndex, topPx, timeLabel }
    })
  }

  if (!activeEventId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Schedule</h2>
        <p className="text-muted-foreground">Select an event to view the schedule.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Schedule</h2>
        <p className="text-muted-foreground">Loading schedule…</p>
      </div>
    )
  }

  if (isError || !schedule) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Schedule</h2>
        <p className="text-muted-foreground text-destructive">Failed to load schedule.</p>
      </div>
    )
  }

  const event = scheduleRecord!.event as EventSchedule["event"]
  const totalMinutes = Math.max(0, rangeEnd - rangeStart)
  const bodyHeight = Math.max(
    MIN_BODY_HEIGHT_PX,
    totalMinutes * PIXELS_PER_MINUTE
  )

  const timeLabels: number[] = []
  for (let m = rangeStart; m <= rangeEnd; m += TIME_LABEL_INTERVAL_MINUTES) {
    timeLabels.push(m)
  }

  const sessionsByRoom = roomsList.map((room) =>
    sessions
      .filter((s) => String(s.room_id) === String(room.id))
      .map((s) => {
        const startMs = new Date(s.starts_at).getTime()
        const endMs = new Date(s.ends_at).getTime()
        const startMinutes = (startMs - scheduleDayStart) / (60 * 1000)
        const durationMinutes = (endMs - startMs) / (60 * 1000)
        const top = (startMinutes - rangeStart) * PIXELS_PER_MINUTE
        const height = durationMinutes * PIXELS_PER_MINUTE
        return { session: s, top, height }
      })
  )

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Schedule</h2>
        <p className="text-muted-foreground">{event.name}</p>
      </div>

      <Button onClick={() => setSessionizeOpen(true)}>Update from Sessionize</Button>
      <SessionizeImportModal
        eventId={activeEventId}
        open={sessionizeOpen}
        onOpenChange={setSessionizeOpen}
        defaultSessionizeId={savedSessionizeId}
      />

      {roomsList.length === 0 ? (
        <p className="text-muted-foreground">No rooms for this event.</p>
      ) : (
        <div className="w-full min-w-0 max-w-full mr-6 overflow-hidden">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden w-full min-w-0 max-w-full">
            <div
              className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-12rem)] w-full min-w-0 max-w-full"
              style={{ scrollPaddingRight: SCROLL_RIGHT_PADDING_PX }}
            >
              <div
                className="flex min-w-max border-b bg-muted/50"
                style={{
                  width: TIME_COLUMN_WIDTH + roomsList.length * ROOM_COLUMN_WIDTH + SCROLL_RIGHT_PADDING_PX,
                }}
              >
              <div
                className="sticky left-0 z-10 shrink-0 border-r bg-muted/50 px-2 py-2 text-xs font-medium text-muted-foreground"
                style={{ width: TIME_COLUMN_WIDTH }}
              >
                Time
              </div>
              {roomsList.map((room) => {
                const notBookable = Boolean(room.not_bookable)
                const isToggling =
                  toggleNotBookable.isPending &&
                  toggleNotBookable.variables?.roomId === room.id
                return (
                  <div
                    key={room.id}
                    className={cn(
                      "shrink-0 border-r px-2 py-2 text-sm font-medium last:border-r-0 flex flex-col gap-1",
                      notBookable &&
                        "bg-muted/80 text-muted-foreground opacity-90"
                    )}
                    style={{ width: ROOM_COLUMN_WIDTH }}
                  >
                    <span className="truncate">{room.name ?? room.id}</span>
                    <label className="flex items-center gap-2 cursor-pointer justify-start">
                      <Switch
                        size="sm"
                        checked={!notBookable}
                        disabled={isToggling}
                        onCheckedChange={() =>
                          toggleNotBookable.mutate({ roomId: room.id })
                        }
                        title={notBookable ? "Click to set bookable" : "Click to set not bookable"}
                      />
                      <span className="text-xs text-muted-foreground">
                        {isToggling ? "…" : notBookable ? "Not bookable" : "Bookable"}
                      </span>
                    </label>
                  </div>
                )
              })}
            </div>
            <div
              className="flex min-w-max relative flex-none"
              style={{
                minHeight: bodyHeight + 24,
                height: bodyHeight + 24,
                width: TIME_COLUMN_WIDTH + roomsList.length * ROOM_COLUMN_WIDTH + SCROLL_RIGHT_PADDING_PX,
              }}
            >
              <div
                className="sticky left-0 z-10 shrink-0 relative border-r bg-muted/30 overflow-visible"
                style={{ width: TIME_COLUMN_WIDTH, minHeight: bodyHeight, height: bodyHeight }}
              >
                {timeLabels.map((minutes) => (
                  <div
                    key={`time-line-${minutes}`}
                    className="absolute left-0 right-0 border-b border-border/50"
                    style={{
                      top: (minutes - rangeStart) * PIXELS_PER_MINUTE,
                    }}
                  />
                ))}
                {timeLabels.map((minutes) => {
                  const h = Math.floor(minutes / 60)
                  const m = minutes % 60
                  const label = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
                  const top = (minutes - rangeStart) * PIXELS_PER_MINUTE
                  return (
                    <div
                      key={minutes}
                      className="absolute left-1 text-xs text-muted-foreground tabular-nums"
                      style={{ top: Math.max(0, top - 10) }}
                    >
                      {label}
                    </div>
                  )
                })}
              </div>
              {roomsList.map((room, roomIndex) => (
                <div
                  key={room.id}
                  className={cn(
                    "shrink-0 relative border-r last:border-r-0 overflow-visible",
                    room.not_bookable ? "bg-muted/40" : "bg-background"
                  )}
                  style={{ width: ROOM_COLUMN_WIDTH, minHeight: bodyHeight, height: bodyHeight }}
                  onClick={(e) => handleRoomColumnClick(e, room)}
                  onMouseMove={(e) =>
                    handleRoomColumnMouseMove(e, roomIndex)
                  }
                  onMouseLeave={() => setHoverPreview(null)}
                >
                  {timeLabels.map((minutes) => (
                    <div
                      key={`line-${room.id}-${minutes}`}
                      className="absolute left-0 right-0 border-b border-border/50"
                      style={{
                        top: (minutes - rangeStart) * PIXELS_PER_MINUTE,
                      }}
                    />
                  ))}
                  {hoverPreview?.roomIndex === roomIndex && (
                    <div
                      className="absolute left-1 right-1 rounded-md border border-dashed border-primary/40 bg-primary/5 pointer-events-none flex items-center justify-center transition-[top] duration-100"
                      style={{
                        top: hoverPreview.topPx,
                        height:
                          DEFAULT_SESSION_DURATION_MINUTES * PIXELS_PER_MINUTE,
                      }}
                    >
                      <span className="text-xs text-primary/60 tabular-nums select-none">
                        {hoverPreview.timeLabel}
                      </span>
                    </div>
                  )}
                  {sessionsByRoom[roomIndex].map(({ session, top, height }) => {
                    const roomNotBookable = Boolean(room.not_bookable)
                    const isActive = activeSessionId === session.id
                    const previewTransform = isActive && preview
                      ? {
                          translateX: preview.translateX,
                          translateY: preview.translateY,
                          heightDelta: preview.heightDelta,
                        }
                      : undefined
                    return (
                      <ScheduleSessionCard
                        key={session.id}
                        session={session}
                        top={top}
                        height={height}
                        roomNotBookable={roomNotBookable}
                        eventId={activeEventId ?? undefined}
                        onDeleteClick={(s) => setSessionToDelete(s)}
                        isDraggingOrResizing={isActive}
                        previewTransform={previewTransform}
                        onPointerDown={(e, mode) =>
                          handlePointerDown(e, session, mode, roomIndex)
                        }
                      />
                    )
                  })}
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      )}

      {roomsList.length > 0 && sessions.length === 0 && (
        <p className="text-muted-foreground text-sm">No sessions scheduled.</p>
      )}

      <Dialog
        open={createSessionDraft !== null}
        onOpenChange={(open) => {
          if (!open && !createSession.isPending) {
            setCreateSessionDraft(null)
            setSelectedTags([])
          }
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>New session</DialogTitle>
            <DialogDescription>
              {createSessionDraft && (
                <>
                  {(() => {
                    const room = roomsList.find(
                      (r) => String(r.id) === createSessionDraft.roomId
                    )
                    const roomLabel = room?.name ?? room?.id ?? createSessionDraft.roomId
                    return `${roomLabel} · ${formatTime(
                      createSessionDraft.startsAt
                    )} – ${formatTime(createSessionDraft.endsAt)}`
                  })()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!createSessionDraft || !activeEventId) return

              const formData = new FormData(e.currentTarget)
              const title = String(formData.get("title") ?? "").trim()
              const description = String(formData.get("description") ?? "").trim()

              createSession.mutate(
                {
                  room_id: createSessionDraft.roomId,
                  start_time: createSessionDraft.startsAt.toISOString(),
                  end_time: createSessionDraft.endsAt.toISOString(),
                  title: title || undefined,
                  description: description || undefined,
                  tags: selectedTags.length > 0 ? selectedTags : undefined,
                },
                {
                  onSuccess: () => {
                    setCreateSessionDraft(null)
                    setSelectedTags([])
                  },
                }
              )
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Start time</span>
                <Input
                  type="time"
                  value={
                    createSessionDraft
                      ? toTimeValue(createSessionDraft.startsAt)
                      : ""
                  }
                  onChange={(e) => {
                    if (!createSessionDraft) return
                    const value = e.target.value
                    const newStartsAt = timeValueToDate(
                      value,
                      scheduleDayStart
                    )
                    const endsAtMs = createSessionDraft.endsAt.getTime()
                    let newEndsAt = createSessionDraft.endsAt
                    if (newStartsAt.getTime() >= endsAtMs) {
                      newEndsAt = new Date(
                        newStartsAt.getTime() +
                          DEFAULT_SESSION_DURATION_MINUTES * 60_000
                      )
                    }
                    setCreateSessionDraft({
                      ...createSessionDraft,
                      startsAt: newStartsAt,
                      endsAt: newEndsAt,
                    })
                  }}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">End time</span>
                <Input
                  type="time"
                  value={
                    createSessionDraft
                      ? toTimeValue(createSessionDraft.endsAt)
                      : ""
                  }
                  onChange={(e) => {
                    if (!createSessionDraft) return
                    const value = e.target.value
                    const newEndsAt = timeValueToDate(
                      value,
                      scheduleDayStart
                    )
                    const startsAtMs = createSessionDraft.startsAt.getTime()
                    let newStartsAt = createSessionDraft.startsAt
                    if (newEndsAt.getTime() <= startsAtMs) {
                      newStartsAt = new Date(
                        newEndsAt.getTime() -
                          DEFAULT_SESSION_DURATION_MINUTES * 60_000
                      )
                    }
                    setCreateSessionDraft({
                      ...createSessionDraft,
                      startsAt: newStartsAt,
                      endsAt: newEndsAt,
                    })
                  }}
                />
              </label>
            </div>
            <div className="space-y-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Title</span>
                <input
                  name="title"
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Session title"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Description</span>
                <textarea
                  name="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Optional description"
                />
              </label>
              <TagInput
                suggestions={(eventTags ?? []).map((t) => t.name)}
                value={selectedTags}
                onChange={setSelectedTags}
                isLoading={tagsLoading}
              />
            </div>
            {createSession.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {createSession.error instanceof Error
                  ? createSession.error.message
                  : "Failed to create session"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!createSession.isPending) {
                    setCreateSessionDraft(null)
                    setSelectedTags([])
                  }
                }}
                disabled={createSession.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSession.isPending}>
                {createSession.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sessionToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSessionToDelete(null)
            if (!deleteSession.isPending) deleteSession.reset()
          }
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete session</DialogTitle>
            <DialogDescription>
              This will permanently delete the session
              {sessionToDelete?.title ? ` "${sessionToDelete.title}"` : ""}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteSession.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {deleteSession.error instanceof Error
                  ? deleteSession.error.message
                  : "Failed to delete session"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSessionToDelete(null)
                  if (!deleteSession.isPending) deleteSession.reset()
                }}
                disabled={deleteSession.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (!sessionToDelete) return
                  deleteSession.mutate(
                    { sessionId: sessionToDelete.id },
                    { onSuccess: () => setSessionToDelete(null) }
                  )
                }}
                disabled={deleteSession.isPending}
              >
                {deleteSession.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
