import * as React from "react"
import { ApiError, apiBaseUrl, apiClient } from "@/lib/api"
import { useUserStore } from "@/store/userStore"
import type {
  EventStatusLiveSnapshot,
  EventStatusStreamTicket,
  LiveConnectionState,
  LiveStreamError,
} from "@/types/liveStatus"

type UseEventLiveStatusStreamResult = {
  snapshot: EventStatusLiveSnapshot | null
  lastUpdateAt: Date | null
  connectionState: LiveConnectionState
  error: LiveStreamError | null
  reconnectNow: () => void
}

function buildStreamUrl(eventId: string, ticket: string) {
  const base = apiBaseUrl.replace(/\/$/, "")
  const url = `${base}/events/${encodeURIComponent(eventId)}/live/status/stream`
  const params = new URLSearchParams({ ticket })
  return `${url}?${params.toString()}`
}

function sleepMs(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function backoffMs(attempt: number) {
  const base = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5))
  const jitter = Math.floor(Math.random() * 250)
  return base + jitter
}

async function fetchTicket(eventId: string): Promise<EventStatusStreamTicket> {
  return apiClient.postNoBody<EventStatusStreamTicket>(
    `/events/${eventId}/live/status/ticket`
  )
}

async function preflightStream(url: string, signal: AbortSignal) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "text/event-stream" },
    signal,
  })

  if (res.ok) return

  const json = (await res.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string }
  }
  const msg = json.error?.message ?? res.statusText ?? "Stream request failed"
  throw new ApiError(msg, json.error?.code, res.status)
}

export function useEventLiveStatusStream({
  eventId,
}: {
  eventId: string | null
}): UseEventLiveStatusStreamResult {
  const token = useUserStore((s) => s.token)
  const [snapshot, setSnapshot] = React.useState<EventStatusLiveSnapshot | null>(
    null
  )
  const [lastUpdateAt, setLastUpdateAt] = React.useState<Date | null>(null)
  const [connectionState, setConnectionState] =
    React.useState<LiveConnectionState>("connecting")
  const [error, setError] = React.useState<LiveStreamError | null>(null)
  const [reconnectNonce, setReconnectNonce] = React.useState(0)

  const reconnectNow = React.useCallback(() => {
    setReconnectNonce((n) => n + 1)
  }, [])

  React.useEffect(() => {
    let closed = false
    let es: EventSource | null = null
    let attempt = 0

    const close = () => {
      if (es) {
        es.close()
        es = null
      }
    }

    const hardReset = () => {
      setSnapshot(null)
      setLastUpdateAt(null)
      setError(null)
    }

    if (!eventId || !token) {
      close()
      hardReset()
      setConnectionState("error")
      return () => {}
    }

    let reconnecting = false

    const run = async () => {
      setConnectionState("connecting")
      setError(null)

      while (!closed) {
        try {
          const ticketResp = await fetchTicket(eventId)
          if (closed) return

          const streamUrl = buildStreamUrl(eventId, ticketResp.ticket)

          const controller = new AbortController()
          try {
            await preflightStream(streamUrl, controller.signal)
          } finally {
            controller.abort()
          }

          if (closed) return

          setConnectionState(reconnecting ? "reconnecting" : "connecting")

          await new Promise<void>((resolve, reject) => {
            const source = new EventSource(streamUrl)
            es = source

            const onSnapshot = (ev: MessageEvent) => {
              try {
                const data = JSON.parse(ev.data) as EventStatusLiveSnapshot
                setSnapshot(data)
                setLastUpdateAt(new Date())
                setError(null)
                setConnectionState("live")
                attempt = 0
                reconnecting = false
                resolve()
              } catch {
                // ignore malformed frame
              }
            }

            const onServerError = (ev: MessageEvent) => {
              try {
                const data = JSON.parse(ev.data) as { code?: string; message?: string }
                setError({
                  code: data.code,
                  message: data.message ?? "Stream error",
                })
              } catch {
                setError({ message: "Stream error" })
              } finally {
                setConnectionState("error")
                source.close()
              }
            }

            source.addEventListener("snapshot", onSnapshot as EventListener)
            source.addEventListener("error", (ev) => {
              if (ev instanceof MessageEvent && typeof ev.data === "string" && ev.data) {
                onServerError(ev)
              }
            })

            source.onerror = () => {
              reject(new Error("Stream disconnected"))
              source.close()
            }
          })

          // After first snapshot, keep stream open until disconnect.
          // Wait here; if closed, cleanup effect handles close().
          while (!closed && es) {
            await sleepMs(1000)
          }
          return
        } catch (e) {
          if (closed) return

          const err =
            e instanceof ApiError
              ? { message: e.message, code: e.code, status: e.status }
              : { message: e instanceof Error ? e.message : "Stream failed" }

          setError(err)
          setConnectionState("error")
          close()

          const delay = backoffMs(attempt)
          attempt += 1
          reconnecting = true
          await sleepMs(delay)
          setConnectionState("reconnecting")
        }
      }
    }

    run()

    return () => {
      closed = true
      close()
    }
  }, [eventId, token, reconnectNonce])

  return { snapshot, lastUpdateAt, connectionState, error, reconnectNow }
}

