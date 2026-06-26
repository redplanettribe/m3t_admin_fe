import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface OrganizationState {
  activeOrganizationId: string | null
  setActiveOrganizationId: (id: string | null) => void
  clearAll: () => void
}

export const useOrganizationStore = create<OrganizationState>()(
  devtools(
    persist(
      (set) => ({
        activeOrganizationId: null,
        setActiveOrganizationId: (id) => set({ activeOrganizationId: id }),
        clearAll: () => set({ activeOrganizationId: null }),
      }),
      { name: "m3t-admin-organization" }
    ),
    { name: "OrganizationStore" }
  )
)
