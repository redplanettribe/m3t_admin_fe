import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useUserStore } from "@/store/userStore"
import type { UpdateUserRequest, User } from "@/types/auth"

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateUserRequest) =>
      apiClient.patch<User>("users/me", body),
    onSuccess: (data) => {
      useUserStore.getState().setUser(data)
      queryClient.setQueryData(queryKeys.users.me, data)
    },
  })
}
