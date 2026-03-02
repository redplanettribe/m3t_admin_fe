import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useUserStore } from "@/store/userStore"
import type { AvatarUploadInfo, UpdateUserRequest, User } from "@/types/auth"

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

export function useUpdateUserAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      let uploadInfo: AvatarUploadInfo
      try {
        uploadInfo = await apiClient.post<AvatarUploadInfo>(
          "users/me/avatar/upload-url",
          {}
        )
      } catch (error) {
        throw error
      }

      const uploadResponse = await fetch(uploadInfo.upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      })

      if (!uploadResponse.ok) {
        throw new ApiError(
          "Failed to upload profile picture",
          "upload_failed",
          uploadResponse.status
        )
      }

      const updatedUser = await apiClient.put<User>("users/me/avatar", {
        key: uploadInfo.key,
      })

      useUserStore.getState().setUser(updatedUser)
      queryClient.setQueryData(queryKeys.users.me, updatedUser)

      return updatedUser
    },
  })
}
