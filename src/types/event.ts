export interface Event {
  id: string
  name: string
  slug: string
  created_at?: string
  updated_at?: string
}

export interface Room {
  id: string
  name?: string
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
}

export interface EventSchedule {
  event: Event
  rooms?: Room[]
  sessions?: Session[]
}
