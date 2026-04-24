import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEventSchedule } from "@/hooks/useEvents"
import { useEventLiveStatusStream } from "@/hooks/useEventLiveStatusStream"
import { useEventStore } from "@/store/eventStore"
import type { LiveConnectionState } from "@/types/liveStatus"

function formatConnectionState(state: LiveConnectionState) {
  if (state === "connecting") return "Connecting"
  if (state === "reconnecting") return "Reconnecting"
  if (state === "live") return "Live"
  return "Error"
}

function clampPct(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export function LiveDashboardPage(): React.ReactElement {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const activeEventId = useEventStore((s) => s.activeEventId)
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)

  React.useEffect(() => {
    if (eventId && !activeEventId) {
      setActiveEventId(eventId)
    }
  }, [activeEventId, eventId, setActiveEventId])

  React.useEffect(() => {
    if (activeEventId && eventId && activeEventId !== eventId) {
      navigate(`/events/${activeEventId}/live`, { replace: true })
    }
  }, [activeEventId, eventId, navigate])

  const effectiveEventId = eventId ?? activeEventId ?? null
  const { data: schedule } = useEventSchedule(effectiveEventId)
  const { snapshot, lastUpdateAt, connectionState, error, reconnectNow } =
    useEventLiveStatusStream({ eventId: effectiveEventId })

  const title = schedule?.event?.name ? `Live — ${schedule.event.name}` : "Live"
  const lastUpdateLabel = lastUpdateAt
    ? lastUpdateAt.toLocaleTimeString()
    : "—"

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-sm">
            Connection: {formatConnectionState(connectionState)} · Last update: {lastUpdateLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={reconnectNow}>
            Reconnect
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Stream error{error.code ? ` (${error.code})` : ""}
            </CardTitle>
            <CardDescription className="text-destructive">
              {error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event check-ins</CardTitle>
            <CardDescription>Total checked in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tabular-nums">
              {snapshot?.event_check_in_count ?? "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deliverables</CardTitle>
            <CardDescription>Delivered count per deliverable</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot?.deliverables?.length ? (
              <ul className="space-y-2">
                {snapshot.deliverables.map((d) => (
                  <li key={d.deliverable_id} className="flex items-center justify-between gap-3">
                    <span className="truncate">{d.name || d.deliverable_id}</span>
                    <span className="tabular-nums font-medium">{d.delivered_count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No deliverable stats yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Live sessions</h3>
            <p className="text-sm text-muted-foreground">
              Room capacity utilization and check-ins
            </p>
          </div>
          <div className="text-sm text-muted-foreground tabular-nums">
            {snapshot?.sessions?.length ? `${snapshot.sessions.length} live` : "0 live"}
          </div>
        </div>

        {snapshot?.sessions?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...snapshot.sessions]
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
                <Card key={s.session_id} className={isFull ? "border-destructive/40" : undefined}>
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
              <CardTitle className="text-base">Live sessions</CardTitle>
              <CardDescription>No live session stats yet.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </div>
  )
}

