import * as React from "react"
import { ApiError, apiClient } from "@/lib/api"
import { buildWsUrl } from "@/lib/wsUrl"
import { useUserStore } from "@/store/userStore"
import type {
  AgendaWsTicket,
  ChatConnectionState,
  ChatMessageDeleted,
  ChatMessageDeletedEnvelope,
  ChatMessageEnvelope,
  ChatReactionEnvelope,
  ChatStreamError,
  ChatWsErrorEnvelope,
  EventChatMessage,
} from "@/types/chat"

type UseEventChatStreamOptions = {
  eventId: string | null
  generalEnabled: boolean
  organizersEnabled?: boolean
  onGeneralMessage?: (message: EventChatMessage) => void
  onDmMessage?: (message: EventChatMessage) => void
  onOrganizersMessage?: (message: EventChatMessage) => void
  onGeneralMessageDeleted?: (data: ChatMessageDeleted) => void
  onDmMessageDeleted?: (data: ChatMessageDeleted) => void
  onOrganizersMessageDeleted?: (data: ChatMessageDeleted) => void
  onGeneralReaction?: (frame: ChatReactionEnvelope) => void
  onDmReaction?: (frame: ChatReactionEnvelope) => void
  onOrganizersReaction?: (frame: ChatReactionEnvelope) => void
}

type UseEventChatStreamResult = {
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

function dmInboxTopic(eventId: string) {
  return `attendee.chat.${eventId.toLowerCase()}.dm.inbox`
}

function organizerChatTopic(eventId: string) {
  return `organizer.chat.${eventId.toLowerCase()}`
}

async function fetchTicket(eventId: string): Promise<AgendaWsTicket> {
  return apiClient.postNoBody<AgendaWsTicket>(`/events/${eventId}/agenda/ws/ticket`)
}

export function useEventChatStream({
  eventId,
  generalEnabled,
  organizersEnabled = false,
  onGeneralMessage,
  onDmMessage,
  onOrganizersMessage,
  onGeneralMessageDeleted,
  onDmMessageDeleted,
  onOrganizersMessageDeleted,
  onGeneralReaction,
  onDmReaction,
  onOrganizersReaction,
}: UseEventChatStreamOptions): UseEventChatStreamResult {
  const token = useUserStore((s) => s.token)
  const onGeneralMessageRef = React.useRef(onGeneralMessage)
  onGeneralMessageRef.current = onGeneralMessage
  const onDmMessageRef = React.useRef(onDmMessage)
  onDmMessageRef.current = onDmMessage
  const onOrganizersMessageRef = React.useRef(onOrganizersMessage)
  onOrganizersMessageRef.current = onOrganizersMessage
  const onGeneralMessageDeletedRef = React.useRef(onGeneralMessageDeleted)
  onGeneralMessageDeletedRef.current = onGeneralMessageDeleted
  const onDmMessageDeletedRef = React.useRef(onDmMessageDeleted)
  onDmMessageDeletedRef.current = onDmMessageDeleted
  const onOrganizersMessageDeletedRef = React.useRef(onOrganizersMessageDeleted)
  onOrganizersMessageDeletedRef.current = onOrganizersMessageDeleted
  const onGeneralReactionRef = React.useRef(onGeneralReaction)
  onGeneralReactionRef.current = onGeneralReaction
  const onDmReactionRef = React.useRef(onDmReaction)
  onDmReactionRef.current = onDmReaction
  const onOrganizersReactionRef = React.useRef(onOrganizersReaction)
  onOrganizersReactionRef.current = onOrganizersReaction
  const generalEnabledRef = React.useRef(generalEnabled)
  generalEnabledRef.current = generalEnabled
  const organizersEnabledRef = React.useRef(organizersEnabled)
  organizersEnabledRef.current = organizersEnabled
  const wsRef = React.useRef<WebSocket | null>(null)
  const generalSubscribedRef = React.useRef(false)
  const organizersSubscribedRef = React.useRef(false)

  const [connectionState, setConnectionState] =
    React.useState<ChatConnectionState>("connecting")
  const [error, setError] = React.useState<ChatStreamError | null>(null)
  const [reconnectNonce, setReconnectNonce] = React.useState(0)

  const reconnectNow = React.useCallback(() => {
    setReconnectNonce((n) => n + 1)
  }, [])

  const setGeneralSubscription = React.useCallback(
    (enabled: boolean) => {
      const socket = wsRef.current
      if (!socket || socket.readyState !== WebSocket.OPEN || !eventId) return

      const generalTopic = generalChatTopic(eventId)
      if (enabled && !generalSubscribedRef.current) {
        socket.send(JSON.stringify({ type: "subscribe", topic: generalTopic }))
        generalSubscribedRef.current = true
      } else if (!enabled && generalSubscribedRef.current) {
        socket.send(JSON.stringify({ type: "unsubscribe", topic: generalTopic }))
        generalSubscribedRef.current = false
      }
    },
    [eventId]
  )

  React.useEffect(() => {
    setGeneralSubscription(generalEnabled)
  }, [generalEnabled, setGeneralSubscription])

  const setOrganizersSubscription = React.useCallback(
    (enabled: boolean) => {
      const socket = wsRef.current
      if (!socket || socket.readyState !== WebSocket.OPEN || !eventId) return

      const organizersTopic = organizerChatTopic(eventId)
      if (enabled && !organizersSubscribedRef.current) {
        socket.send(JSON.stringify({ type: "subscribe", topic: organizersTopic }))
        organizersSubscribedRef.current = true
      } else if (!enabled && organizersSubscribedRef.current) {
        socket.send(JSON.stringify({ type: "unsubscribe", topic: organizersTopic }))
        organizersSubscribedRef.current = false
      }
    },
    [eventId]
  )

  React.useEffect(() => {
    setOrganizersSubscription(organizersEnabled)
  }, [organizersEnabled, setOrganizersSubscription])

  React.useEffect(() => {
    let closed = false
    let attempt = 0

    const closeSocket = () => {
      const socket = wsRef.current
      if (socket) {
        if (socket.readyState === WebSocket.OPEN && eventId) {
          try {
            socket.send(
              JSON.stringify({
                type: "unsubscribe",
                topic: dmInboxTopic(eventId),
              })
            )
            if (generalSubscribedRef.current) {
              socket.send(
                JSON.stringify({
                  type: "unsubscribe",
                  topic: generalChatTopic(eventId),
                })
              )
            }
            if (organizersSubscribedRef.current) {
              socket.send(
                JSON.stringify({
                  type: "unsubscribe",
                  topic: organizerChatTopic(eventId),
                })
              )
            }
          } catch {
            // ignore send errors during teardown
          }
        }
        socket.close()
        wsRef.current = null
        generalSubscribedRef.current = false
        organizersSubscribedRef.current = false
      }
    }

    if (!eventId || !token) {
      setConnectionState("error")
      setError(null)
      return () => {}
    }

    const generalTopic = generalChatTopic(eventId)
    const dmTopic = dmInboxTopic(eventId)
    const organizersTopic = organizerChatTopic(eventId)

    const run = async () => {
      while (!closed) {
        try {
          setConnectionState(attempt > 0 ? "reconnecting" : "connecting")
          setError(null)
          generalSubscribedRef.current = false
          organizersSubscribedRef.current = false

          const ticketResp = await fetchTicket(eventId)
          if (closed) return

          await new Promise<void>((resolve, reject) => {
            const socket = new WebSocket(buildWsUrl(ticketResp.ticket))
            wsRef.current = socket

            socket.onopen = () => {
              socket.send(JSON.stringify({ type: "subscribe", topic: dmTopic }))
              if (generalEnabledRef.current) {
                socket.send(JSON.stringify({ type: "subscribe", topic: generalTopic }))
                generalSubscribedRef.current = true
              }
              if (organizersEnabledRef.current) {
                socket.send(
                  JSON.stringify({ type: "subscribe", topic: organizersTopic })
                )
                organizersSubscribedRef.current = true
              }
            }

            socket.onmessage = (ev) => {
              try {
                const frame = JSON.parse(ev.data as string) as
                  | ChatMessageEnvelope
                  | ChatMessageDeletedEnvelope
                  | ChatReactionEnvelope
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

                if (frame.type === "chat.message") {
                  const msgFrame = frame as ChatMessageEnvelope
                  if (msgFrame.topic === generalTopic) {
                    onGeneralMessageRef.current?.(msgFrame.data)
                  } else if (msgFrame.topic === dmTopic) {
                    onDmMessageRef.current?.(msgFrame.data)
                  } else if (msgFrame.topic === organizersTopic) {
                    onOrganizersMessageRef.current?.(msgFrame.data)
                  }
                  setError(null)
                  setConnectionState("live")
                  attempt = 0
                } else if (frame.type === "chat.message.deleted") {
                  const deletedFrame = frame as ChatMessageDeletedEnvelope
                  if (deletedFrame.topic === generalTopic) {
                    onGeneralMessageDeletedRef.current?.(deletedFrame.data)
                  } else if (deletedFrame.topic === dmTopic) {
                    onDmMessageDeletedRef.current?.(deletedFrame.data)
                  } else if (deletedFrame.topic === organizersTopic) {
                    onOrganizersMessageDeletedRef.current?.(deletedFrame.data)
                  }
                  setError(null)
                  setConnectionState("live")
                  attempt = 0
                } else if (
                  frame.type === "chat.reaction.added" ||
                  frame.type === "chat.reaction.removed"
                ) {
                  const reactionFrame = frame as ChatReactionEnvelope
                  if (reactionFrame.topic === generalTopic) {
                    onGeneralReactionRef.current?.(reactionFrame)
                  } else if (reactionFrame.topic === dmTopic) {
                    onDmReactionRef.current?.(reactionFrame)
                  } else if (reactionFrame.topic === organizersTopic) {
                    onOrganizersReactionRef.current?.(reactionFrame)
                  }
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
              wsRef.current = null
              generalSubscribedRef.current = false
              organizersSubscribedRef.current = false
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
