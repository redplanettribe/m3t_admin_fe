import * as React from "react"
import { Link, useParams } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEventSchedule } from "@/hooks/useEvents"
import { useEventStore } from "@/store/eventStore"
import type { EventSchedule, Session, SessionInput } from "@/types/event"
import { cn } from "@/lib/utils"

/** Extract sessions array from API response. */
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
  const tagsRaw = s.tags ?? (raw.tags as string[] | undefined)
  const tags =
    Array.isArray(tagsRaw) && tagsRaw.every((t) => typeof t === "string")
      ? tagsRaw
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

export function SessionDetailPage(): React.ReactElement {
  const { eventId = null, sessionId = null } = useParams<{
    eventId: string
    sessionId: string
  }>()

  const { data: schedule, isLoading, isError } = useEventSchedule(eventId)
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)

  React.useEffect(() => {
    if (eventId) setActiveEventId(eventId)
  }, [eventId, setActiveEventId])

  const scheduleRecord = schedule != null ? (schedule as unknown as Record<string, unknown>) : null
  const event = scheduleRecord?.event as EventSchedule["event"] | undefined
  const rooms: EventSchedule["rooms"] = (scheduleRecord?.rooms ?? []) as EventSchedule["rooms"]
  const rawSessions = extractSessions(scheduleRecord ?? {})
  const sessions = rawSessions
    .map((s) => normalizeSession(s as SessionInput))
    .filter((s): s is Session => s !== null)
  const session = sessions.find((s) => s.id === sessionId) ?? null
  const room = session ? rooms?.find((r) => r.id === session.room_id) : null

  if (!eventId || !sessionId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Session</h2>
        <p className="text-muted-foreground">Invalid link.</p>
        <Button asChild variant="outline">
          <Link to="/schedule">Back to schedule</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Session</h2>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (isError || !schedule) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Session</h2>
        <p className="text-muted-foreground text-destructive">Failed to load session.</p>
        <Button asChild variant="outline">
          <Link to="/schedule">Back to schedule</Link>
        </Button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Session</h2>
        <p className="text-muted-foreground">Session not found.</p>
        <Button asChild variant="outline">
          <Link to="/schedule">Back to schedule</Link>
        </Button>
      </div>
    )
  }

  const startTime = new Date(session.starts_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const endTime = new Date(session.ends_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
  const durationMin = Math.round(
    (new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60000
  )
  const speakerLabel =
    session.speaker ?? (session.speakers?.length ? session.speakers.join(", ") : null)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {session.title ?? `Session ${session.id}`}
          </h2>
          <p className="text-sm text-muted-foreground">
            {event?.name} · {room?.name ?? session.room_id}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/schedule">Back to schedule</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session details</CardTitle>
          <CardDescription>Time, room, speakers, and description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Time</dt>
              <dd className="mt-0.5">
                {startTime} – {endTime}
                {durationMin > 0 && ` (${durationMin} min)`}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Room</dt>
              <dd className="mt-0.5">{room?.name ?? session.room_id}</dd>
            </div>
            {speakerLabel && (
              <div>
                <dt className="font-medium text-muted-foreground">Speaker(s)</dt>
                <dd className="mt-0.5">{speakerLabel}</dd>
              </div>
            )}
            {session.description && (
              <div>
                <dt className="font-medium text-muted-foreground">Description</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{session.description}</dd>
              </div>
            )}
            {session.tags && session.tags.length > 0 && (
              <div>
                <dt className="font-medium text-muted-foreground">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {session.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {event && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event</CardTitle>
            <CardDescription>{event.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 text-sm">
              {event.date && (
                <div>
                  <dt className="font-medium text-muted-foreground">Date</dt>
                  <dd className="mt-0.5">
                    {new Date(event.date).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </dd>
                </div>
              )}
              {event.description && (
                <div>
                  <dt className="font-medium text-muted-foreground">Description</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap">{event.description}</dd>
                </div>
              )}
              {(event.location_lat != null || event.location_lng != null) && (
                <div>
                  <dt className="font-medium text-muted-foreground">Location</dt>
                  <dd className="mt-0.5">
                    {event.location_lat}, {event.location_lng}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
