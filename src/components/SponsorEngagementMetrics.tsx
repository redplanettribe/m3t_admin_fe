import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useEventSponsorAnalytics } from "@/hooks/useSponsors"
import { makeNavigateFrom } from "@/lib/returnNavigation"
import { cn } from "@/lib/utils"
import type { SponsorAnalyticsRow } from "@/types/event"

interface SponsorEngagementMetricsProps {
  eventId: string
  enabled: boolean
}

function formatCount(value?: number): string {
  if (value == null || Number.isNaN(value)) return "0"
  return String(value)
}

function formatRate(engaged?: number, registered?: number): string {
  if (registered == null || registered <= 0) return "—"
  const engagedCount = engaged ?? 0
  return `${((engagedCount / registered) * 100).toFixed(1)}%`
}

function formatCtr(clicks?: number, views?: number): string {
  if (views == null || views <= 0) return "—"
  const clickCount = clicks ?? 0
  return `${((clickCount / views) * 100).toFixed(1)}%`
}

function MetricCell(props: { unique?: number; total?: number }): React.ReactElement {
  const { unique, total } = props
  return (
    <div className="tabular-nums">
      <div className="font-medium">{formatCount(unique)}</div>
      <div className="text-xs text-muted-foreground">{formatCount(total)} total</div>
    </div>
  )
}

function StatCard(props: {
  title: string
  description?: string
  value: React.ReactNode
}): React.ReactElement {
  const { title, description, value } = props
  return (
    <Card className="gap-2 py-4">
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

function SponsorAnalyticsRowItem(props: {
  row: SponsorAnalyticsRow
  eventId: string
  navigateState: ReturnType<typeof makeNavigateFrom>
}): React.ReactElement {
  const { row, eventId, navigateState } = props
  const offerings = row.offerings ?? []
  const hasOfferings = offerings.length > 0
  const [open, setOpen] = React.useState(false)
  const sponsorId = row.sponsor_id ?? ""
  const sponsorName = row.name?.trim() || "—"

  return (
    <>
      <tr className="border-b">
        <td className="px-4 py-3 align-top font-medium">
          {sponsorId ? (
            <Link
              to={`/events/${eventId}/sponsors/${sponsorId}`}
              state={navigateState}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {sponsorName}
            </Link>
          ) : (
            sponsorName
          )}
        </td>
        <td className="px-4 py-3 align-top">
          <MetricCell
            unique={row.profile_views_unique}
            total={row.profile_views_total}
          />
        </td>
        <td className="px-4 py-3 align-top">
          <MetricCell
            unique={row.offering_clicks_unique}
            total={row.offering_clicks_total}
          />
        </td>
        <td className="px-4 py-3 align-top">
          {hasOfferings ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-muted-foreground"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            >
              {open ? (
                <ChevronDown className="size-4 shrink-0" />
              ) : (
                <ChevronRight className="size-4 shrink-0" />
              )}
              {offerings.length} offering{offerings.length === 1 ? "" : "s"}
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </td>
      </tr>
      {hasOfferings && open ? (
        <tr className="border-b bg-muted/30">
          <td colSpan={4} className="p-0">
            <div className="border-t px-4 py-3">
              <table className="w-full text-sm">
                <colgroup>
                  <col className="w-[40%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Offering</th>
                    <th className="pb-2 text-left font-medium">Unique views</th>
                    <th className="pb-2 text-left font-medium">Unique clicks</th>
                    <th className="pb-2 text-left font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {offerings.map((offering) => (
                    <tr key={offering.offering_id ?? offering.title}>
                      <td className="py-1.5 pr-4 font-medium">
                        {offering.title?.trim() || "—"}
                      </td>
                      <td className="py-1.5 tabular-nums">
                        {formatCount(offering.views_unique)}
                      </td>
                      <td className="py-1.5 tabular-nums">
                        {formatCount(offering.clicks_unique)}
                      </td>
                      <td className="py-1.5 tabular-nums text-muted-foreground">
                        {formatCtr(offering.clicks_unique, offering.views_unique)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

export function SponsorEngagementMetrics({
  eventId,
  enabled,
}: SponsorEngagementMetricsProps): React.ReactElement {
  const location = useLocation()
  const navigateState = makeNavigateFrom(location)
  const [search, setSearch] = React.useState("")
  const analytics = useEventSponsorAnalytics(eventId, { enabled })

  const totals = analytics.data?.totals
  const registered = totals?.registered_attendees ?? 0
  const engaged = totals?.engaged_attendees_unique ?? 0

  const filteredSponsors = React.useMemo(() => {
    const rows = analytics.data?.sponsors ?? []
    const query = search.trim().toLowerCase()
    const sorted = [...rows].sort(
      (a, b) => (b.profile_views_unique ?? 0) - (a.profile_views_unique ?? 0)
    )
    if (!query) return sorted
    return sorted.filter((row) => (row.name ?? "").toLowerCase().includes(query))
  }, [analytics.data?.sponsors, search])

  if (analytics.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full max-w-xs" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (analytics.isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">Failed to load engagement metrics.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => analytics.refetch()}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Registered attendees" value={formatCount(registered)} />
        <StatCard
          title="Engaged attendees"
          description="Unique attendees with any sponsor engagement"
          value={formatCount(engaged)}
        />
        <StatCard title="Engagement rate" value={formatRate(engaged, registered)} />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-medium tracking-tight">Sponsor engagement</h3>
            <p className="text-sm text-muted-foreground">
              Profile views and offering clicks, sorted by profile views.
            </p>
          </div>
          <Input
            type="search"
            placeholder="Search sponsors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
            aria-label="Search sponsors"
          />
        </div>

        {filteredSponsors.length === 0 ? (
          <div
            className={cn(
              "rounded-md border px-4 py-8 text-center text-sm text-muted-foreground"
            )}
          >
            {(analytics.data?.sponsors ?? []).length === 0
              ? "No sponsors yet — engagement will appear once attendees interact."
              : "No sponsors match your search."}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed text-sm">
              <colgroup>
                <col className="w-[38%]" />
                <col className="w-[22%]" />
                <col className="w-[22%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-auto px-4 py-3 text-left align-top font-medium">
                    Sponsor
                  </th>
                  <th className="h-auto px-4 py-3 text-left align-top font-medium">
                    <div>Profile views</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      Unique · total
                    </div>
                  </th>
                  <th className="h-auto px-4 py-3 text-left align-top font-medium">
                    <div>Offering clicks</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      Unique · total
                    </div>
                  </th>
                  <th className="h-auto px-4 py-3 text-left align-top font-medium">
                    Offerings
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSponsors.map((row) => (
                  <SponsorAnalyticsRowItem
                    key={row.sponsor_id ?? row.name}
                    row={row}
                    eventId={eventId}
                    navigateState={navigateState}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
