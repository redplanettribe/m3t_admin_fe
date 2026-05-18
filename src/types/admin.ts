import type { Event, PaginationMeta } from "@/types/event"

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
