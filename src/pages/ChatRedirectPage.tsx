import * as React from "react"
import { Navigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEventSchedule } from "@/hooks/useEvents"
import { isEventEnded } from "@/lib/adminEventFilters"
import { useEventStore } from "@/store/eventStore"

export function ChatRedirectPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const { data: schedule } = useEventSchedule(activeEventId)

  if (activeEventId && schedule?.event && isEventEnded(schedule.event)) {
    return <Navigate to="/analytics" replace />
  }

  if (activeEventId) {
    return <Navigate to={`/events/${activeEventId}/chat`} replace />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Chat</h2>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Select event</CardTitle>
          <CardDescription>
            Pick an event from the dropdown in the header to monitor its general chat.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  )
}
