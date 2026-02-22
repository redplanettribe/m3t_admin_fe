import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useEventSchedule } from "@/hooks/useEvents"
import { useEventStore } from "@/store/eventStore"

export function HomePage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const { data: schedule, isLoading, isError } = useEventSchedule(activeEventId)

  if (activeEventId && schedule) {
    const { event, rooms = [], sessions = [] } = schedule
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">{event.name}</h2>
        <p className="text-muted-foreground">
          Event details for the selected event. Slug: <code className="rounded bg-muted px-1">{event.slug}</code>
        </p>
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
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
        </div>
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
        Welcome to the M3T event admin. Use the layout and navigation to manage events and settings.
      </p>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            Select an event from the sidebar dropdown to view its details here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Example button</Button>
        </CardContent>
      </Card>
    </div>
  )
}
