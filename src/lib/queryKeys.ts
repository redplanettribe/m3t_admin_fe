import type {
  AdminEventTimelineParams,
  ListAdminEventsParams,
  ListAdminUgcSocialNetworksParams,
} from "@/types/admin"
import type {
  EventCheckInTimelineGranularity,
  ListEventSponsorsParams,
  ListEventUgcSocialNetworksParams,
} from "@/types/event"

/**
 * Central TanStack Query key factory.
 * Use a factory pattern for list/detail keys, e.g.:
 *   events: { list: ['events'], detail: (id) => ['events', id] }
 */
export const queryKeys = {
  admin: {
    ping: ["admin", "ping"] as const,
    events: (params: ListAdminEventsParams) => ["admin", "events", params] as const,
    eventTimeline: (params: AdminEventTimelineParams) =>
      ["admin", "events", "timeline", params] as const,
    eventDetail: (eventId: string) => ["admin", "events", eventId] as const,
    ugcSocialNetworks: (params: ListAdminUgcSocialNetworksParams) =>
      ["admin", "ugc", "social-networks", params] as const,
  },
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
    deliverables: (eventId: string, page: number, pageSize: number) =>
      ["events", eventId, "deliverables", page, pageSize] as const,
    announcements: (eventId: string, page: number, pageSize: number) =>
      ["events", eventId, "announcements", page, pageSize] as const,
    deliverable: (eventId: string, deliverableId: string) =>
      ["events", eventId, "deliverables", deliverableId] as const,
    sponsors: (
      eventId: string,
      page: number,
      pageSize: number,
      filters?: ListEventSponsorsParams
    ) =>
      [
        "events",
        eventId,
        "sponsors",
        page,
        pageSize,
        filters?.search ?? "",
        filters?.status ?? "",
        filters?.sponsorship_level ?? "",
        filters?.booth_type ?? "",
      ] as const,
    sponsor: (eventId: string, sponsorId: string) =>
      ["events", eventId, "sponsors", sponsorId] as const,
    sponsorAnalytics: (eventId: string) =>
      ["events", eventId, "sponsors", "analytics"] as const,
    invitations: (eventId: string, page: number, pageSize: number, search: string) =>
      ["events", eventId, "invitations", page, pageSize, search ?? ""] as const,
    registrations: (
      eventId: string,
      page: number,
      pageSize: number,
      search: string,
      tierId?: string
    ) =>
      ["events", eventId, "registrations", page, pageSize, search ?? "", tierId ?? ""] as const,
    sessionsSchedule: (eventId: string, page: number, pageSize: number, search: string) =>
      ["events", eventId, "sessions-schedule", page, pageSize, search ?? ""] as const,
    analytics: (eventId: string) => ["events", eventId, "analytics"] as const,
    checkInTimeline: (eventId: string, granularity: EventCheckInTimelineGranularity) =>
      ["events", eventId, "analytics", "check-ins", "timeline", granularity] as const,
    attendeeFlow: (eventId: string) =>
      ["events", eventId, "analytics", "flow"] as const,
    chatGeneral: (eventId: string) => ["events", eventId, "chat", "general"] as const,
    chatDmConversations: (eventId: string) =>
      ["events", eventId, "chat", "dm", "conversations"] as const,
    chatDmThread: (eventId: string, recipientUserId: string) =>
      ["events", eventId, "chat", "dm", recipientUserId] as const,
    chatBans: (eventId: string, page: number, pageSize: number) =>
      ["events", eventId, "chat", "bans", page, pageSize] as const,
    publicProfiles: (eventId: string, page: number, pageSize: number) =>
      ["events", eventId, "public-profiles", page, pageSize] as const,
    publicProfile: (eventId: string, userId: string) =>
      ["events", eventId, "public-profiles", userId] as const,
    settings: (eventId: string) => ["events", eventId, "settings"] as const,
    ugcSocialNetworks: (eventId: string, params: ListEventUgcSocialNetworksParams) =>
      ["events", eventId, "ugc", "social-networks", params] as const,
  },
} as const
