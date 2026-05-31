import { describe, expect, it } from "vitest"
import type { EventAttendeeFlow } from "@/types/event"
import { compareFlowNodes, layoutAttendeeFlowSankey } from "@/lib/attendeeFlowSankey"

const OPTIONS = {
  width: 800,
  height: 400,
  nodeWidth: 14,
  nodePadding: 28,
  margin: { top: 16, right: 16, bottom: 16, left: 16 },
}

function nodeById(layout: ReturnType<typeof layoutAttendeeFlowSankey>, id: string) {
  const node = layout.nodes.find((candidate) => candidate.id === id)
  if (!node) throw new Error(`node ${id} not found`)
  return node
}

describe("compareFlowNodes", () => {
  it("orders by depth first", () => {
    const earlier = { id: "a", name: "A", resolvedDepth: 1, sort_order: 5 }
    const later = { id: "b", name: "B", resolvedDepth: 2, sort_order: 0 }
    expect(compareFlowNodes(earlier, later)).toBeLessThan(0)
    expect(compareFlowNodes(later, earlier)).toBeGreaterThan(0)
  })

  it("orders by sort_order within the same depth", () => {
    const top = { id: "a", name: "A", resolvedDepth: 1, sort_order: 0 }
    const bottom = { id: "b", name: "B", resolvedDepth: 1, sort_order: 1 }
    expect(compareFlowNodes(top, bottom)).toBeLessThan(0)
  })
})

describe("layoutAttendeeFlowSankey", () => {
  it("returns an empty layout when there is no data", () => {
    expect(layoutAttendeeFlowSankey(undefined, OPTIONS)).toEqual({ nodes: [], links: [] })
  })

  it("places nodes in increasing x by depth (left to right over time)", () => {
    const data: EventAttendeeFlow = {
      nodes: [
        { id: "checkin", name: "Check-in", kind: "check_in", depth: 0, sort_order: 0 },
        { id: "s1", name: "Session 1", kind: "session", depth: 1, sort_order: 0 },
        { id: "s2", name: "Session 2", kind: "session", depth: 2, sort_order: 0 },
      ],
      links: [
        { source: "checkin", target: "s1", value: 10 },
        { source: "s1", target: "s2", value: 8 },
      ],
    }

    const layout = layoutAttendeeFlowSankey(data, OPTIONS)
    const checkin = nodeById(layout, "checkin")
    const s1 = nodeById(layout, "s1")
    const s2 = nodeById(layout, "s2")

    expect(checkin.x0).toBeLessThan(s1.x0)
    expect(s1.x0).toBeLessThan(s2.x0)
  })

  it("stacks nodes sharing a depth by sort_order", () => {
    const data: EventAttendeeFlow = {
      nodes: [
        { id: "checkin", name: "Check-in", kind: "check_in", depth: 0, sort_order: 0 },
        { id: "early", name: "Early", kind: "session", depth: 1, sort_order: 0 },
        { id: "late", name: "Late", kind: "session", depth: 1, sort_order: 1 },
      ],
      links: [
        { source: "checkin", target: "early", value: 5 },
        { source: "checkin", target: "late", value: 5 },
      ],
    }

    const layout = layoutAttendeeFlowSankey(data, OPTIONS)
    const early = nodeById(layout, "early")
    const late = nodeById(layout, "late")

    expect(early.x0).toBeCloseTo(late.x0)
    expect(early.y0).toBeLessThan(late.y0)
  })

  it("ignores links with non-positive or unknown endpoints", () => {
    const data: EventAttendeeFlow = {
      nodes: [
        { id: "checkin", name: "Check-in", kind: "check_in", depth: 0 },
        { id: "s1", name: "Session 1", kind: "session", depth: 1 },
      ],
      links: [
        { source: "checkin", target: "s1", value: 10 },
        { source: "checkin", target: "s1", value: 0 },
        { source: "checkin", target: "missing", value: 4 },
      ],
    }

    const layout = layoutAttendeeFlowSankey(data, OPTIONS)
    expect(layout.links).toHaveLength(1)
    expect(layout.links[0].value).toBe(10)
  })
})
