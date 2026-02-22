export interface Event {
  id: string
  name: string
  slug: string
  created_at?: string
  updated_at?: string
}

export interface EventSchedule {
  event: Event
  rooms?: Array<{ id: string; name?: string; [key: string]: unknown }>
  sessions?: Array<{ id: string; [key: string]: unknown }>
}
