import * as React from "react"
import { ApiError, apiClient } from "@/lib/api"
import { buildWsUrl } from "@/lib/wsUrl"
import { useUserStore } from "@/store/userStore"
import type {
  AgendaWsTicket,
  ChatConnectionState,
  ChatMessageEnvelope,
  ChatStreamError,
  ChatWsErrorEnvelope,
  EventChatMessage,
} from "@/types/chat"

type UseEventGeneralChatStreamOptions = {
  eventId: string | null
  onMessage: (message: EventChatMessage) => void
}

type UseEventGeneralChatStreamResult = {
  connectionState: ChatConnectionState
  error: ChatStreamError | null
  reconnectNow: () => void
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

function generalChatTopic(eventId: string) {
  return `attendee.chat.${eventId.toLowerCase()}.general`
}

async function fetchTicket(eventId: string): Promise<AgendaWsTicket> {
  return apiClient.postNoBody<AgendaWsTicket>(`/events/${eventId}/agenda/ws/ticket`)
}

export function useEventGeneralChatStream({
  eventId,
  onMessage,
}: UseEventGeneralChatStreamOptions): UseEventGeneralChatStreamResult {
  const token = useUserStore((s) => s.token)
  const onMessageRef = React.useRef(onMessage)
  onMessageRef.current = onMessage

  const [connectionState, setConnectionState] =
    React.useState<ChatConnectionState>("connecting")
  const [error, setError] = React.useState<ChatStreamError | null>(null)
  const [reconnectNonce, setReconnectNonce] = React.useState(0)

  const reconnectNow = React.useCallback(() => {
    setReconnectNonce((n) => n + 1)
  }, [])

  React.useEffect(() => {
    let closed = false
    let ws: WebSocket | null = null
    let attempt = 0

    const closeSocket = () => {
      if (ws) {
        if (ws.readyState === WebSocket.OPEN && eventId) {
          try {
            ws.send(
              JSON.stringify({
                type: "unsubscribe",
                topic: generalChatTopic(eventId),
              })
            )
          } catch {
            // ignore send errors during teardown
          }
        }
        ws.close()
        ws = null
      }
    }

    if (!eventId || !token) {
      setConnectionState("error")
      setError(null)
      return () => {}
    }

    const topic = generalChatTopic(eventId)

    const run = async () => {
      while (!closed) {
        try {
          setConnectionState(attempt > 0 ? "reconnecting" : "connecting")
          setError(null)

          const ticketResp = await fetchTicket(eventId)
          if (closed) return

          await new Promise<void>((resolve, reject) => {
            const socket = new WebSocket(buildWsUrl(ticketResp.ticket))
            ws = socket

            socket.onopen = () => {
              socket.send(JSON.stringify({ type: "subscribe", topic }))
            }

            socket.onmessage = (ev) => {
              try {
                const frame = JSON.parse(ev.data as string) as
                  | ChatMessageEnvelope
                  | ChatWsErrorEnvelope

                if (frame.type === "error") {
                  const errFrame = frame as ChatWsErrorEnvelope
                  setError({
                    code: errFrame.data?.code,
                    message: errFrame.data?.message ?? "WebSocket error",
                  })
                  setConnectionState("error")
                  socket.close()
                  reject(new Error(errFrame.data?.message ?? "WebSocket error"))
                  return
                }

                if (frame.type === "chat.message" && frame.topic === topic) {
                  const msgFrame = frame as ChatMessageEnvelope
                  onMessageRef.current(msgFrame.data)
                  setError(null)
                  setConnectionState("live")
                  attempt = 0
                }
              } catch {
                // ignore malformed frame
              }
            }

            socket.onerror = () => {
              reject(new Error("WebSocket connection failed"))
            }

            socket.onclose = () => {
              if (closed) {
                resolve()
              } else {
                reject(new Error("WebSocket disconnected"))
              }
            }

            window.setTimeout(() => {
              if (!closed && socket.readyState === WebSocket.OPEN) {
                setConnectionState("live")
                setError(null)
              }
            }, 800)
          })

          return
        } catch (e) {
          if (closed) return

          closeSocket()

          const err =
            e instanceof ApiError
              ? { message: e.message, code: e.code, status: e.status }
              : { message: e instanceof Error ? e.message : "WebSocket failed" }

          setError(err)
          setConnectionState("error")

          const delay = backoffMs(attempt)
          attempt += 1
          await sleepMs(delay)
        }
      }
    }

    run()

    return () => {
      closed = true
      closeSocket()
    }
  }, [eventId, token, reconnectNonce])

  return { connectionState, error, reconnectNow }
}
