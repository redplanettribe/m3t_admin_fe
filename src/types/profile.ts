import type { PaginationMeta } from "@/types/event"

export type PublicAttendeeProfile = {
  user_id: string
  name: string
  last_name?: string
  profile_picture_url?: string
  headline?: string
  company?: string
  linkedin_url?: string
  web_page_url?: string
  topics_of_interest?: string[]
  intent_seeking?: string[]
  intent_offering?: string[]
}

export type ListEventPublicProfilesResponse = {
  items: PublicAttendeeProfile[]
  pagination: PaginationMeta
}
