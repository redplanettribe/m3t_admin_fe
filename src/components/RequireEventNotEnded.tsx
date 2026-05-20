import * as React from "react"
import { Navigate, useParams } from "react-router-dom"
import { useEventSchedule } from "@/hooks/useEvents"
import { isEventEnded } from "@/lib/adminEventFilters"

type RequireEventNotEndedProps = {
  children: React.ReactNode
}

export function RequireEventNotEnded(props: RequireEventNotEndedProps): React.ReactElement {
  const { children } = props
  const { eventId } = useParams()
  const { data: schedule, isLoading } = useEventSchedule(eventId ?? null)

  if (isLoading) return <></>

  if (schedule?.event && isEventEnded(schedule.event)) {
    return <Navigate to="/analytics" replace />
  }

  return <>{children}</>
}

