import * as React from "react"
import { Navigate } from "react-router-dom"
import { useEventStore } from "@/store/eventStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LiveRedirectPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)

  if (activeEventId) {
    return <Navigate to={`/events/${activeEventId}/live`} replace />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Live</h2>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Select event</CardTitle>
          <CardDescription>
            Pick an event from the dropdown in the header to view its live dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  )
}

