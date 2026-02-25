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
  events: {
    list: ["events", "me"] as const,
    detail: (id: string) => ["events", id] as const,
    teamMembers: (eventId: string) => ["events", eventId, "team-members"] as const,
    invitations: (eventId: string, page: number, pageSize: number, search: string) =>
      ["events", eventId, "invitations", page, pageSize, search ?? ""] as const,
  },
} as const
