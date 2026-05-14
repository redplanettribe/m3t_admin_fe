import {
  SESSION_TECHNICAL_DIFFICULTIES,
  type SessionTechnicalDifficulty,
} from "@/types/event"

const LABELS: Record<SessionTechnicalDifficulty, string> = {
  non_technical: "Non-technical",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
}

/** Options for Select controls (value = API wire string). */
export const SESSION_TECHNICAL_DIFFICULTY_OPTIONS: {
  value: SessionTechnicalDifficulty
  label: string
}[] = SESSION_TECHNICAL_DIFFICULTIES.map((value) => ({
  value,
  label: LABELS[value],
}))

export function isSessionTechnicalDifficulty(
  value: string | undefined | null
): value is SessionTechnicalDifficulty {
  if (value == null || value === "") return false
  return (SESSION_TECHNICAL_DIFFICULTIES as readonly string[]).includes(value)
}

/** Human-readable label; unknown strings pass through; empty → em dash. */
export function formatSessionTechnicalDifficulty(
  value: SessionTechnicalDifficulty | string | undefined | null
): string {
  if (value == null || value === "") return "—"
  if (isSessionTechnicalDifficulty(value)) return LABELS[value]
  return value
}
