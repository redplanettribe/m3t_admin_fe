import * as React from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { RefreshCw } from "lucide-react"
import { EventChatComposer } from "@/components/EventChatComposer"
import { EventChatMessageList } from "@/components/EventChatMessageList"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEventGeneralChatMessages } from "@/hooks/useEventGeneralChatMessages"
import { useEventGeneralChatStream } from "@/hooks/useEventGeneralChatStream"
import { useSendGeneralChatMessage } from "@/hooks/useSendGeneralChatMessage"
import { useEventSchedule } from "@/hooks/useEvents"
import { cn } from "@/lib/utils"
import { useEventStore } from "@/store/eventStore"
import { useUserStore } from "@/store/userStore"
import type { ChatConnectionState, EventChatMessage } from "@/types/chat"
import { ApiError } from "@/lib/api"

const MAX_MESSAGE_LENGTH = 2000

function formatConnectionState(state: ChatConnectionState) {
  if (state === "connecting") return "Connecting"
  if (state === "reconnecting") return "Reconnecting"
  if (state === "live") return "Live"
  return "Error"
}

function connectionDotClass(state: ChatConnectionState) {
  if (state === "live") return "bg-green-500"
  if (state === "error") return "bg-destructive"
  return "bg-amber-500"
}

function isNotRegisteredError(error: unknown) {
  if (!(error instanceof ApiError)) return false
  return error.status === 403 && error.code === "not_registered_for_event"
}

function isForbiddenStreamError(code?: string) {
  return code === "forbidden" || code === "not_registered_for_event"
}

function mergeMessages(
  restMessages: EventChatMessage[],
  liveMessages: EventChatMessage[]
): EventChatMessage[] {
  const byId = new Map<string, EventChatMessage>()
  for (const msg of restMessages) {
    byId.set(msg.message_id, msg)
  }
  for (const msg of liveMessages) {
    byId.set(msg.message_id, msg)
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

export function EventChatPage(): React.ReactElement {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const activeEventId = useEventStore((s) => s.activeEventId)
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)
  const currentUserId = useUserStore((s) => s.user?.id)

  React.useEffect(() => {
    if (eventId && !activeEventId) {
      setActiveEventId(eventId)
    }
  }, [activeEventId, eventId, setActiveEventId])

  React.useEffect(() => {
    if (activeEventId && eventId && activeEventId !== eventId) {
      navigate(`/events/${activeEventId}/chat`, { replace: true })
    }
  }, [activeEventId, eventId, navigate])

  const effectiveEventId = eventId ?? activeEventId ?? null
  const { data: schedule } = useEventSchedule(effectiveEventId)
  const {
    messages: restMessages,
    isLoading,
    isError,
    error: restError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEventGeneralChatMessages(effectiveEventId)

  const [liveMessages, setLiveMessages] = React.useState<EventChatMessage[]>([])
  const [draft, setDraft] = React.useState("")
  const [sendError, setSendError] = React.useState<string | null>(null)
  const [registrationRequired, setRegistrationRequired] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement>(null)
  const stickToBottomRef = React.useRef(true)

  const handleLiveMessage = React.useCallback((message: EventChatMessage) => {
    setLiveMessages((prev) => {
      if (prev.some((m) => m.message_id === message.message_id)) return prev
      return [...prev, message]
    })
  }, [])

  const sendMessage = useSendGeneralChatMessage(effectiveEventId)

  const { connectionState, error: streamError, reconnectNow } =
    useEventGeneralChatStream({
      eventId: effectiveEventId,
      onMessage: handleLiveMessage,
    })

  const messages = React.useMemo(
    () => mergeMessages(restMessages, liveMessages),
    [restMessages, liveMessages]
  )

  React.useEffect(() => {
    setLiveMessages([])
    setDraft("")
    setSendError(null)
    setRegistrationRequired(false)
    stickToBottomRef.current = true
  }, [effectiveEventId])

  React.useEffect(() => {
    if (!stickToBottomRef.current || !listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages.length])

  const handleListScroll = () => {
    const el = listRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceFromBottom < 80
  }

  const eventName = schedule?.event?.name
  const notRegistered =
    registrationRequired ||
    isNotRegisteredError(restError) ||
    isForbiddenStreamError(streamError?.code)

  const trimmedDraft = draft.trim()
  const canSend =
    !notRegistered &&
    !!trimmedDraft &&
    trimmedDraft.length <= MAX_MESSAGE_LENGTH &&
    !sendMessage.isPending

  const handleSend = async () => {
    if (!canSend) return

    setSendError(null)
    const clientMsgId = crypto.randomUUID()

    try {
      const message = await sendMessage.mutateAsync({
        body: draft,
        clientMsgId,
      })
      handleLiveMessage(message)
      setDraft("")
      stickToBottomRef.current = true
    } catch (e) {
      if (isNotRegisteredError(e)) {
        setRegistrationRequired(true)
        setSendError(null)
        return
      }
      setSendError(e instanceof Error ? e.message : "Failed to send message")
    }
  }

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const showChatPanel = !notRegistered

  return (
    <div className="mx-auto flex h-[min(100dvh-7rem,900px)] max-w-3xl flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">General Chat</h2>
          {eventName ? (
            <p className="text-muted-foreground truncate text-sm">{eventName}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span
              className={cn("size-2 shrink-0 rounded-full", connectionDotClass(connectionState))}
              aria-hidden
            />
            <span>{formatConnectionState(connectionState)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={reconnectNow}
            aria-label="Reconnect"
          >
            <RefreshCw />
          </Button>
        </div>
      </div>

      {notRegistered && (
        <Card className="border-destructive/40 shrink-0">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Registration required
            </CardTitle>
            <CardDescription>
              You must be registered for this event to view and send messages in general
              chat. Register yourself as an attendee, then return to this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/attendees">Go to Attendees</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!notRegistered && isError && restError && (
        <Card className="border-destructive/40 shrink-0">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Failed to load chat history
              {restError instanceof ApiError && restError.code
                ? ` (${restError.code})`
                : ""}
            </CardTitle>
            <CardDescription className="text-destructive">
              {restError instanceof Error ? restError.message : "Unknown error"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!notRegistered && streamError && !isForbiddenStreamError(streamError.code) && (
        <Card className="border-destructive/40 shrink-0">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Stream error{streamError.code ? ` (${streamError.code})` : ""}
            </CardTitle>
            <CardDescription className="text-destructive">
              {streamError.message}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {showChatPanel && (
        <div className="border-border/60 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
          <EventChatMessageList
            messages={messages}
            currentUserId={currentUserId}
            listRef={listRef}
            onScroll={handleListScroll}
            hasNextPage={!!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadOlder={() => fetchNextPage()}
            isLoading={isLoading}
            isEmpty={messages.length === 0}
          />
          <EventChatComposer
            draft={draft}
            onDraftChange={(value) => {
              setDraft(value)
              if (sendError) setSendError(null)
            }}
            onSend={() => void handleSend()}
            onKeyDown={handleComposerKeyDown}
            disabled={false}
            isSending={sendMessage.isPending}
            canSend={canSend}
            sendError={sendError}
          />
        </div>
      )}
    </div>
  )
}
