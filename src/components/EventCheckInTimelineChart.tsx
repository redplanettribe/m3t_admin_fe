import * as React from "react"
import { Area, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatCheckInTimelineTooltipLabel,
  type EventCheckInTimelineChartPoint,
} from "@/lib/eventCheckInTimeline"
import { cn } from "@/lib/utils"

const chartConfig = {
  checkIns: {
    label: "Check-ins",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const CHART_HEIGHT = 320

function sparseTickIndex(index: number, total: number): boolean {
  if (total <= 7) return true
  const step = Math.ceil(total / 6)
  return index === 0 || index === total - 1 || index % step === 0
}

function tooltipLabelFormatter(
  _: React.ReactNode,
  payload: readonly unknown[]
): React.ReactNode {
  const first = payload[0] as { payload?: EventCheckInTimelineChartPoint } | undefined
  const point = first?.payload
  return point?.bucketStart ? formatCheckInTimelineTooltipLabel(point.bucketStart) : null
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

export function EventCheckInTimelineChart(props: {
  data: EventCheckInTimelineChartPoint[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  errorMessage?: string
  rangeLabel: string | null
  totalCheckIns?: number
  onRetry?: () => void
}): React.ReactElement {
  const {
    data,
    isLoading,
    isError,
    error,
    errorMessage,
    rangeLabel,
    totalCheckIns,
    onRetry,
  } = props

  const displayErrorMessage =
    errorMessage ??
    (error instanceof Error ? error.message : "Failed to load check-in timeline.")

  const hasData = data.length > 0

  const description =
    rangeLabel ??
    (totalCheckIns != null
      ? `${totalCheckIns} total check-in${totalCheckIns === 1 ? "" : "s"} during event day(s)`
      : "Check-in volume during event day(s)")

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Check-ins over time</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? (
          <Skeleton className="w-full rounded-lg" style={{ height: CHART_HEIGHT }} />
        ) : isError ? (
          <ChartStatePanel message={displayErrorMessage} onRetry={onRetry} />
        ) : !hasData ? (
          <ChartStatePanel message="No check-ins recorded during the event" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className={cn("aspect-auto w-full")}
            style={{ height: CHART_HEIGHT }}
          >
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillEventCheckIns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-checkIns)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--color-checkIns)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
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
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="checkIns"
                stroke="var(--color-checkIns)"
                fill="url(#fillEventCheckIns)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
