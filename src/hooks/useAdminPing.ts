import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useUserStore } from "@/store/userStore"
import type { AdminPingResponse } from "@/types/admin"

function shouldRetryAdminPing(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return false
  }
  return failureCount < 2
}

async function fetchAdminPing(): Promise<AdminPingResponse> {
  const data = await apiClient.get<AdminPingResponse>("admin/ping")
  if (data.ok !== true) {
    throw new ApiError("System admin access denied", "forbidden", 403)
  }
  return data
}

export function useAdminPing() {
  const token = useUserStore((s) => s.token)

  return useQuery({
    queryKey: queryKeys.admin.ping,
    queryFn: fetchAdminPing,
    enabled: !!token,
    staleTime: 0,
    refetchOnMount: "always",
    retry: shouldRetryAdminPing,
  })
}
