import { apiBaseUrl } from "@/lib/api"

export function buildWsUrl(ticket: string): string {
  const base = apiBaseUrl.replace(/\/$/, "")
  let wsBase: string

  if (base.startsWith("/")) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    wsBase = `${protocol}//${window.location.host}${base}`
  } else {
    wsBase = base.replace(/^http/, "ws")
  }

  const params = new URLSearchParams({ ticket })
  return `${wsBase}/ws?${params.toString()}`
}
