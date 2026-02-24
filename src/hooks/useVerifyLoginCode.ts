import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type { LoginResponse, VerifyLoginCodeRequest } from "@/types/auth"

export function useVerifyLoginCode() {
  return useMutation({
    mutationKey: queryKeys.auth.verifyLoginCode,
    mutationFn: async (
      variables: VerifyLoginCodeRequest
    ): Promise<LoginResponse> => {
      return apiClient.post<LoginResponse>("/auth/login/verify", variables)
    },
  })
}
