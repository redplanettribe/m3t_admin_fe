import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type { RequestLoginCodeRequest } from "@/types/auth"

export function useRequestLoginCode() {
  return useMutation({
    mutationKey: queryKeys.auth.requestLoginCode,
    mutationFn: async (variables: RequestLoginCodeRequest): Promise<void> => {
      await apiClient.post("/auth/login/request", variables)
    },
  })
}
