/**
 * Central TanStack Query key factory.
 * Use a factory pattern for list/detail keys, e.g.:
 *   events: { list: ['events'], detail: (id) => ['events', id] }
 */
export const queryKeys = {
  auth: {
    signup: ["auth", "signup"] as const,
    login: ["auth", "login"] as const,
  },
  // Add keys as you add API hooks, e.g.:
  // events: { list: ['events'] as const, detail: (id: string) => ['events', id] as const },
} as const
