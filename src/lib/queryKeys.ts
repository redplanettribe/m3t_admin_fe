/**
 * Central TanStack Query key factory.
 * Use a factory pattern for list/detail keys, e.g.:
 *   events: { list: ['events'], detail: (id) => ['events', id] }
 */
export const queryKeys = {
  auth: {
    requestLoginCode: ["auth", "requestLoginCode"] as const,
    verifyLoginCode: ["auth", "verifyLoginCode"] as const,
  },
  users: {
    me: ["users", "me"] as const,
  },
  sessions: {
    detail: (sessionId: string) => ["sessions", sessionId] as const,
  },
  events: {
    list: ["events", "me"] as const,
    detail: (id: string) => ["events", id] as const,
    rooms: (eventId: string) => ["events", eventId, "rooms"] as const,
    room: (eventId: string, roomId: string) =>
      ["events", eventId, "rooms", roomId] as const,
    roomTiers: (eventId: string, roomId: string) =>
      ["events", eventId, "rooms", roomId, "tiers"] as const,
    teamMembers: (eventId: string) => ["events", eventId, "team-members"] as const,
    speakers: (eventId: string) => ["events", eventId, "speakers"] as const,
    speaker: (eventId: string, speakerId: string) =>
      ["events", eventId, "speakers", speakerId] as const,
    sessionSpeakers: (eventId: string, sessionId: string) =>
      ["events", eventId, "sessions", sessionId, "speakers"] as const,
    sessionTiers: (eventId: string, sessionId: string) =>
      ["events", eventId, "sessions", sessionId, "tiers"] as const,
    tags: (eventId: string) => ["events", eventId, "tags"] as const,
    tiers: (eventId: string) => ["events", eventId, "tiers"] as const,
    invitations: (eventId: string, page: number, pageSize: number, search: string) =>
      ["events", eventId, "invitations", page, pageSize, search ?? ""] as const,
    registrations: (
      eventId: string,
      page: number,
      pageSize: number,
      search: string
    ) => ["events", eventId, "registrations", page, pageSize, search ?? ""] as const,
  },
} as const
