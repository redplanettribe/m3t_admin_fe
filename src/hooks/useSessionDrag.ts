import { useCallback, useRef, useState } from "react"
import type { Session } from "@/types/event"
import type { UseMutationResult } from "@tanstack/react-query"
import type { UpdateSessionScheduleRequest } from "@/types/event"

const SNAP_MINUTES = 5
const MIN_DURATION_MINUTES = 5

export type SessionInteractionMode = "drag" | "resize-top" | "resize-bottom"

export interface UseSessionDragParams {
  rooms: { id: string }[]
  roomColumnWidth: number
  pixelsPerMinute: number
  rangeStartMinutes: number
  scheduleDayStartMs: number
  updateSession: UseMutationResult<
    { id: string; room_id: string; start_time: string; end_time: string; title?: string; description?: string; tags?: string[] },
    Error,
    { sessionId: string } & UpdateSessionScheduleRequest,
    unknown
  >["mutateAsync"]
}

export interface SessionPreviewState {
  sessionId: string
  translateX: number
  translateY: number
  /** Only set during resize; applied as height += heightDelta */
  heightDelta?: number
}

function snapToGrid(pixels: number, pixelsPerMinute: number): number {
  const snapPx = SNAP_MINUTES * pixelsPerMinute
  return Math.round(pixels / snapPx) * snapPx
}

function minutesToIso(dayStartMs: number, minutes: number): string {
  return new Date(dayStartMs + minutes * 60 * 1000).toISOString()
}

export function useSessionDrag({
  rooms,
  roomColumnWidth,
  pixelsPerMinute,
  rangeStartMinutes,
  scheduleDayStartMs,
  updateSession,
}: UseSessionDragParams) {
  const [preview, setPreview] = useState<SessionPreviewState | null>(null)
  const state = useRef<{
    mode: SessionInteractionMode
    session: Session
    originRoomIndex: number
    startPointerX: number
    startPointerY: number
    originStartMinutes: number
    originEndMinutes: number
    originHeightPx: number
    lastDeltaX: number
    lastDeltaY: number
  } | null>(null)
  const listenersRef = useRef<{ move: (e: PointerEvent) => void; up: () => void } | null>(null)

  const commitUpdate = useCallback(
    async (
      sessionId: string,
      payload: UpdateSessionScheduleRequest
    ) => {
      if (!Object.keys(payload).length) return
      try {
        await updateSession({ sessionId, ...payload })
      } catch {
        // Error handling: caller can invalidate refetch or toast
      }
    },
    [updateSession]
  )

  const handlePointerUp = useCallback(() => {
    const s = state.current
    if (!s) return
    const { session, mode, originRoomIndex, originStartMinutes, originEndMinutes, lastDeltaX, lastDeltaY } = s
    state.current = null
    setPreview(null)

    const unregister = () => {
      const listeners = listenersRef.current
      if (listeners) {
        window.removeEventListener("pointermove", listeners.move)
        window.removeEventListener("pointerup", listeners.up)
        window.removeEventListener("pointercancel", listeners.up)
        listenersRef.current = null
      }
    }
    unregister()

    const roomCount = rooms.length
    if (roomCount === 0) return

    const snappedDeltaY = snapToGrid(lastDeltaY, pixelsPerMinute)
    const deltaMinutes = snappedDeltaY / pixelsPerMinute

    if (mode === "drag") {
      const roomDelta = Math.round(lastDeltaX / roomColumnWidth)
      const targetRoomIndex = Math.max(0, Math.min(originRoomIndex + roomDelta, roomCount - 1))
      const targetRoom = rooms[targetRoomIndex]
      const newStartMinutes = originStartMinutes + deltaMinutes
      const newEndMinutes = originEndMinutes + deltaMinutes
      const payload: UpdateSessionScheduleRequest = {}
      if (targetRoom.id !== session.room_id) payload.room_id = targetRoom.id
      if (deltaMinutes !== 0) {
        payload.start_time = minutesToIso(scheduleDayStartMs, newStartMinutes)
        payload.end_time = minutesToIso(scheduleDayStartMs, newEndMinutes)
      }
      commitUpdate(session.id, payload)
    } else if (mode === "resize-top") {
      const newStartMinutes = originStartMinutes + deltaMinutes
      const clampedStart = Math.max(0, Math.min(newStartMinutes, originEndMinutes - MIN_DURATION_MINUTES))
      const payload: UpdateSessionScheduleRequest = {
        start_time: minutesToIso(scheduleDayStartMs, clampedStart),
      }
      commitUpdate(session.id, payload)
    } else if (mode === "resize-bottom") {
      const newEndMinutes = originEndMinutes + deltaMinutes
      const clampedEnd = Math.max(originStartMinutes + MIN_DURATION_MINUTES, Math.min(newEndMinutes, 24 * 60))
      const payload: UpdateSessionScheduleRequest = {
        end_time: minutesToIso(scheduleDayStartMs, clampedEnd),
      }
      commitUpdate(session.id, payload)
    }
  }, [rooms, roomColumnWidth, pixelsPerMinute, scheduleDayStartMs, commitUpdate])

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const s = state.current
      if (!s) return
      const deltaX = e.clientX - s.startPointerX
      const deltaY = e.clientY - s.startPointerY
      s.lastDeltaX = deltaX
      s.lastDeltaY = deltaY
      const snappedDeltaY = snapToGrid(deltaY, pixelsPerMinute)
      const roomCount = rooms.length
      const roomDelta = roomCount > 0 ? Math.round(deltaX / roomColumnWidth) : 0
      const targetRoomIndex = Math.max(0, Math.min(s.originRoomIndex + roomDelta, roomCount - 1))
      const translateX = (targetRoomIndex - s.originRoomIndex) * roomColumnWidth

      if (s.mode === "drag") {
        setPreview({
          sessionId: s.session.id,
          translateX,
          translateY: snappedDeltaY,
        })
      } else if (s.mode === "resize-top") {
        const maxDelta = s.originHeightPx - MIN_DURATION_MINUTES * pixelsPerMinute
        const minDelta = -(s.originStartMinutes - rangeStartMinutes) * pixelsPerMinute
        const clamped = Math.max(minDelta, Math.min(snappedDeltaY, maxDelta))
        setPreview({
          sessionId: s.session.id,
          translateX: 0,
          translateY: clamped,
          heightDelta: -clamped,
        })
      } else if (s.mode === "resize-bottom") {
        const maxDelta = (24 * 60 - s.originEndMinutes) * pixelsPerMinute
        const minDelta = MIN_DURATION_MINUTES * pixelsPerMinute - s.originHeightPx
        const clamped = Math.max(minDelta, Math.min(snappedDeltaY, maxDelta))
        setPreview({
          sessionId: s.session.id,
          translateX: 0,
          translateY: 0,
          heightDelta: clamped,
        })
      }
    },
    [rooms.length, roomColumnWidth, pixelsPerMinute, rangeStartMinutes]
  )

  const onPointerUp = useCallback(() => {
    handlePointerUp()
  }, [handlePointerUp])

  const handlePointerDown = useCallback(
    (
      e: React.PointerEvent,
      session: Session,
      mode: SessionInteractionMode,
      roomIndex: number
    ) => {
      if (rooms.length === 0) return
      e.preventDefault()
      const startMs = new Date(session.starts_at).getTime()
      const endMs = new Date(session.ends_at).getTime()
      const originStartMinutes = (startMs - scheduleDayStartMs) / (60 * 1000)
      const originEndMinutes = (endMs - scheduleDayStartMs) / (60 * 1000)
      const originHeightPx = (originEndMinutes - originStartMinutes) * pixelsPerMinute

      state.current = {
        mode,
        session,
        originRoomIndex: roomIndex,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        originStartMinutes,
        originEndMinutes,
        originHeightPx,
        lastDeltaX: 0,
        lastDeltaY: 0,
      }
      setPreview(null)

      const move = (ev: PointerEvent) => onPointerMove(ev)
      const up = () => onPointerUp()
      listenersRef.current = { move, up }
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
      window.addEventListener("pointercancel", up)
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    },
    [rooms.length, scheduleDayStartMs, pixelsPerMinute, onPointerMove, onPointerUp]
  )

  return { preview, handlePointerDown, activeSessionId: preview?.sessionId ?? null }
}
