import type { User } from "@/types/auth"

export function getDisplayName(user: User | null): string {
  if (user == null) return ""
  const parts = [user.name, user.last_name].filter(Boolean)
  return parts.join(" ").trim() || user.name || ""
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
