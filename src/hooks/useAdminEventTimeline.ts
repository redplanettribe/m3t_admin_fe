import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useUserStore } from "@/store/userStore"
import type { AdminEventTimelineParams, AdminEventTimelineResult } from "@/types/admin"

function shouldRetryAdminEventTimeline(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return false
  }
  return failureCount < 2
}

function buildAdminEventTimelineSearchParams(params: AdminEventTimelineParams): string {
  const searchParams = new URLSearchParams()

  if (params.from?.trim()) {
    searchParams.set("from", params.from.trim())
  }
  if (params.to?.trim()) {
    searchParams.set("to", params.to.trim())
  }
  if (params.timezone?.trim()) {
    searchParams.set("timezone", params.timezone.trim())
  }
  if (params.granularity) {
    searchParams.set("granularity", params.granularity)
  }
  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status)
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

async function fetchAdminEventTimeline(
  params: AdminEventTimelineParams
): Promise<AdminEventTimelineResult> {
  return apiClient.get<AdminEventTimelineResult>(
    `admin/events/timeline${buildAdminEventTimelineSearchParams(params)}`
  )
}

export function useAdminEventTimeline(params: AdminEventTimelineParams) {
  const token = useUserStore((s) => s.token)

  return useQuery({
    queryKey: queryKeys.admin.eventTimeline(params),
    queryFn: () => fetchAdminEventTimeline(params),
    enabled: !!token,
    retry: shouldRetryAdminEventTimeline,
  })
}
