import { create } from "zustand"
import { persist } from "zustand/middleware"

interface EventState {
  activeEventId: string | null
  setActiveEventId: (id: string | null) => void
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      activeEventId: null,
      setActiveEventId: (id) => set({ activeEventId: id }),
    }),
    { name: "m3t-admin-event" }
  )
)
