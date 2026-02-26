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

/** Request body for POST /events/{eventID}/rooms */
export interface CreateRoomRequest {
  name?: string
  capacity?: number
  description?: string
  how_to_get_there?: string
  not_bookable?: boolean
}

/** Session with start/end for schedule placement. API may use starts_at/ends_at/room_id or camelCase. Tags from API are objects with id and name. */
export interface Session {
  id: string
  room_id: string
  starts_at: string
  ends_at: string
  title?: string
  description?: string
  speaker?: string
  speakers?: string[]
  speaker_ids?: string[]
  tags?: EventTag[]
}

/** Request body for PATCH /events/{eventID}/sessions/{sessionID} */
export interface UpdateSessionScheduleRequest {
  room_id?: string
  start_time?: string
  end_time?: string
}

/** Request body for POST /events/{eventID}/sessions */
export interface CreateSessionRequest {
  room_id: string
  start_time: string
  end_time: string
  title?: string
  description?: string
  tags?: string[]
  speaker_ids?: string[]
}

/** Request body for PATCH /events/{eventID}/sessions/{sessionID}/content */
export interface UpdateSessionContentRequest {
  title?: string
  description?: string
}

/** Raw session from API (may be camelCase or different field names). Tags may be string[] or EventTag[]. */
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
  speaker_ids?: string[]
  tags?: string[] | EventTag[]
}

export interface EventSchedule {
  event: Event
  rooms?: Room[]
  sessions?: Session[]
}

export interface EventTag {
  id: string
  name: string
}

/** Response shape from GET /events/{eventID}/tags (apiClient returns .data as EventTag[]) */
export interface ListEventTagsSuccessResponse {
  data: EventTag[]
  error?: { code?: string; message?: string }
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

/** Speaker from GET /events/{eventID}/speakers or get-by-id */
export interface Speaker {
  id: string
  event_id: string
  first_name?: string
  last_name?: string
  bio?: string
  tag_line?: string
  profile_picture?: string
  is_top_speaker?: boolean
  sessionize_speaker_id?: string
  created_at?: string
  updated_at?: string
}

/** Request body for POST /events/{eventID}/speakers */
export interface CreateSpeakerRequest {
  first_name?: string
  last_name?: string
  bio?: string
  tag_line?: string
  profile_picture?: string
  is_top_speaker?: boolean
}

/** Response from GET /events/{eventID}/speakers/{speakerID} (data shape after apiClient unwraps) */
export interface GetEventSpeakerResponse {
  speaker: Speaker
  sessions: Session[]
}
