import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  buildAttendeeFlowRoomContext,
  flowNodeColor,
  roomColor,
  roomIdsInFlow,
  type AttendeeFlowRoomContext,
} from "@/lib/attendeeFlowRoomColors"
import {
  layoutAttendeeFlowSankey,
  linkControlX,
  type FlowLayoutLink,
  type FlowLayoutNode,
} from "@/lib/attendeeFlowSankey"
import type { EventAttendeeFlow, EventSchedule } from "@/types/event"

const MIN_CHART_HEIGHT = 360
const MAX_CHART_HEIGHT = 720
const ROW_HEIGHT = 46
const LABEL_MAX_CHARS = 22
const NODE_WIDTH = 14
const NODE_PADDING = 28
const CHART_MARGIN = { top: 16, right: 16, bottom: 16, left: 16 }

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

/** Tracks the container width so the static Sankey layout can fill it. */
function useMeasuredWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = React.useState(0)

  React.useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setWidth(element.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}

interface ActiveTooltip {
  label: string
  value: number
  x: number
  y: number
}

function FlowNode(props: {
  node: FlowLayoutNode
  roomContext: AttendeeFlowRoomContext | undefined
  onActivate: (links: number[] | null) => void
  onTooltip: (tooltip: ActiveTooltip | null) => void
  connectedLinks: number[]
}): React.ReactElement {
  const { node, roomContext, onActivate, onTooltip, connectedLinks } = props
  const isFirst = node.kind === "check_in" || node.isFirst
  const isLast = node.kind === "drop_off" || node.isLast
  const isMiddle = !isFirst && !isLast
  const color = flowNodeColor(node, roomContext)
  const height = Math.max(node.y1 - node.y0, 1)
  const centerY = node.y0 + height / 2
  const label = truncateLabel(node.name)

  let labelX: number
  let anchor: "start" | "middle" | "end"
  let nameY: number
  if (isLast) {
    labelX = node.x0 - 8
    anchor = "end"
    nameY = centerY
  } else if (isFirst) {
    labelX = node.x1 + 8
    anchor = "start"
    nameY = centerY
  } else {
    labelX = node.x0 + (node.x1 - node.x0) / 2
    anchor = "middle"
    nameY = node.y0 - 6
  }

  return (
    <g
      onMouseEnter={(event) => {
        onActivate(connectedLinks)
        onTooltip({
          label: node.name,
          value: node.value,
          x: event.nativeEvent.offsetX,
          y: event.nativeEvent.offsetY,
        })
      }}
      onMouseMove={(event) =>
        onTooltip({
          label: node.name,
          value: node.value,
          x: event.nativeEvent.offsetX,
          y: event.nativeEvent.offsetY,
        })
      }
      onMouseLeave={() => {
        onActivate(null)
        onTooltip(null)
      }}
    >
      <rect
        x={node.x0}
        y={node.y0}
        width={node.x1 - node.x0}
        height={height}
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
          {node.value.toLocaleString()}
        </text>
      ) : null}
    </g>
  )
}

function FlowRoomLegend(props: {
  roomIds: string[]
  roomContext: AttendeeFlowRoomContext
}): React.ReactElement {
  const { roomIds, roomContext } = props
  if (roomIds.length === 0) return <></>
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {roomIds.map((roomId) => (
        <span key={roomId} className="inline-flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: roomColor(roomId) }}
            aria-hidden
          />
          {roomContext.roomNameById.get(roomId) ?? roomId}
        </span>
      ))}
    </div>
  )
}

function FlowLink(props: {
  link: FlowLayoutLink
  highlightedLinks: number[] | null
  onActivate: (links: number[] | null) => void
  onTooltip: (tooltip: ActiveTooltip | null) => void
}): React.ReactElement {
  const { link, highlightedLinks, onActivate, onTooltip } = props
  const isActive = highlightedLinks?.includes(link.index) ?? false
  const isDimmed = highlightedLinks != null && !isActive
  const strokeOpacity = isActive ? 0.7 : isDimmed ? 0.15 : 0.4
  const sourceControlX = linkControlX(link.sourceX, link.targetX)
  const targetControlX = linkControlX(link.targetX, link.sourceX)

  const showTooltip = (event: React.MouseEvent) =>
    onTooltip({
      label: `${link.sourceName} → ${link.targetName}`,
      value: link.value,
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
    })

  return (
    <path
      d={`M${link.sourceX},${link.sourceY}C${sourceControlX},${link.sourceY} ${targetControlX},${link.targetY} ${link.targetX},${link.targetY}`}
      fill="none"
      stroke={`url(#flowLinkGradient-${link.index})`}
      strokeWidth={Math.max(link.width, 1)}
      strokeOpacity={strokeOpacity}
      onMouseEnter={(event) => {
        onActivate([link.index])
        showTooltip(event)
      }}
      onMouseMove={showTooltip}
      onMouseLeave={() => {
        onActivate(null)
        onTooltip(null)
      }}
      style={{ transition: "stroke-opacity 150ms ease" }}
    />
  )
}

function FlowTooltip(props: { tooltip: ActiveTooltip }): React.ReactElement {
  const { tooltip } = props
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border bg-background px-3 py-2 text-xs shadow-xl"
      style={{ left: tooltip.x, top: tooltip.y - 8 }}
    >
      <p className="font-medium text-foreground">{tooltip.label}</p>
      <p className="text-muted-foreground">
        {tooltip.value.toLocaleString()} attendee{tooltip.value === 1 ? "" : "s"}
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
  schedule?: EventSchedule
  isLoading: boolean
  isError: boolean
  error: Error | null
  errorMessage?: string
  onRetry?: () => void
}): React.ReactElement {
  const { data, schedule, isLoading, isError, error, errorMessage, onRetry } = props
  const roomContext = React.useMemo(
    () => buildAttendeeFlowRoomContext(schedule),
    [schedule]
  )
  const [highlightedLinks, setHighlightedLinks] = React.useState<number[] | null>(null)
  const [tooltip, setTooltip] = React.useState<ActiveTooltip | null>(null)
  const [containerRef, width] = useMeasuredWidth()

  const nodeCount = data?.nodes?.length ?? 0
  const chartHeight = chartHeightForNodes(nodeCount)
  const hasData = nodeCount > 0 && (data?.links?.length ?? 0) > 0

  const layout = React.useMemo(() => {
    if (!hasData || width <= 0) return null
    return layoutAttendeeFlowSankey(data, {
      width,
      height: chartHeight,
      nodeWidth: NODE_WIDTH,
      nodePadding: NODE_PADDING,
      margin: CHART_MARGIN,
    })
  }, [data, hasData, width, chartHeight])

  const connectedLinksByNode = React.useMemo(() => {
    const map = new Map<number, number[]>()
    if (!layout) return map
    layout.nodes.forEach((_, index) => map.set(index, []))
    for (const link of layout.links) {
      map.get(link.source)?.push(link.index)
      map.get(link.target)?.push(link.index)
    }
    return map
  }, [layout])

  const legendRoomIds = React.useMemo(
    () => (layout ? roomIdsInFlow(layout.nodes, roomContext) : []),
    [layout, roomContext]
  )

  const nodeColorByIndex = React.useMemo(() => {
    if (!layout) return []
    return layout.nodes.map((node) => flowNodeColor(node, roomContext))
  }, [layout, roomContext])

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
          <div
            ref={containerRef}
            className="relative w-full"
            style={{ height: chartHeight }}
          >
            {layout ? (
              <svg
                width={width}
                height={chartHeight}
                className="overflow-visible"
                onMouseLeave={() => {
                  setHighlightedLinks(null)
                  setTooltip(null)
                }}
              >
                <defs>
                  {layout.links.map((link) => (
                    <linearGradient
                      key={link.index}
                      id={`flowLinkGradient-${link.index}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor={nodeColorByIndex[link.source]} />
                      <stop offset="100%" stopColor={nodeColorByIndex[link.target]} />
                    </linearGradient>
                  ))}
                </defs>
                <g>
                  {layout.links.map((link) => (
                    <FlowLink
                      key={link.index}
                      link={link}
                      highlightedLinks={highlightedLinks}
                      onActivate={setHighlightedLinks}
                      onTooltip={setTooltip}
                    />
                  ))}
                </g>
                <g>
                  {layout.nodes.map((node, index) => (
                    <FlowNode
                      key={node.id}
                      node={node}
                      roomContext={roomContext}
                      connectedLinks={connectedLinksByNode.get(index) ?? []}
                      onActivate={setHighlightedLinks}
                      onTooltip={setTooltip}
                    />
                  ))}
                </g>
              </svg>
            ) : null}
            {legendRoomIds.length > 0 ? (
              <FlowRoomLegend roomIds={legendRoomIds} roomContext={roomContext} />
            ) : null}
            {tooltip ? <FlowTooltip tooltip={tooltip} /> : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
