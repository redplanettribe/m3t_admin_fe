import * as React from "react"
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
import { EditEventModal } from "@/components/EditEventModal"
import {
  useEventSchedule,
  useEventTags,
  useAddEventTags,
  useDeleteEventTag,
} from "@/hooks/useEvents"
import { useEventStore } from "@/store/eventStore"
import { cn } from "@/lib/utils"

export function HomePage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const { data: schedule, isLoading, isError } = useEventSchedule(activeEventId)
  const { data: eventTags = [] } = useEventTags(activeEventId)
  const addTags = useAddEventTags(activeEventId)
  const deleteTag = useDeleteEventTag(activeEventId)
  const [editOpen, setEditOpen] = React.useState(false)
  const [newTagName, setNewTagName] = React.useState("")

  if (activeEventId && schedule) {
    const { event, rooms = [], sessions = [] } = schedule
    const hasLocation =
      event.location_lat != null && event.location_lng != null
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{event.name}</h2>
            <p className="text-muted-foreground">
              Event Code: <code className="rounded bg-muted px-1">{event.event_code}</code>
            </p>
            {event.date && (
              <p className="text-muted-foreground text-sm mt-1">
                Date: {event.date.slice(0, 10)}
              </p>
            )}
            {event.description && (
              <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
                {event.description}
              </p>
            )}
            {hasLocation && (
              <p className="text-muted-foreground text-sm mt-1">
                Location: {event.location_lat}, {event.location_lng}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Edit event
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rooms</CardTitle>
              <CardDescription>
                {rooms.length} room{rooms.length !== 1 ? "s" : ""} for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rooms.length > 0 ? (
                <ul className="list-inside list-disc text-sm">
                  {rooms.map((r) => (
                    <li key={r.id}>{r.name ?? r.id}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No rooms yet.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessions</CardTitle>
              <CardDescription>
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <p className="text-sm">{sessions.length} session(s) scheduled.</p>
              ) : (
                <p className="text-sm text-muted-foreground">No sessions yet.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
              <CardDescription>
                Event tags for sessions. Add or remove tags.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventTags.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {eventTags.map((tag) => (
                    <li
                      key={tag.id}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      )}
                    >
                      {tag.name}
                      <button
                        type="button"
                        className="rounded-full hover:bg-muted-foreground/20 p-0.5 -mr-0.5"
                        onClick={() =>
                          deleteTag.mutate({ tagId: tag.id })
                        }
                        disabled={deleteTag.isPending}
                        aria-label={`Remove ${tag.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No tags yet.</p>
              )}
              <div className="flex gap-2 flex-wrap items-center">
                <Input
                  placeholder="New tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const name = newTagName.trim()
                      if (name) {
                        addTags.mutate(
                          { tags: [name] },
                          {
                            onSuccess: () => setNewTagName(""),
                            onError: () => {},
                          }
                        )
                      }
                    }
                  }}
                  className="w-[140px]"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const name = newTagName.trim()
                    if (name) {
                      addTags.mutate(
                        { tags: [name] },
                        {
                          onSuccess: () => setNewTagName(""),
                          onError: () => {},
                        }
                      )
                    }
                  }}
                  disabled={addTags.isPending || !newTagName.trim()}
                >
                  {addTags.isPending ? "Adding…" : "Add"}
                </Button>
                {addTags.isError && (
                  <span className="text-sm text-destructive">
                    {addTags.error?.message}
                  </span>
                )}
                {deleteTag.isError && (
                  <span className="text-sm text-destructive">
                    {deleteTag.error?.message}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <EditEventModal
          open={editOpen}
          onOpenChange={setEditOpen}
          event={event}
        />
      </div>
    )
  }

  if (activeEventId && isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Home</h2>
        <p className="text-muted-foreground">Loading event details…</p>
      </div>
    )
  }

  if (activeEventId && isError) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Home</h2>
        <p className="text-muted-foreground text-destructive">Failed to load event details.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Home</h2>
      <p className="text-muted-foreground">
        Select an event from the dropdown in the sidebar or create a new event to get started.
      </p>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            Select an event from the dropdown in the sidebar or create a new event to get started.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  )
}
