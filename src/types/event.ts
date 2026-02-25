export interface Event {
  id: string
  name: string
  event_code?: string
  owner_id?: string
  created_at?: string
  updated_at?: string
  date?: string
  description?: string
  location_lat?: number
  location_lng?: number
}

export interface UpdateEventRequest {
  date?: string
  description?: string
  location_lat?: number
  location_lng?: number
}

export interface Room {
  id: string
  name?: string
  not_bookable?: boolean
  capacity?: number
  description?: string
  how_to_get_there?: string
  event_id?: string
  created_at?: string
  updated_at?: string
  sessionize_room_id?: number
}

export interface UpdateRoomRequest {
  capacity?: number
  description?: string
  how_to_get_there?: string
  not_bookable?: boolean
}

/** Session with start/end for schedule placement. API may use starts_at/ends_at/room_id or camelCase. */
export interface Session {
  id: string
  room_id: string
  starts_at: string
  ends_at: string
  title?: string
  description?: string
  speaker?: string
  speakers?: string[]
  tags?: string[]
}

/** Raw session from API (may be camelCase or different field names). */
export type SessionInput = Session | {
  id: string
  room_id?: string
  roomId?: string
  room?: { id: string }
  starts_at?: string
  startsAt?: string
  start_time?: string
  startTime?: string
  start?: string
  ends_at?: string
  endsAt?: string
  end_time?: string
  endTime?: string
  end?: string
  title?: string
  description?: string
  speaker?: string
  speakers?: string[]
  tags?: string[]
}

export interface EventSchedule {
  event: Event
  rooms?: Room[]
  sessions?: Session[]
}

export interface EventTeamMember {
  event_id: string
  user_id: string
  name?: string
  last_name?: string
  email?: string
}

/** Single invitation from GET /events/{eventID}/invitations */
export interface EventInvitation {
  id: string
  email?: string
  event_id: string
  sent_at?: string
}

/** Pagination metadata from list endpoints */
export interface PaginationMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
}

/** Unwrapped response from GET /events/{eventID}/invitations (api returns data wrapper) */
export interface ListEventInvitationsResult {
  items: EventInvitation[]
  pagination: PaginationMeta
}

/** Response from POST /events/{eventID}/invitations */
export interface SendEventInvitationsResult {
  sent: number
  failed: string[]
}
