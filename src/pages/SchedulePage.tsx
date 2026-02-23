import * as React from "react"
import { useEventSchedule } from "@/hooks/useEvents"
import { useEventStore } from "@/store/eventStore"
import type { EventSchedule, Session, SessionInput } from "@/types/event"

const PIXELS_PER_MINUTE = 3
const TIME_LABEL_INTERVAL_MINUTES = 30
const ROOM_COLUMN_WIDTH = 200
const TIME_COLUMN_WIDTH = 64
const MIN_BODY_HEIGHT_PX = 320
const SCROLL_RIGHT_PADDING_PX = 24

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
  return {
    id: String(s.id),
    room_id: String(roomId),
    starts_at: String(startsAt),
    ends_at: String(endsAt),
    title: s.title,
    description: s.description,
    speaker: s.speaker,
    speakers: s.speakers,
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
  const { data: schedule, isLoading, isError } = useEventSchedule(activeEventId)

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

  const scheduleRecord = schedule as unknown as Record<string, unknown>
  const event = scheduleRecord.event as EventSchedule["event"]
  const rooms: EventSchedule["rooms"] = (scheduleRecord.rooms ?? []) as EventSchedule["rooms"]
  const roomsList = rooms ?? []
  const rawSessions = extractSessions(scheduleRecord)
  const sessions = rawSessions
    .map((s) => normalizeSession(s as SessionInput))
    .filter((s): s is Session => s !== null)
  const {
    startMinutes: rangeStart,
    endMinutes: rangeEnd,
    scheduleDayStart,
  } = getTimeRangeMinutes(sessions)
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
              {roomsList.map((room) => (
                <div
                  key={room.id}
                  className="shrink-0 border-r px-2 py-2 text-sm font-medium last:border-r-0"
                  style={{ width: ROOM_COLUMN_WIDTH }}
                >
                  {room.name ?? room.id}
                </div>
              ))}
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
                  className="shrink-0 relative border-r last:border-r-0 overflow-visible bg-background"
                  style={{ width: ROOM_COLUMN_WIDTH, minHeight: bodyHeight, height: bodyHeight }}
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
                  {sessionsByRoom[roomIndex].map(({ session, top, height }) => {
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
                    return (
                      <div
                        key={session.id}
                        className="absolute left-1 right-1 rounded-md border border-primary/30 bg-primary/15 shadow-sm p-2 overflow-hidden flex flex-col gap-0.5"
                        style={{
                          top,
                          height: Math.max(height, 44),
                          minHeight: 44,
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
                      </div>
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
    </div>
  )
}
