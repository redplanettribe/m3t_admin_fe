import type {
  EventAttendeeFlow,
  EventAttendeeFlowNode,
  EventAttendeeFlowNodeKind,
} from "@/types/event"

export interface FlowLayoutOptions {
  width: number
  height: number
  nodeWidth: number
  nodePadding: number
  margin: { top: number; right: number; bottom: number; left: number }
}

export interface FlowLayoutNode {
  id: string
  name: string
  kind?: EventAttendeeFlowNodeKind
  value: number
  depth: number
  isFirst: boolean
  isLast: boolean
  x0: number
  x1: number
  y0: number
  y1: number
}

export interface FlowLayoutLink {
  index: number
  source: number
  target: number
  value: number
  width: number
  sourceX: number
  targetX: number
  sourceY: number
  targetY: number
  sourceName: string
  targetName: string
}

export interface FlowLayout {
  nodes: FlowLayoutNode[]
  links: FlowLayoutLink[]
}

/** Node with a resolved numeric depth used for ordering and column placement. */
interface ResolvedFlowNode extends EventAttendeeFlowNode {
  resolvedDepth: number
}

const LINK_CURVATURE = 0.5

function startTimeKey(node: { start_time?: string }): string {
  return node.start_time ?? ""
}

/**
 * Orders nodes left-to-right then top-to-bottom: by resolved depth (column),
 * then sort_order, then start_time, then name for a stable result.
 */
export function compareFlowNodes(
  a: ResolvedFlowNode,
  b: ResolvedFlowNode
): number {
  if (a.resolvedDepth !== b.resolvedDepth) return a.resolvedDepth - b.resolvedDepth
  const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER
  const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER
  if (aOrder !== bOrder) return aOrder - bOrder
  const aTime = startTimeKey(a)
  const bTime = startTimeKey(b)
  if (aTime !== bTime) return aTime < bTime ? -1 : 1
  return a.name.localeCompare(b.name)
}

/**
 * Resolves a column index for every node. The API supplies `depth` directly;
 * the fallback (used only when `depth` is missing) keeps check-in on the left
 * and drop-off on the right, ordering sessions by start_time in between.
 */
function resolveDepths(nodes: EventAttendeeFlowNode[]): ResolvedFlowNode[] {
  if (nodes.every((node) => typeof node.depth === "number")) {
    return nodes.map((node) => ({ ...node, resolvedDepth: node.depth as number }))
  }

  const sessions = nodes
    .filter((node) => node.kind === "session" || (!node.kind && node.id))
    .slice()
    .sort((a, b) => {
      const aTime = startTimeKey(a)
      const bTime = startTimeKey(b)
      if (aTime !== bTime) return aTime < bTime ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  const sessionDepthById = new Map<string, number>()
  sessions.forEach((node, index) => sessionDepthById.set(node.id, index + 1))
  const lastDepth = sessions.length + 1

  return nodes.map((node) => {
    let resolvedDepth: number
    if (typeof node.depth === "number") {
      resolvedDepth = node.depth
    } else if (node.kind === "check_in") {
      resolvedDepth = 0
    } else if (node.kind === "drop_off") {
      resolvedDepth = lastDepth
    } else {
      resolvedDepth = sessionDepthById.get(node.id) ?? 0
    }
    return { ...node, resolvedDepth }
  })
}

function distinctSortedDepths(nodes: ResolvedFlowNode[]): number[] {
  const depths = Array.from(new Set(nodes.map((node) => node.resolvedDepth)))
  depths.sort((a, b) => a - b)
  return depths
}

/**
 * Computes a static Sankey layout that places nodes in columns by their backend
 * `depth` (left = earliest), stacks them vertically by `sort_order`, and sizes
 * nodes and links proportionally to attendee counts. Unlike a force-relaxed
 * layout, columns strictly follow the API ordering so sessions read by time.
 */
export function layoutAttendeeFlowSankey(
  data: EventAttendeeFlow | undefined,
  options: FlowLayoutOptions
): FlowLayout {
  const rawNodes = data?.nodes ?? []
  const rawLinks = data?.links ?? []
  if (rawNodes.length === 0) return { nodes: [], links: [] }

  const resolved = resolveDepths(rawNodes).sort(compareFlowNodes)
  const indexById = new Map<string, number>()
  resolved.forEach((node, index) => indexById.set(node.id, index))

  const links = rawLinks
    .map((link, index) => ({
      index,
      source: indexById.get(link.source) ?? -1,
      target: indexById.get(link.target) ?? -1,
      value: link.value,
    }))
    .filter(
      (link) =>
        link.source >= 0 &&
        link.target >= 0 &&
        Number.isFinite(link.value) &&
        link.value > 0
    )

  const incomingSum = new Array(resolved.length).fill(0)
  const outgoingSum = new Array(resolved.length).fill(0)
  for (const link of links) {
    outgoingSum[link.source] += link.value
    incomingSum[link.target] += link.value
  }

  const { width, height, nodeWidth, nodePadding, margin } = options
  const innerWidth = Math.max(width - margin.left - margin.right, nodeWidth)
  const innerHeight = Math.max(height - margin.top - margin.bottom, 1)

  const nodes: FlowLayoutNode[] = resolved.map((node, index) => ({
    id: node.id,
    name: node.name,
    kind: node.kind,
    value: Math.max(incomingSum[index], outgoingSum[index]),
    depth: node.resolvedDepth,
    isFirst: incomingSum[index] === 0,
    isLast: outgoingSum[index] === 0,
    x0: 0,
    x1: 0,
    y0: 0,
    y1: 0,
  }))

  const depths = distinctSortedDepths(resolved)
  const columnSlotByDepth = new Map<number, number>()
  depths.forEach((depth, slot) => columnSlotByDepth.set(depth, slot))
  const columnCount = depths.length
  const columnStep =
    columnCount > 1 ? (innerWidth - nodeWidth) / (columnCount - 1) : 0

  const nodesByColumn: FlowLayoutNode[][] = depths.map(() => [])
  nodes.forEach((node) => {
    const slot = columnSlotByDepth.get(node.depth) ?? 0
    node.x0 = margin.left + slot * columnStep
    node.x1 = node.x0 + nodeWidth
    nodesByColumn[slot].push(node)
  })

  let valueScale = Number.POSITIVE_INFINITY
  for (const column of nodesByColumn) {
    const columnValue = column.reduce((sum, node) => sum + node.value, 0)
    if (columnValue <= 0) continue
    const available = innerHeight - (column.length - 1) * nodePadding
    valueScale = Math.min(valueScale, available / columnValue)
  }
  if (!Number.isFinite(valueScale) || valueScale <= 0) valueScale = 1

  for (const column of nodesByColumn) {
    const usedHeight =
      column.reduce((sum, node) => sum + node.value * valueScale, 0) +
      (column.length - 1) * nodePadding
    let y = margin.top + Math.max((innerHeight - usedHeight) / 2, 0)
    for (const node of column) {
      node.y0 = y
      node.y1 = y + node.value * valueScale
      y = node.y1 + nodePadding
    }
  }

  const layoutLinks: FlowLayoutLink[] = links.map((link) => ({
    index: link.index,
    source: link.source,
    target: link.target,
    value: link.value,
    width: link.value * valueScale,
    sourceX: nodes[link.source].x1,
    targetX: nodes[link.target].x0,
    sourceY: 0,
    targetY: 0,
    sourceName: nodes[link.source].name,
    targetName: nodes[link.target].name,
  }))

  assignLinkBreadths(nodes, layoutLinks)

  return { nodes, links: layoutLinks }
}

/** Stacks each node's links vertically, ordered by the opposite node's position. */
function assignLinkBreadths(
  nodes: FlowLayoutNode[],
  links: FlowLayoutLink[]
): void {
  const outgoing: FlowLayoutLink[][] = nodes.map(() => [])
  const incoming: FlowLayoutLink[][] = nodes.map(() => [])
  for (const link of links) {
    outgoing[link.source].push(link)
    incoming[link.target].push(link)
  }

  nodes.forEach((node, index) => {
    let y = node.y0
    for (const link of outgoing[index].sort(
      (a, b) => nodes[a.target].y0 - nodes[b.target].y0
    )) {
      link.sourceY = y + link.width / 2
      y += link.width
    }
    y = node.y0
    for (const link of incoming[index].sort(
      (a, b) => nodes[a.source].y0 - nodes[b.source].y0
    )) {
      link.targetY = y + link.width / 2
      y += link.width
    }
  })
}

/** Cubic control point X for a horizontal Sankey link at the given curvature. */
export function linkControlX(from: number, to: number): number {
  return from + (to - from) * LINK_CURVATURE
}
