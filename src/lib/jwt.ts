import type { User } from "@/types/auth"

/**
 * Decode JWT payload without verification (client-side only for display).
 * Server validates the token. Returns minimal User from sub, email, and roles.
 */
export function userFromToken(token: string): User | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    ) as { sub?: string; email?: string; name?: string; roles?: string[] }
    const id = payload.sub ?? ""
    const email = payload.email ?? ""
    const role = Array.isArray(payload.roles)
      ? payload.roles[0]
      : undefined
    if (!id && !email) return null
    return {
      id,
      email,
      name: payload.name ?? email,
      role,
    }
  } catch {
    return null
  }
}
