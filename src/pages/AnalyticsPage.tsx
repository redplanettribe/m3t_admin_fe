import * as React from "react"
import { EventAttendeeFlowChart } from "@/components/EventAttendeeFlowChart"
import { EventCheckInTimelineChart } from "@/components/EventCheckInTimelineChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEventAnalytics } from "@/hooks/useEventAnalytics"
import { useEventAttendeeFlow } from "@/hooks/useEventAttendeeFlow"
import { useEventCheckInTimeline } from "@/hooks/useEventCheckInTimeline"
import { useEventSchedule } from "@/hooks/useEvents"
import {
  formatCheckInTimelineRangeLabel,
  mapCheckInTimelineBuckets,
} from "@/lib/eventCheckInTimeline"
import { isEventEnded } from "@/lib/adminEventFilters"
import { ApiError } from "@/lib/api"
import { useEventStore } from "@/store/eventStore"

function clampPct(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function formatRate(rate?: number): string {
  if (rate == null || Number.isNaN(rate) || !Number.isFinite(rate)) return "—"
  return `${(rate * 100).toFixed(1)}%`
}

function analyticsErrorMessage(error: Error): string {
  if (!(error instanceof ApiError)) {
    return error.message || "Failed to load analytics."
  }
  if (error.code === "event_not_past") {
    return "Analytics are available only after the event has ended."
  }
  if (error.code === "not_event_owner") {
    return "You do not have permission to view analytics for this event."
  }
  if (error.code === "event_not_found") {
    return "Event not found."
  }
  return error.message || "Failed to load analytics."
}

function StatCard(props: {
  title: string
  description?: string
  value: React.ReactNode
}): React.ReactElement {
  const { title, description, value } = props
  return (
    <Card className="py-4 gap-2">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-xs">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function AnalyticsSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    </div>
  )
}

export function AnalyticsPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const { data: schedule, isLoading: scheduleLoading } = useEventSchedule(activeEventId)
  const event = schedule?.event
  const ended = event ? isEventEnded(event) : false
  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError,
    error,
  } = useEventAnalytics(activeEventId, ended)
  const {
    data: checkInTimeline,
    isLoading: checkInTimelineLoading,
    isError: checkInTimelineError,
    error: checkInTimelineErrorObj,
    refetch: refetchCheckInTimeline,
  } = useEventCheckInTimeline(activeEventId, ended)
  const {
    data: attendeeFlow,
    isLoading: attendeeFlowLoading,
    isError: attendeeFlowError,
    error: attendeeFlowErrorObj,
    refetch: refetchAttendeeFlow,
  } = useEventAttendeeFlow(activeEventId, ended)

  if (!activeEventId) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
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

  const title = event?.name ? `Analytics — ${event.name}` : "Analytics"

  if (scheduleLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <AnalyticsSkeleton />
      </div>
    )
  }

  if (event && !ended) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Not available yet</CardTitle>
            <CardDescription>
              Analytics are available after the event ends. Use Live during the event for
              real-time stats.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (analyticsLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <AnalyticsSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <Card className="max-w-2xl border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Could not load analytics
            </CardTitle>
            <CardDescription className="text-destructive">
              {analyticsErrorMessage(error ?? new Error("Unknown error"))}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const attendees = analytics?.attendees
  const invitations = analytics?.invitations
  const deliverables = analytics?.deliverables ?? []
  const sessions = analytics?.sessions ?? []
  const checkInTimelinePoints = mapCheckInTimelineBuckets(
    checkInTimeline?.buckets ?? [],
    "hour"
  )
  const checkInTimelineRangeLabel = formatCheckInTimelineRangeLabel(checkInTimeline)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Attendees</h3>
          <p className="text-sm text-muted-foreground">
            Registration and check-in funnel
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            title="Registrations"
            value={attendees?.registration_count ?? 0}
          />
          <StatCard title="Check-ins" value={attendees?.check_in_count ?? 0} />
          <StatCard
            title="Check-in rate"
            description="Check-ins ÷ registrations"
            value={formatRate(attendees?.check_in_rate)}
          />
          <StatCard
            title="Walk-ins not on sent invitations"
            description={`${formatRate(attendees?.check_ins_not_on_sent_invitations_rate)} of check-ins`}
            value={attendees?.check_ins_not_on_sent_invitations_count ?? 0}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Check-ins over time</h3>
          <p className="text-sm text-muted-foreground">
            Hourly check-in volume during event day(s)
          </p>
        </div>
        <EventCheckInTimelineChart
          data={checkInTimelinePoints}
          isLoading={checkInTimelineLoading}
          isError={checkInTimelineError}
          error={checkInTimelineErrorObj}
          errorMessage={
            checkInTimelineError
              ? analyticsErrorMessage(checkInTimelineErrorObj ?? new Error("Unknown error"))
              : undefined
          }
          rangeLabel={checkInTimelineRangeLabel}
          totalCheckIns={checkInTimeline?.total_check_in_count}
          onRetry={() => void refetchCheckInTimeline()}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Attendee flow</h3>
          <p className="text-sm text-muted-foreground">
            How attendees moved through check-in and sessions
          </p>
        </div>
        <EventAttendeeFlowChart
          data={attendeeFlow}
          schedule={schedule}
          isLoading={attendeeFlowLoading}
          isError={attendeeFlowError}
          error={attendeeFlowErrorObj}
          errorMessage={
            attendeeFlowError
              ? analyticsErrorMessage(attendeeFlowErrorObj ?? new Error("Unknown error"))
              : undefined
          }
          onRetry={() => void refetchAttendeeFlow()}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Invitations</h3>
          <p className="text-sm text-muted-foreground">Outbox status counts</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Sent" value={invitations?.sent ?? 0} />
          <StatCard title="Pending" value={invitations?.pending ?? 0} />
          <StatCard title="Failed" value={invitations?.failed ?? 0} />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Deliverables</h3>
          <p className="text-sm text-muted-foreground">Delivered count per deliverable</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            {deliverables.length ? (
              <ul className="space-y-2">
                {deliverables.map((d) => (
                  <li
                    key={d.deliverable_id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{d.name || d.deliverable_id}</span>
                    <span className="tabular-nums font-medium">{d.delivered_count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No deliverable stats.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Sessions</h3>
            <p className="text-sm text-muted-foreground">
              Check-ins by session (excluding drafts and canceled)
            </p>
          </div>
          <div className="text-sm text-muted-foreground tabular-nums">
            {sessions.length ? `${sessions.length} sessions` : "0 sessions"}
          </div>
        </div>

        {sessions.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...sessions]
              .map((s) => {
                const capacity = s.room?.capacity ?? 0
                const count = s.check_in_count ?? 0
                const pct = capacity > 0 ? clampPct((count / capacity) * 100) : 0
                const isFull = capacity > 0 && count >= capacity
                return { s, capacity, count, pct, isFull }
              })
              .sort((a, b) => {
                if (a.isFull !== b.isFull) return a.isFull ? -1 : 1
                if (a.pct !== b.pct) return b.pct - a.pct
                return (a.s.title || "").localeCompare(b.s.title || "")
              })
              .map(({ s, capacity, count, pct, isFull }) => (
                <Card
                  key={s.session_id}
                  className={isFull ? "border-destructive/40" : undefined}
                >
                  <CardHeader className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base leading-snug">
                        <span className="line-clamp-2">{s.title || s.session_id}</span>
                      </CardTitle>
                      {isFull ? (
                        <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          FULL
                        </span>
                      ) : null}
                    </div>
                    <CardDescription className="truncate">
                      Room: {s.room?.name || "—"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">Check-ins</div>
                      <div className="text-sm font-medium tabular-nums">
                        {capacity > 0 ? `${count}/${capacity}` : `${count}/—`}
                      </div>
                    </div>

                    {capacity > 0 ? (
                      <div className="space-y-1">
                        <div
                          className="h-2 w-full rounded-full bg-muted overflow-hidden"
                          aria-hidden
                        >
                          <div
                            className={`h-full rounded-full ${isFull ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {Math.round(pct)}%
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No capacity set for room.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessions</CardTitle>
              <CardDescription>No session check-in stats.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </div>
  )
}
