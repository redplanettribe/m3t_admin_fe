export interface Event {
  id: string
  name: string
  event_code?: string
  owner_id?: string
  created_at?: string
  updated_at?: string
  start_date?: string
  duration_days?: number
  /** Fixed UTC offset like "+02:00" or "-05:00". */
  time_zone?: string
  description?: string
  location_lat?: number
  location_lng?: number
  thumbnail_url?: string
}

export interface UpdateEventRequest {
  /** Fixed UTC offset like "+02:00" or "-05:00". */
  time_zone: string
  start_date?: string
  duration_days?: number
  description?: string
  location_lat?: number
  location_lng?: number
}

export interface RequestThumbnailUploadResult {
  key: string
  upload_url: string
}

export interface ConfirmThumbnailRequest {
  key: string
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
  source?: string
  source_session_id?: number
}

/** Room with nested sessions — shape returned by GET /events/{eventID}. */
export interface RoomWithSessions {
  room: Room
  sessions: SessionInput[]
}

export interface UpdateRoomRequest {
  name?: string
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

/** Lifecycle status from domain.SessionStatus (API). */
export const SESSION_STATUSES = [
  "Scheduled",
  "Live",
  "Completed",
  "Draft",
  "Canceled",
] as const

export type SessionStatus = (typeof SESSION_STATUSES)[number]

/** Session with event_day and HH:mm times. Times are relative to event.start_date + (event_day - 1) days. */
export interface Session {
  id: string
  room_id: string
  event_day: number
  start_time: string
  end_time: string
  title?: string
  description?: string
  /** Lifecycle status when returned by the API. */
  status?: SessionStatus
  tags?: EventTag[]
  /** Fully populated speakers for this session, as returned by the API. */
  speakers?: Speaker[]
}

/** Request body for PATCH /events/{eventID}/sessions/{sessionID} */
export interface UpdateSessionScheduleRequest {
  room_id?: string
  event_day?: number
  start_time?: string
  end_time?: string
}

/** Request body for POST /events/{eventID}/sessions */
export interface CreateSessionRequest {
  room_id: string
  event_day: number
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

/** Request body for PATCH /events/{eventID}/sessions/{sessionID}/status */
export interface UpdateSessionStatusRequest {
  status: SessionStatus
}

/** Raw session from API. Tags may be string[] or EventTag[]. */
export type SessionInput =
  | Session
  | {
    id: string
    room_id?: string
    event_day?: number
    start_time?: string
    end_time?: string
    title?: string
    description?: string
    status?: SessionStatus
    /** Flexible tags shape from older responses: either names or full EventTag objects. */
    tags?: string[] | EventTag[]
    /** Embedded speakers for this session, matching the backend Session model. */
    speakers?: Speaker[]
  }

/** Response from GET /events/{eventID}: event plus rooms each with nested sessions. */
export interface EventSchedule {
  event: Event
  rooms: RoomWithSessions[]
}

export interface EventTag {
  id: string
  name: string
}

/** Event tier from GET /events/{eventID}/tiers */
export interface EventTier {
  id: string
  event_id: string
  name: string
  color?: string
  created_at?: string
  updated_at?: string
}

/** Request body for POST /events/{eventID}/tiers */
export interface CreateEventTierRequest {
  name: string
  color?: string
}

/** Request body for PATCH /events/{eventID}/tiers/{tierID} */
export interface UpdateEventTierRequest {
  name?: string
  color?: string
}

/** Request body for POST /events/{eventID}/rooms/{roomID}/tiers */
export interface AddRoomTierRequest {
  tier_id: string
}

/** Request body for POST /events/{eventID}/sessions/{sessionID}/tiers */
export interface AddSessionTierRequest {
  tier_id: string
}

/** Response from POST /events/{eventID}/tiers/{tierID}/assignments */
export interface AssignTierUsersResult {
  added: number
  failed: string[]
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

/** Single registration item from GET /events/{eventID}/registrations (registration + user info) */
export interface EventRegistrationItem {
  registration_id: string
  user_id: string
  event_id: string
  name?: string
  last_name?: string
  email?: string
  created_at?: string
  updated_at?: string
  /** Whether the attendee has checked in to the event */
  checked_in?: boolean
  /** Event tier assigned to the attendee, if any */
  tier?: EventTier | null
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

/** Unwrapped response from GET /events/{eventID}/registrations (api returns data wrapper) */
export interface ListEventRegistrationsResult {
  items: EventRegistrationItem[]
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
  phone_number?: string
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
  phone_number?: string
  profile_picture?: string
  is_top_speaker?: boolean
}

/** Request body for PATCH /events/{eventID}/speakers/{speakerID} */
export interface UpdateSpeakerRequest {
  first_name?: string
  last_name?: string
  bio?: string
  tag_line?: string
  phone_number?: string
  profile_picture?: string
  is_top_speaker?: boolean
}

/** Response from GET /events/{eventID}/speakers/{speakerID} (data shape after apiClient unwraps) */
export interface GetEventSpeakerResponse {
  speaker: Speaker
  sessions: Session[]
}
