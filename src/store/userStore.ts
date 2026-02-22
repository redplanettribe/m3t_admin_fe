import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types/auth"

interface UserState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setAuth: (user: User | null, token: string | null) => void
  clearAuth: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    { name: "m3t-admin-user" }
  )
)
