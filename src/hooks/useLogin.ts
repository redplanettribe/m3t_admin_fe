import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type { LoginRequest, LoginResponse } from "@/types/auth"

export function useLogin() {
  return useMutation({
    mutationKey: queryKeys.auth.login,
    mutationFn: async (variables: LoginRequest): Promise<LoginResponse> => {
      return apiClient.post<LoginResponse>("/auth/login", variables)
    },
  })
}
