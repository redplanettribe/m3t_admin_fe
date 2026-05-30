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

const MIN_CHART_HEIGHT = 360
const MAX_CHART_HEIGHT = 720
const ROW_HEIGHT = 46
const LABEL_MAX_CHARS = 22

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

function chartHeightForNodes(nodeCount: number): number {
  return Math.min(MAX_CHART_HEIGHT, Math.max(MIN_CHART_HEIGHT, nodeCount * ROW_HEIGHT))
}

function truncateLabel(label: string, max = LABEL_MAX_CHARS): string {
  if (label.length <= max) return label
  return `${label.slice(0, max - 1).trimEnd()}…`
}

/** Keeps SVG label text legible when it overlaps colored links. */
const LABEL_HALO_STYLE: React.CSSProperties = {
  paintOrder: "stroke",
  stroke: "var(--background)",
  strokeWidth: 3,
  strokeLinejoin: "round",
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
    sourceLinks?: number[]
    targetLinks?: number[]
  }
}

function FlowNode(
  props: FlowNodeProps & {
    onActivate: (links: number[] | null) => void
  }
): React.ReactElement {
  const { x, y, width, height, index, payload, onActivate } = props
  const incoming = payload.targetLinks?.length ?? 0
  const outgoing = payload.sourceLinks?.length ?? 0
  const isFirst = incoming === 0
  const isLast = outgoing === 0
  const isMiddle = !isFirst && !isLast
  const color = nodeColor(index)
  const centerY = y + height / 2
  const label = truncateLabel(payload.name)

  let labelX: number
  let anchor: "start" | "middle" | "end"
  let nameY: number
  if (isLast) {
    labelX = x - 8
    anchor = "end"
    nameY = centerY
  } else if (isFirst) {
    labelX = x + width + 8
    anchor = "start"
    nameY = centerY
  } else {
    labelX = x + width / 2
    anchor = "middle"
    nameY = y - 6
  }

  const connectedLinks = [...(payload.sourceLinks ?? []), ...(payload.targetLinks ?? [])]

  return (
    <g
      onMouseEnter={() => onActivate(connectedLinks)}
      onMouseLeave={() => onActivate(null)}
    >
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
        x={labelX}
        y={nameY}
        textAnchor={anchor}
        dominantBaseline={isMiddle ? "auto" : "middle"}
        className="fill-foreground"
        fontSize={12}
        fontWeight={600}
        style={LABEL_HALO_STYLE}
      >
        {label}
      </text>
      {!isMiddle ? (
        <text
          x={labelX}
          y={centerY + 15}
          textAnchor={anchor}
          dominantBaseline="middle"
          className="fill-muted-foreground"
          fontSize={11}
          style={LABEL_HALO_STYLE}
        >
          {payload.value.toLocaleString()}
        </text>
      ) : null}
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
    highlightedLinks: number[] | null
    onActivate: (links: number[] | null) => void
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
    highlightedLinks,
    onActivate,
  } = props
  const isActive = highlightedLinks?.includes(index) ?? false
  const isDimmed = highlightedLinks != null && !isActive
  const strokeOpacity = isActive ? 0.7 : isDimmed ? 0.15 : 0.4

  return (
    <path
      d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={`url(#flowLinkGradient-${index})`}
      strokeWidth={Math.max(linkWidth, 1)}
      strokeOpacity={strokeOpacity}
      onMouseEnter={() => onActivate([index])}
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
  height: number
  onRetry?: () => void
}): React.ReactElement {
  const { message, height, onRetry } = props
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 text-center text-sm text-muted-foreground"
      style={{ height }}
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
  const [highlightedLinks, setHighlightedLinks] = React.useState<number[] | null>(null)

  const sankeyData = React.useMemo(() => toSankeyData(data), [data])
  const hasData = sankeyData.nodes.length > 0 && sankeyData.links.length > 0
  const chartHeight = chartHeightForNodes(sankeyData.nodes.length)

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
          <Skeleton className="w-full rounded-lg" style={{ height: chartHeight }} />
        ) : isError ? (
          <ChartStatePanel
            message={displayErrorMessage}
            height={chartHeight}
            onRetry={onRetry}
          />
        ) : !hasData ? (
          <ChartStatePanel
            message="No attendee flow recorded for this event"
            height={chartHeight}
          />
        ) : (
          <ChartContainer
            config={chartConfig}
            className={cn("aspect-auto w-full")}
            style={{ height: chartHeight }}
          >
            <Sankey
              data={sankeyData}
              nodePadding={28}
              nodeWidth={14}
              linkCurvature={0.5}
              iterations={64}
              margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
              node={(nodeProps: FlowNodeProps) => (
                <FlowNode {...nodeProps} onActivate={setHighlightedLinks} />
              )}
              link={(linkProps: FlowLinkProps) => (
                <FlowLink
                  {...linkProps}
                  highlightedLinks={highlightedLinks}
                  onActivate={setHighlightedLinks}
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
