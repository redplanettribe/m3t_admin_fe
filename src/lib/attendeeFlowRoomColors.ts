import type { FlowLayoutNode } from "@/lib/attendeeFlowSankey"
import type { EventSchedule } from "@/types/event"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const

const CHECK_IN_COLOR = "var(--chart-1)"
const DROP_OFF_COLOR = "var(--chart-5)"
const UNKNOWN_SESSION_COLOR = "var(--muted-foreground)"

export interface AttendeeFlowRoomContext {
  sessionRoomIdBySessionId: Map<string, string>
  roomNameById: Map<string, string>
}

/** Maps session IDs to room IDs and room IDs to display names from the event schedule. */
export function buildAttendeeFlowRoomContext(
  schedule: EventSchedule | undefined
): AttendeeFlowRoomContext {
  const sessionRoomIdBySessionId = new Map<string, string>()
  const roomNameById = new Map<string, string>()

  for (const { room, sessions } of schedule?.rooms ?? []) {
    if (room.id) {
      roomNameById.set(room.id, room.name?.trim() || "Room")
    }
    for (const session of sessions) {
      const sessionId = session.id
      if (!sessionId) continue
      const roomId =
        ("room_id" in session && session.room_id) || room.id
      if (roomId) sessionRoomIdBySessionId.set(sessionId, roomId)
    }
  }

  for (const session of schedule?.unscheduled_sessions ?? []) {
    const sessionId = session.id
    const roomId = "room_id" in session ? session.room_id : undefined
    if (sessionId && roomId) sessionRoomIdBySessionId.set(sessionId, roomId)
  }

  return { sessionRoomIdBySessionId, roomNameById }
}

function hashRoomId(roomId: string): number {
  let hash = 0
  for (let i = 0; i < roomId.length; i++) {
    hash = (hash * 31 + roomId.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function roomColor(roomId: string): string {
  return CHART_COLORS[hashRoomId(roomId) % CHART_COLORS.length]
}

export function flowNodeColor(
  node: Pick<FlowLayoutNode, "kind" | "session_id">,
  context: AttendeeFlowRoomContext | undefined
): string {
  if (node.kind === "check_in") return CHECK_IN_COLOR
  if (node.kind === "drop_off") return DROP_OFF_COLOR
  const roomId =
    node.session_id && context?.sessionRoomIdBySessionId.get(node.session_id)
  if (roomId) return roomColor(roomId)
  return UNKNOWN_SESSION_COLOR
}

export function roomIdsInFlow(
  nodes: FlowLayoutNode[],
  context: AttendeeFlowRoomContext | undefined
): string[] {
  if (!context) return []
  const ids = new Set<string>()
  for (const node of nodes) {
    if (node.kind !== "session" || !node.session_id) continue
    const roomId = context.sessionRoomIdBySessionId.get(node.session_id)
    if (roomId) ids.add(roomId)
  }
  return [...ids].sort((a, b) => {
    const nameA = context.roomNameById.get(a) ?? a
    const nameB = context.roomNameById.get(b) ?? b
    return nameA.localeCompare(nameB)
  })
}
