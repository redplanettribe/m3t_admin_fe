import type { Location } from "react-router-dom"

export type AppNavigateState = { from?: string }

export type AttendeeProfileFallback = {
  name?: string
  last_name?: string
  profile_picture_url?: string
}

export type AttendeeProfileNavigateState = AppNavigateState & {
  fallbackProfile?: AttendeeProfileFallback
}

function isSafeInternalPath(value: string): boolean {
  if (value.includes("\n") || value.includes("\r")) return false
  if (/^[a-zA-Z][a-zA-Z+.-]*:/.test(value)) return false
  if (!value.startsWith("/") || value.startsWith("//")) return false
  return true
}

export function makeNavigateFrom(
  location: Pick<Location, "pathname" | "search">
): AppNavigateState {
  return { from: `${location.pathname}${location.search}` }
}

export function resolveReturnPath(state: unknown, fallback: string): string {
  if (!state || typeof state !== "object" || !("from" in state)) return fallback
  const from = (state as AppNavigateState).from
  if (typeof from !== "string" || !from.trim()) return fallback
  const trimmed = from.trim()
  if (!isSafeInternalPath(trimmed)) return fallback
  return trimmed
}

const PATH_LABELS: Record<string, string> = {
  "/schedule": "Back to schedule",
  "/sessions": "Back to sessions",
  "/speakers": "Back to speakers",
  "/rooms": "Back to rooms",
}

export function returnLabelForPath(path: string): string {
  if (path.includes("/chat")) return "Back to chat"
  return PATH_LABELS[path] ?? "Back"
}
