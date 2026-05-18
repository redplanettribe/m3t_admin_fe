import type {
  Event,
  EventTeamMember,
  EventTier,
  PaginationMeta,
  RoomWithSessions,
  Session,
} from "@/types/event"

export interface AdminPingResponse {
  ok: boolean
}

export interface AdminEventOwner {
  id?: string
  email?: string
  name?: string
  last_name?: string
}

export interface AdminEventListItem {
  event: Event
  owner?: AdminEventOwner | null
}

export interface ListAdminEventsResult {
  items: AdminEventListItem[]
  pagination: PaginationMeta
}

export type AdminEventsStatus = "active" | "past" | "all"

export type AdminEventsSort =
  | "created_at"
  | "updated_at"
  | "start_date"
  | "end_date"
  | "name"
  | "event_code"
  | "owner_email"

export type AdminEventsOrder = "asc" | "desc"

export interface ListAdminEventsParams {
  status?: AdminEventsStatus
  search?: string
  owner_search?: string
  owner_id?: string
  event_code?: string
  has_owner?: boolean
  start_date_from?: string
  start_date_to?: string
  created_from?: string
  created_to?: string
  sort?: AdminEventsSort
  order?: AdminEventsOrder
  page?: number
  page_size?: number
}

export interface AdminEventStats {
  registration_count?: number
  checked_in_count?: number
}

export interface AdminEventDeliverable {
  id: string
  event_id?: string
  name?: string
  description?: string
  repeatable?: boolean
  delivered_count?: number
  created_at?: string
  updated_at?: string
}

export interface AdminEventDetail {
  event: Event
  owner?: AdminEventOwner | null
  stats?: AdminEventStats | null
  team_members: EventTeamMember[]
  tiers: EventTier[]
  deliverables: AdminEventDeliverable[]
  rooms: RoomWithSessions[]
  unscheduled_sessions: Session[]
}

export interface AdminEventTimelineItem {
  id?: string
  title?: string
  status?: string
  registration_count?: number
  check_in_count?: number
  invitation_sent_count?: number
}

export interface AdminEventTimelineBucket {
  bucket_start?: string
  events?: AdminEventTimelineItem[]
}

export type AdminEventTimelineGranularity = "day"

export interface AdminEventTimelineParams {
  from?: string
  to?: string
  timezone?: string
  granularity?: AdminEventTimelineGranularity
  status?: AdminEventsStatus
}

export interface AdminEventTimelineResult {
  buckets?: AdminEventTimelineBucket[]
  from?: string
  to?: string
  granularity?: string
  timezone?: string
}
