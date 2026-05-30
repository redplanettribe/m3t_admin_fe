import * as React from "react"
import { Sankey, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { EventAttendeeFlow } from "@/types/event"

const CHART_HEIGHT = 380

const NODE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const

function nodeColor(index: number): string {
  return NODE_COLORS[index % NODE_COLORS.length]
}

const chartConfig = {} satisfies ChartConfig

interface SankeyNodeDatum {
  name: string
}

interface SankeyLinkDatum {
  source: number
  target: number
  value: number
}

interface SankeyChartData {
  nodes: SankeyNodeDatum[]
  links: SankeyLinkDatum[]
}

/** Recharts Sankey requires links keyed by numeric node index, not by id. */
function toSankeyData(data: EventAttendeeFlow | undefined): SankeyChartData {
  const nodes = data?.nodes ?? []
  const links = data?.links ?? []
  const indexById = new Map<string, number>()
  nodes.forEach((node, index) => indexById.set(node.id, index))

  const mappedLinks: SankeyLinkDatum[] = []
  for (const link of links) {
    const source = indexById.get(link.source)
    const target = indexById.get(link.target)
    if (source == null || target == null) continue
    if (!Number.isFinite(link.value) || link.value <= 0) continue
    mappedLinks.push({ source, target, value: link.value })
  }

  return {
    nodes: nodes.map((node) => ({ name: node.name })),
    links: mappedLinks,
  }
}

interface FlowNodeProps {
  x: number
  y: number
  width: number
  height: number
  index: number
  payload: {
    name: string
    value: number
    sourceLinks?: unknown[]
    targetLinks?: unknown[]
  }
}

function FlowNode(props: FlowNodeProps): React.ReactElement {
  const { x, y, width, height, index, payload } = props
  const isTerminal = (payload.sourceLinks?.length ?? 0) === 0
  const labelOnLeft = isTerminal
  const color = nodeColor(index)

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={Math.max(height, 1)}
        rx={3}
        fill={color}
        fillOpacity={0.95}
      />
      <text
        x={labelOnLeft ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={labelOnLeft ? "end" : "start"}
        dominantBaseline="middle"
        className="fill-foreground"
        fontSize={12}
        fontWeight={600}
      >
        {payload.name}
      </text>
      <text
        x={labelOnLeft ? x - 8 : x + width + 8}
        y={y + height / 2 + 15}
        textAnchor={labelOnLeft ? "end" : "start"}
        dominantBaseline="middle"
        className="fill-muted-foreground"
        fontSize={11}
      >
        {payload.value.toLocaleString()}
      </text>
    </g>
  )
}

interface FlowLinkProps {
  sourceX: number
  targetX: number
  sourceY: number
  targetY: number
  sourceControlX: number
  targetControlX: number
  linkWidth: number
  index: number
}

function FlowLink(
  props: FlowLinkProps & {
    activeLink: number | null
    onActivate: (index: number | null) => void
  }
): React.ReactElement {
  const {
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    index,
    activeLink,
    onActivate,
  } = props
  const isActive = activeLink === index

  return (
    <path
      d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={`url(#flowLinkGradient-${index})`}
      strokeWidth={Math.max(linkWidth, 1)}
      strokeOpacity={isActive ? 0.7 : 0.4}
      onMouseEnter={() => onActivate(index)}
      onMouseLeave={() => onActivate(null)}
      style={{ transition: "stroke-opacity 150ms ease" }}
    />
  )
}

interface FlowTooltipPayloadItem {
  payload?: {
    name?: string
    value?: number
    source?: { name?: string }
    target?: { name?: string }
  }
}

function FlowTooltipContent(props: {
  active?: boolean
  payload?: FlowTooltipPayloadItem[]
}): React.ReactElement | null {
  const { active, payload } = props
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null

  const isLink = datum.source != null && datum.target != null
  const label = isLink
    ? `${datum.source?.name ?? "?"} → ${datum.target?.name ?? "?"}`
    : (datum.name ?? "")
  const value = datum.value ?? 0

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {value.toLocaleString()} attendee{value === 1 ? "" : "s"}
      </p>
    </div>
  )
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

export function EventAttendeeFlowChart(props: {
  data: EventAttendeeFlow | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  errorMessage?: string
  onRetry?: () => void
}): React.ReactElement {
  const { data, isLoading, isError, error, errorMessage, onRetry } = props
  const [activeLink, setActiveLink] = React.useState<number | null>(null)

  const sankeyData = React.useMemo(() => toSankeyData(data), [data])
  const hasData = sankeyData.nodes.length > 0 && sankeyData.links.length > 0

  const displayErrorMessage =
    errorMessage ??
    (error instanceof Error ? error.message : "Failed to load attendee flow.")

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Attendee flow</CardTitle>
        <CardDescription>
          How attendees moved through check-in and sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? (
          <Skeleton className="w-full rounded-lg" style={{ height: CHART_HEIGHT }} />
        ) : isError ? (
          <ChartStatePanel message={displayErrorMessage} onRetry={onRetry} />
        ) : !hasData ? (
          <ChartStatePanel message="No attendee flow recorded for this event" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className={cn("aspect-auto w-full")}
            style={{ height: CHART_HEIGHT }}
          >
            <Sankey
              data={sankeyData}
              nodePadding={28}
              nodeWidth={14}
              linkCurvature={0.5}
              iterations={64}
              margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
              node={(nodeProps: FlowNodeProps) => <FlowNode {...nodeProps} />}
              link={(linkProps: FlowLinkProps) => (
                <FlowLink
                  {...linkProps}
                  activeLink={activeLink}
                  onActivate={setActiveLink}
                />
              )}
            >
              <defs>
                {sankeyData.links.map((link, index) => (
                  <linearGradient
                    key={index}
                    id={`flowLinkGradient-${index}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={nodeColor(link.source)} />
                    <stop offset="100%" stopColor={nodeColor(link.target)} />
                  </linearGradient>
                ))}
              </defs>
              <Tooltip content={<FlowTooltipContent />} />
            </Sankey>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
