import { useCallback, useRef, useState } from "react"
import type { Session, UpdateSessionScheduleRequest } from "@/types/event"
import type { UseMutationResult } from "@tanstack/react-query"

const SNAP_MINUTES = 5
const DEFAULT_DURATION_MINUTES = 30

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export interface DraftPlacementPreview {
  sessionId: string
  roomIndex: number
  topPx: number
  heightPx: number
  timeLabel: string
}

export interface UseDraftPlacementParams {
  gridRef: React.RefObject<HTMLDivElement | null>
  rooms: { id: string }[]
  timeColumnWidth: number
  roomColumnWidth: number
  pixelsPerMinute: number
  rangeStartMinutes: number
  eventDay: number
  updateSession: UseMutationResult<
    unknown,
    Error,
    { sessionId: string } & UpdateSessionScheduleRequest,
    unknown
  >["mutateAsync"]
}

interface DragState {
  session: Session
  lastTarget: {
    roomIndex: number
    snappedMinutes: number
    topPx: number
  } | null
}

export function useDraftPlacement({
  gridRef,
  rooms,
  timeColumnWidth,
  roomColumnWidth,
  pixelsPerMinute,
  rangeStartMinutes,
  eventDay,
  updateSession,
}: UseDraftPlacementParams) {
  const [placementPreview, setPlacementPreview] =
    useState<DraftPlacementPreview | null>(null)
  const dragState = useRef<DragState | null>(null)
  const listenersRef = useRef<{
    move: (e: PointerEvent) => void
    up: () => void
  } | null>(null)

  const snapPx = SNAP_MINUTES * pixelsPerMinute
  const durationPx = DEFAULT_DURATION_MINUTES * pixelsPerMinute

  const computeTarget = useCallback(
    (clientX: number, clientY: number) => {
      const grid = gridRef.current
      if (!grid) return null
      const rect = grid.getBoundingClientRect()
      const scrollContainer = grid.closest("[data-schedule-scroll]")
      const scrollLeft = scrollContainer?.scrollLeft ?? 0

      const xInGrid = clientX - rect.left + scrollLeft - timeColumnWidth
      const yInGrid = clientY - rect.top

      const roomIndex = Math.floor(xInGrid / roomColumnWidth)
      if (roomIndex < 0 || roomIndex >= rooms.length) return null

      const rawMinutes = rangeStartMinutes + yInGrid / pixelsPerMinute
      const snappedMinutes =
        Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES
      const topPx =
        Math.round(
          ((snappedMinutes - rangeStartMinutes) * pixelsPerMinute) / snapPx,
        ) * snapPx

      return { roomIndex, snappedMinutes, topPx }
    },
    [
      gridRef,
      rooms.length,
      timeColumnWidth,
      roomColumnWidth,
      pixelsPerMinute,
      rangeStartMinutes,
      snapPx,
    ],
  )

  const cleanup = useCallback(() => {
    const listeners = listenersRef.current
    if (listeners) {
      window.removeEventListener("pointermove", listeners.move)
      window.removeEventListener("pointerup", listeners.up)
      window.removeEventListener("pointercancel", listeners.up)
      listenersRef.current = null
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    const ds = dragState.current
    dragState.current = null
    setPlacementPreview(null)
    cleanup()

    if (!ds?.lastTarget) return
    const { session, lastTarget } = ds
    if (lastTarget.roomIndex < 0 || lastTarget.roomIndex >= rooms.length)
      return

    const room = rooms[lastTarget.roomIndex]
    const endMinutes = lastTarget.snappedMinutes + DEFAULT_DURATION_MINUTES

    updateSession({
      sessionId: session.id,
      room_id: room.id,
      event_day: eventDay,
      start_time: minutesToHHMM(lastTarget.snappedMinutes),
      end_time: minutesToHHMM(endMinutes),
    }).catch(() => {})
  }, [rooms, eventDay, updateSession, cleanup])

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const ds = dragState.current
      if (!ds) return

      const target = computeTarget(e.clientX, e.clientY)
      ds.lastTarget = target

      if (!target) {
        setPlacementPreview(null)
        return
      }

      const endMinutes = target.snappedMinutes + DEFAULT_DURATION_MINUTES
      const timeLabel = `${minutesToHHMM(target.snappedMinutes)} – ${minutesToHHMM(endMinutes)}`

      setPlacementPreview({
        sessionId: ds.session.id,
        roomIndex: target.roomIndex,
        topPx: target.topPx,
        heightPx: durationPx,
        timeLabel,
      })
    },
    [computeTarget, durationPx],
  )

  const handleDraftPointerDown = useCallback(
    (e: React.PointerEvent, session: Session) => {
      e.preventDefault()
      dragState.current = { session, lastTarget: null }
      setPlacementPreview(null)

      const move = (ev: PointerEvent) => handlePointerMove(ev)
      const up = () => handlePointerUp()
      listenersRef.current = { move, up }
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
      window.addEventListener("pointercancel", up)
    },
    [handlePointerMove, handlePointerUp],
  )

  return {
    handleDraftPointerDown,
    placementPreview,
    isDraggingDraft: placementPreview !== null,
  }
}
