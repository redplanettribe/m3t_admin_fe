import * as React from "react"
import { Check, ChevronDown, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminEventDetail } from "@/hooks/useAdminEventDetail"
import {
  EVENT_DISPLAY_STATUS_LABELS,
  getEventDisplayStatus,
  type EventDisplayStatus,
} from "@/lib/adminEventFilters"
import { ApiError } from "@/lib/api"
import { formatDateOnly, formatDateTime } from "@/lib/formatDate"
import { cn } from "@/lib/utils"
import type {
  AdminEventDeliverable,
  AdminEventDetail,
  AdminEventListItem,
  AdminEventOwner,
} from "@/types/admin"
import type {
  Event,
  EventTeamMember,
  EventTier,
  RoomWithSessions,
  SessionInput,
} from "@/types/event"

function StatusBadge({ status }: { status: EventDisplayStatus }): React.ReactElement {
  const styles: Record<EventDisplayStatus, string> = {
    active: "bg-green-500/10 text-green-700 dark:text-green-400",
    past: "bg-muted text-muted-foreground",
    upcoming: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    unknown: "bg-muted/50 text-muted-foreground",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        styles[status]
      )}
    >
      {EVENT_DISPLAY_STATUS_LABELS[status]}
    </span>
  )
}

function OwnerBlock({ owner }: { owner?: AdminEventOwner | null }): React.ReactElement {
  if (!owner) {
    return <p className="text-sm text-muted-foreground">No owner assigned.</p>
  }
  const name = [owner.name, owner.last_name].filter(Boolean).join(" ").trim()
  return (
    <div className="space-y-1 text-sm">
      {name ? <p className="font-medium">{name}</p> : null}
      {owner.email ? <p className="text-muted-foreground">{owner.email}</p> : null}
      {owner.id ? (
        <p className="text-xs text-muted-foreground font-mono">ID: {owner.id}</p>
      ) : null}
    </div>
  )
}

function CopyIdButton({ value }: { value: string }): React.ReactElement {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0"
      onClick={handleCopy}
      aria-label="Copy event ID"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </Button>
  )
}

function formatEventDateRange(event: Event): string {
  if (!event.start_date) return "—"
  if (event.duration_days != null && event.duration_days > 1) {
    const start = new Date(`${event.start_date}T00:00:00Z`)
    if (Number.isNaN(start.getTime())) return formatDateOnly(event.start_date)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + (event.duration_days - 1))
    const endStr = end.toISOString().slice(0, 10)
    return `${formatDateOnly(event.start_date)} – ${formatDateOnly(endStr)} (${event.duration_days} days)`
  }
  return formatDateOnly(event.start_date)
}

function sessionTitle(session: SessionInput): string {
  return session.title?.trim() || "Untitled session"
}

function sessionScheduleLabel(session: SessionInput): string {
  const parts: string[] = []
  if (session.event_day != null) parts.push(`Day ${session.event_day}`)
  if (session.start_time && session.end_time) {
    parts.push(`${session.start_time}–${session.end_time}`)
  } else if (session.start_time) {
    parts.push(session.start_time)
  }
  return parts.length > 0 ? parts.join(" · ") : "Unscheduled"
}

function SessionListItem({ session }: { session: SessionInput }): React.ReactElement {
  const status = "status" in session ? session.status : undefined
  return (
    <li className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{sessionTitle(session)}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sessionScheduleLabel(session)}</p>
      {status ? (
        <p className="text-xs text-muted-foreground mt-0.5">Status: {status}</p>
      ) : null}
    </li>
  )
}

function DetailField({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}): React.ReactElement {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm mt-0.5">{value}</dd>
    </div>
  )
}

function OverviewTab({ detail }: { detail: AdminEventDetail }): React.ReactElement {
  const { event, owner, stats } = detail
  const hasLocation = event.location_lat != null && event.location_lng != null

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailField label="Dates" value={formatEventDateRange(event)} />
        <DetailField label="Time zone" value={event.time_zone ?? "—"} />
        <DetailField label="Created" value={formatDateTime(event.created_at)} />
        <DetailField label="Updated" value={formatDateTime(event.updated_at)} />
        {hasLocation ? (
          <DetailField
            label="Location"
            value={`${event.location_lat}, ${event.location_lng}`}
          />
        ) : null}
      </dl>

      {event.description ? (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Description</h4>
          <p className="text-sm whitespace-pre-wrap">{event.description}</p>
        </div>
      ) : null}

      <div>
        <h4 className="text-sm font-medium mb-2">Owner</h4>
        <OwnerBlock owner={owner} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="py-4 gap-2">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <p className="text-2xl font-semibold tabular-nums">
              {stats?.registration_count ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4 gap-2">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <p className="text-2xl font-semibold tabular-nums">
              {stats?.checked_in_count ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ScheduleTab({ detail }: { detail: AdminEventDetail }): React.ReactElement {
  const rooms = detail.rooms ?? []
  const unscheduled_sessions = detail.unscheduled_sessions ?? []

  if (rooms.length === 0 && unscheduled_sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No rooms or sessions.</p>
  }

  return (
    <div className="space-y-4">
      {rooms.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Rooms ({rooms.length})</h4>
          {rooms.map((rw) => (
            <RoomCollapsible key={rw.room.id} roomWithSessions={rw} />
          ))}
        </div>
      ) : null}

      {unscheduled_sessions.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium mb-2">
            Unscheduled / draft ({unscheduled_sessions.length})
          </h4>
          <ul className="space-y-2">
            {unscheduled_sessions.map((session) => (
              <SessionListItem key={session.id} session={session} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function RoomCollapsible({ roomWithSessions }: { roomWithSessions: RoomWithSessions }): React.ReactElement {
  const { room } = roomWithSessions
  const sessions = roomWithSessions.sessions ?? []
  const capacityLabel =
    room.capacity != null ? ` · Capacity ${room.capacity}` : ""

  return (
    <Collapsible
      defaultOpen={sessions.length > 0 && sessions.length <= 8}
      className="overflow-hidden rounded-md border border-border"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 border-b border-transparent bg-muted px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted/80 data-[state=open]:border-border [&[data-state=open]>svg]:rotate-180">
        <span className="min-w-0 truncate">
          {room.name ?? room.id}
          <span className="font-normal text-muted-foreground">
            {" "}
            ({sessions.length} session{sessions.length !== 1 ? "s" : ""}
            {capacityLabel})
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="bg-background px-2 py-2">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1 py-1">No sessions in this room.</p>
        ) : (
          <ul className="space-y-1.5">
            {sessions.map((session) => (
              <SessionListItem key={session.id} session={session} />
            ))}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function TeamTiersTab({ detail }: { detail: AdminEventDetail }): React.ReactElement {
  const team_members = detail.team_members ?? []
  const tiers = detail.tiers ?? []

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-2">Team members ({team_members.length})</h4>
        {team_members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members.</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-9 px-3 text-left font-medium">Name</th>
                  <th className="h-9 px-3 text-left font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {team_members.map((member: EventTeamMember) => {
                  const name = [member.name, member.last_name].filter(Boolean).join(" ").trim()
                  return (
                    <tr key={member.user_id} className="border-b last:border-0">
                      <td className="px-3 py-2">{name || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{member.email ?? "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Tiers ({tiers.length})</h4>
        {tiers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tiers.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {tiers.map((tier: EventTier) => (
              <li
                key={tier.id}
                className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-sm"
              >
                {tier.color ? (
                  <span
                    className="size-3 rounded-full shrink-0 border"
                    style={{ backgroundColor: tier.color }}
                    aria-hidden
                  />
                ) : null}
                {tier.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function DeliverablesTab({ detail }: { detail: AdminEventDetail }): React.ReactElement {
  const deliverables = detail.deliverables ?? []

  if (deliverables.length === 0) {
    return <p className="text-sm text-muted-foreground">No deliverables.</p>
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full text-sm min-w-[32rem]">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="h-9 px-3 text-left font-medium">Name</th>
            <th className="h-9 px-3 text-left font-medium">Delivered</th>
            <th className="h-9 px-3 text-left font-medium">Repeatable</th>
            <th className="h-9 px-3 text-left font-medium hidden sm:table-cell">Updated</th>
          </tr>
        </thead>
        <tbody>
          {deliverables.map((d: AdminEventDeliverable) => (
            <tr key={d.id} className="border-b last:border-0 align-top">
              <td className="px-3 py-2">
                <p className="font-medium">{d.name ?? "—"}</p>
                {d.description ? (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {d.description}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-2 tabular-nums">{d.delivered_count ?? 0}</td>
              <td className="px-3 py-2">{d.repeatable ? "Yes" : "No"}</td>
              <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                {formatDateTime(d.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DetailSkeleton(): React.ReactElement {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

export interface AdminEventDetailSheetProps {
  eventId: string | null
  preview?: AdminEventListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminEventDetailSheet({
  eventId,
  preview,
  open,
  onOpenChange,
}: AdminEventDetailSheetProps): React.ReactElement {
  const { data, isLoading, isError, error, refetch } = useAdminEventDetail(
    open ? eventId : null
  )

  const event = data?.event ?? preview?.event
  const owner = data?.owner ?? preview?.owner
  const displayStatus = event ? getEventDisplayStatus(event) : "unknown"

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Failed to load event details."

  const isNotFound = error instanceof ApiError && error.status === 404

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col p-0 gap-0"
      >
        <SheetHeader className="shrink-0 border-b px-4 pr-12 py-4 text-left">
          <div className="flex gap-3 items-start">
            {event?.thumbnail_url ? (
              <img
                src={event.thumbnail_url}
                alt=""
                className="size-14 rounded-md border bg-muted object-cover shrink-0"
              />
            ) : null}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-lg truncate">
                  {event?.name ?? "Event details"}
                </SheetTitle>
                {event ? <StatusBadge status={displayStatus} /> : null}
              </div>
              {event?.event_code ? (
                <SheetDescription asChild>
                  <p>
                    Code:{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {event.event_code}
                    </code>
                  </p>
                </SheetDescription>
              ) : null}
              {event?.id ? (
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {event.id}
                  </p>
                  <CopyIdButton value={event.id} />
                </div>
              ) : null}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading && !data ? (
            <DetailSkeleton />
          ) : isError ? (
            <div className="p-4">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">
                  {isNotFound ? "Event not found." : errorMessage}
                </p>
                {!isNotFound ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                ) : null}
              </div>
            </div>
          ) : data ? (
            <Tabs defaultValue="overview" className="flex flex-col">
              <TabsList variant="line" className="w-full justify-start rounded-none border-b px-4 h-10 bg-transparent">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="team">Team & tiers</TabsTrigger>
                <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
              </TabsList>
              <div className="p-4">
                <TabsContent value="overview" className="mt-0">
                  <OverviewTab detail={data} />
                </TabsContent>
                <TabsContent value="schedule" className="mt-0">
                  <ScheduleTab detail={data} />
                </TabsContent>
                <TabsContent value="team" className="mt-0">
                  <TeamTiersTab detail={data} />
                </TabsContent>
                <TabsContent value="deliverables" className="mt-0">
                  <DeliverablesTab detail={data} />
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="p-4">
              {owner ? (
                <div>
                  <h4 className="text-sm font-medium mb-2">Owner</h4>
                  <OwnerBlock owner={owner} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
