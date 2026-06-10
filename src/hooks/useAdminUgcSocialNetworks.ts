import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useUserStore } from "@/store/userStore"
import type {
  CreateAdminUgcSocialNetworkRequest,
  ListAdminUgcSocialNetworksParams,
  ListAdminUgcSocialNetworksResult,
  UGCSocialNetwork,
} from "@/types/admin"

function shouldRetryAdminUgcSocialNetworks(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return false
  }
  return failureCount < 2
}

function buildUgcSocialNetworksSearchParams(params: ListAdminUgcSocialNetworksParams): string {
  const searchParams = new URLSearchParams()
  if (params.page != null) {
    searchParams.set("page", String(params.page))
  }
  if (params.page_size != null) {
    searchParams.set("page_size", String(params.page_size))
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

async function fetchAdminUgcSocialNetworks(
  params: ListAdminUgcSocialNetworksParams
): Promise<ListAdminUgcSocialNetworksResult> {
  return apiClient.get<ListAdminUgcSocialNetworksResult>(
    `admin/ugc/social-networks${buildUgcSocialNetworksSearchParams(params)}`
  )
}

export function useAdminUgcSocialNetworks(params: ListAdminUgcSocialNetworksParams) {
  const token = useUserStore((s) => s.token)

  return useQuery({
    queryKey: queryKeys.admin.ugcSocialNetworks(params),
    queryFn: () => fetchAdminUgcSocialNetworks(params),
    enabled: !!token,
    retry: shouldRetryAdminUgcSocialNetworks,
  })
}

export function useCreateAdminUgcSocialNetwork() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateAdminUgcSocialNetworkRequest) =>
      apiClient.post<UGCSocialNetwork>("admin/ugc/social-networks", body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "ugc", "social-networks"],
      })
    },
  })
}

export function useDeleteAdminUgcSocialNetwork() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ code }: { code: string }) =>
      apiClient.delete<undefined>(
        `admin/ugc/social-networks/${encodeURIComponent(code)}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "ugc", "social-networks"],
      })
    },
  })
}
