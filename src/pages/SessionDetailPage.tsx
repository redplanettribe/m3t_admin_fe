import * as React from "react"
import { Link, useParams } from "react-router-dom"
import { X } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useEventSchedule,
  useEventTags,
  useAddSessionTag,
  useRemoveSessionTag,
  useUpdateSessionContent,
} from "@/hooks/useEvents"
import { useEventStore } from "@/store/eventStore"
import type { EventSchedule, EventTag, Session, SessionInput } from "@/types/event"
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

export function SessionDetailPage(): React.ReactElement {
  const { eventId = null, sessionId = null } = useParams<{
    eventId: string
    sessionId: string
  }>()

  const { data: schedule, isLoading, isError } = useEventSchedule(eventId)
  const { data: eventTags = [] } = useEventTags(eventId)
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)
  const updateContent = useUpdateSessionContent(eventId, sessionId)
  const addTag = useAddSessionTag(eventId, sessionId)
  const removeTag = useRemoveSessionTag(eventId, sessionId)

  const [isEditingContent, setIsEditingContent] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState("")
  const [editDescription, setEditDescription] = React.useState("")

  React.useEffect(() => {
    if (eventId) setActiveEventId(eventId)
  }, [eventId, setActiveEventId])

  const startEditingContent = React.useCallback((s: Session) => {
    setEditTitle(s.title ?? "")
    setEditDescription(s.description ?? "")
    setIsEditingContent(true)
  }, [])

  const cancelEditingContent = React.useCallback(() => {
    setIsEditingContent(false)
  }, [])

  const saveContent = React.useCallback(() => {
    updateContent.mutate(
      { title: editTitle || undefined, description: editDescription || undefined },
      {
        onSuccess: () => {
          setIsEditingContent(false)
        },
      }
    )
  }, [editTitle, editDescription, updateContent])

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
          <CardDescription>Time, room, and speakers.</CardDescription>
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
            {session.tags && session.tags.length > 0 && (
              <div>
                <dt className="font-medium text-muted-foreground">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {session.tags.map((tag) => (
                    <span
                      key={tag.id || tag.name}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      )}
                    >
                      {tag.name}
                      {tag.id && (
                        <button
                          type="button"
                          className="rounded-full hover:bg-muted-foreground/20 p-0.5 -mr-0.5"
                          onClick={() =>
                            removeTag.mutate(
                              { tagId: tag.id },
                              { onError: () => {} }
                            )
                          }
                          disabled={removeTag.isPending}
                          aria-label={`Remove ${tag.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {eventTags.length > 0 && (
              <div>
                <dt className="font-medium text-muted-foreground">
                  {session.tags && session.tags.length > 0 ? "Add tag" : "Tags"}
                </dt>
                <dd className="mt-1">
                  {(() => {
                    const availableToAdd = eventTags.filter(
                      (et) =>
                        !session.tags?.some(
                          (st) => st.id === et.id || st.name === et.name
                        )
                    )
                    if (availableToAdd.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground">
                          All event tags are on this session
                        </p>
                      )
                    }
                    return (
                      <>
                        <Select
                          value=""
                          onValueChange={(tagId) => {
                            if (tagId) addTag.mutate({ tagId })
                          }}
                          disabled={addTag.isPending}
                        >
                          <SelectTrigger className="w-[180px]" size="sm">
                            <SelectValue placeholder="Add a tag…" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableToAdd.map((tag) => (
                              <SelectItem key={tag.id} value={tag.id}>
                                {tag.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {addTag.isError && (
                          <p className="mt-1 text-xs text-destructive">
                            {addTag.error?.message}
                          </p>
                        )}
                      </>
                    )
                  })()}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
          <div>
            <CardTitle className="text-base">Session content</CardTitle>
            <CardDescription>Title and description. Only the event owner can edit.</CardDescription>
          </div>
          {!isEditingContent ? (
            <Button variant="outline" size="sm" onClick={() => startEditingContent(session)}>
              Edit content
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingContent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-title">Title</Label>
                <Input
                  id="session-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Session title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-description">Description</Label>
                <textarea
                  id="session-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Session description"
                  rows={4}
                  className={cn(
                    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveContent}
                  disabled={updateContent.isPending}
                >
                  {updateContent.isPending ? "Saving…" : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEditingContent}
                  disabled={updateContent.isPending}
                >
                  Cancel
                </Button>
                {updateContent.isError && (
                  <span className="text-sm text-destructive self-center">
                    {updateContent.error?.message}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Title</dt>
                <dd className="mt-0.5">{session.title ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Description</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">
                  {session.description ?? "—"}
                </dd>
              </div>
            </dl>
          )}
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
