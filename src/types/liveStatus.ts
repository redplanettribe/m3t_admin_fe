export type EventStatusStreamTicket = {
  ticket: string
  expires_at: string
}

export type EventStatusLiveSessionCheckIn = {
  session_id: string
  title: string
  check_in_count: number
  booking_count?: number
  overflow_count?: number
  /** check_in_count / room.capacity; may exceed 1.0. Omitted when capacity is 0. */
  capacity_utilization?: number
  /** overflow_count / check_in_count. Omitted when check_in_count is 0. */
  overflow_rate?: number
  room?: {
    name: string
    capacity: number
  }
}

export type EventStatusLiveSnapshot = {
  event_check_in_count: number
  sessions: EventStatusLiveSessionCheckIn[]
  deliverables: Array<{
    deliverable_id: string
    name: string
    delivered_count: number
  }>
}

export type LiveConnectionState = "connecting" | "live" | "reconnecting" | "error"

export type LiveStreamError = {
  message: string
  code?: string
  status?: number
}
