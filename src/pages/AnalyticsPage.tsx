import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEventSchedule } from "@/hooks/useEvents"
import { useEventStore } from "@/store/eventStore"

export function AnalyticsPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const { data: schedule } = useEventSchedule(activeEventId)

  if (!activeEventId) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Select event</CardTitle>
            <CardDescription>
              Pick an event from the dropdown in the header to view analytics.
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    )
  }

  const title = schedule?.event?.name ? `Analytics — ${schedule.event.name}` : "Analytics"

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>In progress</CardTitle>
          <CardDescription>
            Live dashboard hidden for ended events. Analytics page coming next.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  )
}

