import * as React from "react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEventSchedule, useEventSessionsSchedule, useToggleRoomNotBookable, useUpdateSessionSchedule, useDeleteSession, useCreateSession, useEventTags } from "@/hooks/useEvents"
import { useSessionDrag } from "@/hooks/useSessionDrag"
import { useDraftPlacement } from "@/hooks/useDraftPlacement"
import { useEventStore } from "@/store/eventStore"
import type {
  EventSchedule,
  EventTag,
  PlacedSession,
  Room,
  Session,
  SessionInput,
  Speaker,
} from "@/types/event"
import { DraftSessionsPanel } from "@/components/DraftSessionsPanel"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { makeNavigateFrom } from "@/lib/returnNavigation"
import { cn } from "@/lib/utils"
import { SessionizeImportModal } from "@/components/SessionizeImportModal"
import { ScheduleSessionCard } from "@/components/ScheduleSessionCard"
import { TagInput } from "@/components/TagInput"
import { AddRoomModal } from "@/components/AddRoomModal"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const PIXELS_PER_MINUTE = 3
const TIME_LABEL_INTERVAL_MINUTES = 30
const ROOM_COLUMN_WIDTH = 200
const TIME_COLUMN_WIDTH = 64
const MIN_BODY_HEIGHT_PX = 320
const SCROLL_RIGHT_PADDING_PX = 24
const DEFAULT_SESSION_DURATION_MINUTES = 30
const ADD_ROOM_COLUMN_WIDTH = 120

/** Convert "HH:mm" to minutes since midnight. */
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + (m ?? 0)
}

/** Convert minutes since midnight to "HH:mm". */
function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

/** Derive flat rooms and sessions from GET /events/{eventID} response (event + rooms with nested sessions). */
function getRoomsAndSessions(schedule: EventSchedule): { rooms: Room[]; rawSessions: unknown[] } {
  const rooms = schedule.rooms.map((rw) => rw.room)
  const rawSessions = schedule.rooms.flatMap((rw) => rw.sessions)
  return { rooms, rawSessions }
}

function normalizeSession(s: SessionInput): PlacedSession | null {
  const raw = s as Record<string, unknown>
  const roomId = s.room_id
  const eventDay = (s as { event_day?: number }).event_day ?? 1
  const startTime = (s as { start_time?: string }).start_time
  const endTime = (s as { end_time?: string }).end_time
  if (!roomId || startTime == null || endTime == null) return null
  const tagsRaw = s.tags ?? (raw.tags as string[] | EventTag[] | undefined)
  const tags: EventTag[] | undefined = Array.isArray(tagsRaw)
    ? tagsRaw.every((t) => typeof t === "string")
      ? (tagsRaw as string[]).map((name) => ({ id: "", name }))
      : (tagsRaw as EventTag[])
    : undefined
  return {
    id: String(s.id),
    room_id: String(roomId),
    event_day: eventDay,
    start_time: String(startTime),
    end_time: String(endTime),
    title: s.title,
    description: s.description,
    speakers: (raw.speakers as Speaker[] | undefined) ??
      (raw.speakers === null ? undefined : undefined),
    tags,
  }
}

/** Compute time range (minutes since midnight) from sessions' HH:mm times. */
function getTimeRangeMinutes(sessions: PlacedSession[]): {
  startMinutes: number
  endMinutes: number
} {
  if (sessions.length === 0) {
    return { startMinutes: 9 * 60, endMinutes: 17 * 60 }
  }
  let minStart = Infinity
  let maxEnd = -Infinity
  for (const s of sessions) {
    const startMinutes = hhmmToMinutes(s.start_time)
    const endMinutes = hhmmToMinutes(s.end_time)
    minStart = Math.min(minStart, startMinutes)
    maxEnd = Math.max(maxEnd, endMinutes)
  }
  const padding = 60
  return {
    startMinutes: Math.max(0, Math.floor(minStart / 60) * 60 - padding),
    endMinutes: Math.min(24 * 60, Math.ceil(maxEnd / 60) * 60 + padding),
  }
}

/** Event day for multiday selector: dateStr is YYYY-MM-DD, startMs is midnight UTC. Returns [] if startDate is invalid. */
function getEventDays(startDate: string, durationDays: number): { dateStr: string; startMs: number; label: string }[] {
  const trimmed = typeof startDate === "string" ? startDate.trim() : ""
  if (!trimmed) return []
  const start = new Date(trimmed + "T00:00:00Z")
  if (Number.isNaN(start.getTime())) return []
  const days: { dateStr: string; startMs: number; label: string }[] = []
  for (let i = 0; i < Math.max(1, durationDays); i++) {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const startMs = d.getTime()
    const label = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    days.push({ dateStr, startMs, label })
  }
  return days
}

/** Build day selector options: use real dates when start_date is set, otherwise "Day 1", "Day 2", ... Always returns at least one day. */
function getScheduleDayOptions(
  event: { start_date?: string; duration_days?: number } | undefined,
  maxSessionDay: number
): { label: string; dayIndex: number }[] {
  const duration = event?.duration_days ?? Math.max(1, maxSessionDay)
  const startDate = event?.start_date?.trim()
  if (startDate) {
    const withDates = getEventDays(startDate, duration)
    if (withDates.length > 0) {
      return withDates.map((d, i) => ({ label: d.label, dayIndex: i }))
    }
  }
  return Array.from({ length: Math.max(1, duration) }, (_, i) => ({
    label: `Day ${i + 1}`,
    dayIndex: i,
  }))
}

export function SchedulePage(): React.ReactElement {
  const location = useLocation()
  const roomNavigateState = makeNavigateFrom(location)
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
    eventDay: number
    startTime: string
    endTime: string
  } | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [hoverPreview, setHoverPreview] = useState<{
    roomIndex: number
    topPx: number
    timeLabel: string
  } | null>(null)
  const [addRoomOpen, setAddRoomOpen] = useState(false)
  const [addRoomHovered, setAddRoomHovered] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [draftPanelCollapsed, setDraftPanelCollapsed] = useState(false)
  const gridBodyRef = React.useRef<HTMLDivElement>(null)

  const { data: sessionsSchedule, isLoading: draftsLoading } =
    useEventSessionsSchedule(activeEventId, { page: 1, pageSize: 200, search: "" })
  const draftSessions: Session[] = (sessionsSchedule?.unscheduled_sessions as Session[] | undefined) ?? []

  const { rooms: roomsFromSchedule, rawSessions: rawSessionsFromSchedule } =
    schedule != null ? getRoomsAndSessions(schedule) : { rooms: [] as Room[], rawSessions: [] as unknown[] }
  const event = schedule?.event
  const allSessions = rawSessionsFromSchedule
    .map((s) => normalizeSession(s as SessionInput))
    .filter((s): s is PlacedSession => s !== null)
  const maxSessionDay = allSessions.length > 0
    ? Math.max(...allSessions.map((s) => s.event_day))
    : 1
  const scheduleDayOptions = getScheduleDayOptions(event, maxSessionDay)
  React.useEffect(() => {
    if (scheduleDayOptions.length > 0 && selectedDayIndex >= scheduleDayOptions.length) {
      setSelectedDayIndex(Math.max(0, scheduleDayOptions.length - 1))
    }
  }, [scheduleDayOptions.length, selectedDayIndex])

  const roomsList = roomsFromSchedule
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
  const selectedEventDay = selectedDayIndex + 1
  const sessionsForDay = allSessions.filter((s) => s.event_day === selectedEventDay)
  const { startMinutes: rangeStart, endMinutes: rangeEnd } =
    getTimeRangeMinutes(sessionsForDay)

  const handleUnschedule = React.useCallback(
    (session: Session) => {
      updateSessionSchedule.mutateAsync({
        sessionId: session.id,
        room_id: null,
        start_time: null,
        end_time: null,
        event_day: null,
      }).catch(() => {})
    },
    [updateSessionSchedule],
  )

  const { preview, handlePointerDown, activeSessionId, isOverUnscheduleZone } = useSessionDrag({
    rooms: roomsList,
    roomColumnWidth: ROOM_COLUMN_WIDTH,
    pixelsPerMinute: PIXELS_PER_MINUTE,
    rangeStartMinutes: rangeStart,
    updateSession: updateSessionSchedule.mutateAsync,
    onUnschedule: handleUnschedule,
  })

  const {
    handleDraftPointerDown,
    placementPreview,
    isDraggingDraft,
  } = useDraftPlacement({
    gridRef: gridBodyRef,
    rooms: roomsList,
    timeColumnWidth: TIME_COLUMN_WIDTH,
    roomColumnWidth: ROOM_COLUMN_WIDTH,
    pixelsPerMinute: PIXELS_PER_MINUTE,
    rangeStartMinutes: rangeStart,
    eventDay: selectedEventDay,
    updateSession: updateSessionSchedule.mutateAsync,
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
    room: Room
  ) {
    const target = e.target as HTMLElement
    if (target.closest("[data-session-card]")) return

    const snappedMinutes = snapMinutesFromEvent(e)
    setCreateSessionDraft({
      roomId: String(room.id),
      eventDay: selectedEventDay,
      startTime: minutesToHHMM(snappedMinutes),
      endTime: minutesToHHMM(snappedMinutes + DEFAULT_SESSION_DURATION_MINUTES),
    })
  }

  function handleRoomColumnMouseMove(
    e: React.MouseEvent<HTMLDivElement>,
    roomIndex: number
  ) {
    if (activeSessionId || isDraggingDraft) {
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
    const timeLabel = `${minutesToHHMM(snappedMinutes)} – ${minutesToHHMM(snappedMinutes + DEFAULT_SESSION_DURATION_MINUTES)}`

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

  const totalMinutes = Math.max(0, rangeEnd - rangeStart)
  const bodyHeight = Math.max(
    MIN_BODY_HEIGHT_PX,
    totalMinutes * PIXELS_PER_MINUTE
  )

  const scheduleWidth =
    TIME_COLUMN_WIDTH +
    roomsList.length * ROOM_COLUMN_WIDTH +
    ADD_ROOM_COLUMN_WIDTH +
    SCROLL_RIGHT_PADDING_PX

  const timeLabels: number[] = []
  for (let m = rangeStart; m <= rangeEnd; m += TIME_LABEL_INTERVAL_MINUTES) {
    timeLabels.push(m)
  }

  const sessionsByRoom = roomsList.map((room) =>
    sessionsForDay
      .filter((s) => String(s.room_id) === String(room.id))
      .map((s) => {
        const startMinutes = hhmmToMinutes(s.start_time)
        const endMinutes = hhmmToMinutes(s.end_time)
        const top = (startMinutes - rangeStart) * PIXELS_PER_MINUTE
        const height = (endMinutes - startMinutes) * PIXELS_PER_MINUTE
        return { session: s, top, height }
      })
  )

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Schedule</h2>
          <p className="text-muted-foreground">{event?.name}</p>
          {scheduleDayOptions.length > 1 && (
            <Tabs
              value={String(selectedDayIndex)}
              onValueChange={(v) => setSelectedDayIndex(Number(v))}
              className="mt-3"
            >
              <TabsList>
                {scheduleDayOptions.map((day) => (
                  <TabsTrigger key={day.dayIndex} value={String(day.dayIndex)}>
                    {day.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
        <Button onClick={() => setSessionizeOpen(true)} className="shrink-0">
          Update from Sessionize
        </Button>
      </div>

      <SessionizeImportModal
        eventId={activeEventId}
        open={sessionizeOpen}
        onOpenChange={setSessionizeOpen}
        defaultSessionizeId={savedSessionizeId}
      />

      {roomsList.length === 0 ? (
        <p className="text-muted-foreground">No rooms for this event.</p>
      ) : (
        <div className="flex w-full min-w-0 max-w-full mr-6 overflow-hidden">
          <DraftSessionsPanel
            sessions={draftSessions}
            isLoading={draftsLoading}
            isOverUnscheduleZone={isOverUnscheduleZone}
            onCreateDraft={(title) => {
              if (!activeEventId) return
              createSession.mutate({ title })
            }}
            isCreating={createSession.isPending}
            onDraftPointerDown={handleDraftPointerDown}
            collapsed={draftPanelCollapsed}
            onCollapsedChange={setDraftPanelCollapsed}
          />
          <div className="flex-1 min-w-0 overflow-hidden">
          <div
            className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden"
            style={{ width: scheduleWidth, maxWidth: "100%" }}
          >
            <div
              data-schedule-scroll
              className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-12rem)] w-full min-w-0 max-w-full"
              style={{ scrollPaddingRight: SCROLL_RIGHT_PADDING_PX }}
            >
              <div
                className="flex min-w-max border-b bg-muted/50"
                style={{
                  width: scheduleWidth,
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
                    <Link
                      to={`/rooms/${room.id}`}
                      state={roomNavigateState}
                      className="truncate hover:underline"
                    >
                      {room.name ?? room.id}
                    </Link>
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
              <div
                className={cn(
                  "shrink-0 border-l px-2 py-2 flex items-center justify-center transition-colors bg-muted/50",
                  addRoomHovered && "bg-muted"
                )}
                style={{ width: ADD_ROOM_COLUMN_WIDTH }}
              >
                <Button
                  size="icon"
                  variant={addRoomHovered ? "default" : "outline"}
                  className="h-9 w-9"
                  onClick={() => setAddRoomOpen(true)}
                  onMouseEnter={() => setAddRoomHovered(true)}
                  onMouseLeave={() => setAddRoomHovered(false)}
                  aria-label="Add room"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div
              ref={gridBodyRef}
              className="flex min-w-max relative flex-none"
              style={{
                minHeight: bodyHeight + 24,
                height: bodyHeight + 24,
                width: scheduleWidth,
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
                    "shrink-0 relative border-r overflow-visible",
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
                  {placementPreview?.roomIndex === roomIndex && (
                    <div
                      className="absolute left-1 right-1 rounded-md border-2 border-dashed border-primary/60 bg-primary/10 pointer-events-none flex items-center justify-center z-20"
                      style={{
                        top: placementPreview.topPx,
                        height: placementPreview.heightPx,
                      }}
                    >
                      <span className="text-xs font-medium text-primary/80 tabular-nums select-none">
                        {placementPreview.timeLabel}
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
              <div
                className={cn(
                  "shrink-0 relative border-l transition-colors",
                  addRoomHovered ? "bg-muted" : "bg-muted/20"
                )}
                style={{ width: ADD_ROOM_COLUMN_WIDTH, minHeight: bodyHeight, height: bodyHeight }}
              />
            </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {roomsList.length > 0 && sessionsForDay.length === 0 && (
        <p className="text-muted-foreground text-sm">No sessions scheduled.</p>
      )}

      <AddRoomModal
        open={addRoomOpen}
        onOpenChange={setAddRoomOpen}
        eventId={activeEventId}
      />

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
                    return `${roomLabel} · Day ${createSessionDraft.eventDay} · ${createSessionDraft.startTime} – ${createSessionDraft.endTime}`
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
                  event_day: createSessionDraft.eventDay,
                  start_time: createSessionDraft.startTime,
                  end_time: createSessionDraft.endTime,
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
                  value={createSessionDraft?.startTime ?? ""}
                  onChange={(e) => {
                    if (!createSessionDraft) return
                    const value = e.target.value
                    const endMins = hhmmToMinutes(createSessionDraft.endTime)
                    const startMins = hhmmToMinutes(value)
                    let newEndTime = createSessionDraft.endTime
                    if (startMins >= endMins) {
                      newEndTime = minutesToHHMM(
                        startMins + DEFAULT_SESSION_DURATION_MINUTES
                      )
                    }
                    setCreateSessionDraft({
                      ...createSessionDraft,
                      startTime: value,
                      endTime: newEndTime,
                    })
                  }}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">End time</span>
                <Input
                  type="time"
                  value={createSessionDraft?.endTime ?? ""}
                  onChange={(e) => {
                    if (!createSessionDraft) return
                    const value = e.target.value
                    const startMins = hhmmToMinutes(createSessionDraft.startTime)
                    const endMins = hhmmToMinutes(value)
                    let newStartTime = createSessionDraft.startTime
                    if (endMins <= startMins) {
                      newStartTime = minutesToHHMM(
                        endMins - DEFAULT_SESSION_DURATION_MINUTES
                      )
                    }
                    setCreateSessionDraft({
                      ...createSessionDraft,
                      startTime: newStartTime,
                      endTime: value,
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
