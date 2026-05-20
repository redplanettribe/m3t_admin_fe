import * as React from "react"
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { AdminEventTimelineChartPoint } from "@/lib/adminEventTimeline"
import { ApiError } from "@/lib/api"
import { formatDateOnly } from "@/lib/formatDate"
import { cn } from "@/lib/utils"

const chartConfig = {
  eventCount: {
    label: "Events",
    color: "var(--muted-foreground)",
  },
  registrations: {
    label: "Registrations",
    color: "var(--chart-1)",
  },
  checkIns: {
    label: "Check-ins",
    color: "var(--chart-2)",
  },
  invitations: {
    label: "Invitations sent",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const CHART_HEIGHT = 390
const TOP_CHART_HEIGHT = 220
const BOTTOM_CHART_HEIGHT = 110
const SYNC_ID = "adminEventTimeline"

function sparseTickIndex(index: number, total: number): boolean {
  if (total <= 7) return true
  const step = Math.ceil(total / 6)
  return index === 0 || index === total - 1 || index % step === 0
}

function tooltipLabelFormatter(
  _: React.ReactNode,
  payload: readonly unknown[]
): React.ReactNode {
  const first = payload[0] as { payload?: AdminEventTimelineChartPoint } | undefined
  const point = first?.payload
  return point?.date ? formatDateOnly(point.date) : null
}

function ChartStatePanel(props: {
  message: string
  onRetry?: () => void
}): React.ReactElement {
  const { message, onRetry } = props
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 text-center text-sm text-muted-foreground"
      style={{ height: CHART_HEIGHT }}
    >
      <p>{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  )
}

export function AdminEventTimelineChart(props: {
  data: AdminEventTimelineChartPoint[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  rangeLabel: string | null
  onRetry?: () => void
}): React.ReactElement {
  const { data, isLoading, isError, error, rangeLabel, onRetry } = props

  const errorMessage =
    error instanceof ApiError && error.status === 403
      ? "Platform administrator access is required to view the timeline."
      : error instanceof Error
        ? error.message
        : "Failed to load timeline."

  const hasData = data.length > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Event activity</CardTitle>
        {rangeLabel ? (
          <CardDescription>{rangeLabel}</CardDescription>
        ) : (
          <CardDescription>Daily events and engagement across the platform</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? (
          <Skeleton className="w-full rounded-lg" style={{ height: CHART_HEIGHT }} />
        ) : isError ? (
          <ChartStatePanel message={errorMessage} onRetry={onRetry} />
        ) : !hasData ? (
          <ChartStatePanel message="No events in this period" />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Engagement
              </p>
            </div>
            <ChartContainer
              config={chartConfig}
              className={cn("aspect-auto w-full")}
              style={{ height: TOP_CHART_HEIGHT }}
            >
              <ComposedChart
                data={data}
                syncId={SYNC_ID}
                syncMethod="index"
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillRegistrations" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-registrations)"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-registrations)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                  <linearGradient id="fillCheckIns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-checkIns)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--color-checkIns)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillInvitations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-invitations)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--color-invitations)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={false}
                  height={0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  width={40}
                />
                <ChartTooltip
                  content={<ChartTooltipContent labelFormatter={tooltipLabelFormatter} />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  stroke="var(--color-registrations)"
                  fill="url(#fillRegistrations)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="checkIns"
                  stroke="var(--color-checkIns)"
                  fill="url(#fillCheckIns)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="invitations"
                  stroke="var(--color-invitations)"
                  fill="url(#fillInvitations)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ChartContainer>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Events/day
              </p>
            </div>
            <ChartContainer
              config={chartConfig}
              className={cn("aspect-auto w-full")}
              style={{ height: BOTTOM_CHART_HEIGHT }}
            >
              <ComposedChart
                data={data}
                syncId={SYNC_ID}
                syncMethod="index"
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                  tickFormatter={(value, index) =>
                    sparseTickIndex(index, data.length) ? String(value) : ""
                  }
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  width={40}
                />
                <ChartTooltip
                  content={<ChartTooltipContent labelFormatter={tooltipLabelFormatter} />}
                />
                <Bar
                  dataKey="eventCount"
                  fill="var(--color-eventCount)"
                  fillOpacity={0.55}
                  radius={[2, 2, 0, 0]}
                  barSize={Math.max(4, Math.min(24, Math.floor(320 / data.length)))}
                />
              </ComposedChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
