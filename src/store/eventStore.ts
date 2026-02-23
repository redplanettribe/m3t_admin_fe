import { create } from "zustand"
import { persist } from "zustand/middleware"

interface EventState {
  activeEventId: string | null
  setActiveEventId: (id: string | null) => void
  /** Saved Sessionize API ID per event, used as default when reopening the import modal. */
  sessionizeIdByEventId: Record<string, string>
  setSessionizeIdForEvent: (eventId: string, sessionizeId: string) => void
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      activeEventId: null,
      setActiveEventId: (id) => set({ activeEventId: id }),
      sessionizeIdByEventId: {},
      setSessionizeIdForEvent: (eventId, sessionizeId) =>
        set((state) => ({
          sessionizeIdByEventId: {
            ...state.sessionizeIdByEventId,
            [eventId]: sessionizeId,
          },
        })),
    }),
    { name: "m3t-admin-event" }
  )
)
