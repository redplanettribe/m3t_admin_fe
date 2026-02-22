import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import type { SignUpRequest, User } from "@/types/auth"

export function useSignUp() {
  return useMutation({
    mutationKey: queryKeys.auth.signup,
    mutationFn: async (variables: SignUpRequest): Promise<User> => {
      return apiClient.post<User>("/auth/signup", variables)
    },
  })
}
