import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useUserStore } from "@/store/userStore"
import type { ListAdminEventsParams, ListAdminEventsResult } from "@/types/admin"

function shouldRetryAdminEvents(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return false
  }
  return failureCount < 2
}

function buildAdminEventsSearchParams(params: ListAdminEventsParams): string {
  const searchParams = new URLSearchParams()

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status)
  }
  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim())
  }
  if (params.owner_search?.trim()) {
    searchParams.set("owner_search", params.owner_search.trim())
  }
  if (params.owner_id?.trim()) {
    searchParams.set("owner_id", params.owner_id.trim())
  }
  if (params.event_code?.trim()) {
    searchParams.set("event_code", params.event_code.trim().toLowerCase())
  }
  if (params.has_owner !== undefined) {
    searchParams.set("has_owner", String(params.has_owner))
  }
  if (params.start_date_from?.trim()) {
    searchParams.set("start_date_from", params.start_date_from.trim())
  }
  if (params.start_date_to?.trim()) {
    searchParams.set("start_date_to", params.start_date_to.trim())
  }
  if (params.created_from?.trim()) {
    searchParams.set("created_from", params.created_from.trim())
  }
  if (params.created_to?.trim()) {
    searchParams.set("created_to", params.created_to.trim())
  }
  if (params.sort) {
    searchParams.set("sort", params.sort)
  }
  if (params.order) {
    searchParams.set("order", params.order)
  }
  if (params.page != null) {
    searchParams.set("page", String(params.page))
  }
  if (params.page_size != null) {
    searchParams.set("page_size", String(params.page_size))
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

async function fetchAdminEvents(params: ListAdminEventsParams): Promise<ListAdminEventsResult> {
  return apiClient.get<ListAdminEventsResult>(
    `admin/events${buildAdminEventsSearchParams(params)}`
  )
}

export function useAdminEvents(params: ListAdminEventsParams) {
  const token = useUserStore((s) => s.token)

  return useQuery({
    queryKey: queryKeys.admin.events(params),
    queryFn: () => fetchAdminEvents(params),
    enabled: !!token,
    retry: shouldRetryAdminEvents,
  })
}
