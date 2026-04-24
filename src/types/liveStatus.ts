export type EventStatusStreamTicket = {
  ticket: string
  expires_at: string
}

export type EventStatusLiveSnapshot = {
  event_check_in_count: number
  sessions: Array<{
    session_id: string
    title: string
    check_in_count: number
    room?: {
      name: string
      capacity: number
    }
  }>
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
