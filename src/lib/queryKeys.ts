/**
 * Central TanStack Query key factory.
 * Use a factory pattern for list/detail keys, e.g.:
 *   events: { list: ['events'], detail: (id) => ['events', id] }
 */
export const queryKeys = {
  auth: {
    signup: ["auth", "signup"] as const,
    login: ["auth", "login"] as const,
  },
  events: {
    list: ["events", "me"] as const,
    detail: (id: string) => ["events", id] as const,
    teamMembers: (eventId: string) => ["events", eventId, "team-members"] as const,
  },
} as const
