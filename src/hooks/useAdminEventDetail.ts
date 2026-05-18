import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useUserStore } from "@/store/userStore"
import type { AdminEventDetail } from "@/types/admin"

function shouldRetryAdminEventDetail(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return false
  }
  return failureCount < 2
}

function normalizeAdminEventDetail(raw: AdminEventDetail): AdminEventDetail {
  return {
    ...raw,
    team_members: raw.team_members ?? [],
    tiers: raw.tiers ?? [],
    deliverables: raw.deliverables ?? [],
    rooms: (raw.rooms ?? []).map((roomWithSessions) => ({
      ...roomWithSessions,
      sessions: roomWithSessions.sessions ?? [],
    })),
    unscheduled_sessions: raw.unscheduled_sessions ?? [],
  }
}

async function fetchAdminEventDetail(eventId: string): Promise<AdminEventDetail> {
  const data = await apiClient.get<AdminEventDetail>(`admin/events/${eventId}`)
  return normalizeAdminEventDetail(data)
}

export function useAdminEventDetail(eventId: string | null) {
  const token = useUserStore((s) => s.token)

  return useQuery({
    queryKey: queryKeys.admin.eventDetail(eventId ?? ""),
    queryFn: () => fetchAdminEventDetail(eventId!),
    enabled: !!token && !!eventId,
    retry: shouldRetryAdminEventDetail,
  })
}

export { fetchAdminEventDetail }
