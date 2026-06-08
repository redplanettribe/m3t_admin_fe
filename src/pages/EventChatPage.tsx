import * as React from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { EventChatComposer } from "@/components/EventChatComposer"
import { EventChatMessageList } from "@/components/EventChatMessageList"
import { EventDmInboxList } from "@/components/EventDmInboxList"
import { EventDmProfileSearch } from "@/components/EventDmProfileSearch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEventChatStream } from "@/hooks/useEventChatStream"
import { useEventDmConversations } from "@/hooks/useEventDmConversations"
import { useEventDmMessages } from "@/hooks/useEventDmMessages"
import { useEventGeneralChatMessages } from "@/hooks/useEventGeneralChatMessages"
import { useEventPublicProfile } from "@/hooks/useEventPublicProfiles"
import { useSendDmMessage } from "@/hooks/useSendDmMessage"
import { useSendGeneralChatMessage } from "@/hooks/useSendGeneralChatMessage"
import { useEventSchedule } from "@/hooks/useEvents"
import { ApiError } from "@/lib/api"
import {
  connectionDotClass,
  formatConnectionState,
  isForbiddenStreamError,
  isNotRegisteredError,
  MAX_MESSAGE_LENGTH,
  mergeMessages,
  profileDisplayName,
} from "@/lib/chatUtils"
import { dmConversationId } from "@/lib/dmConversationId"
import { queryKeys } from "@/lib/queryKeys"
import { getInitials } from "@/lib/user"
import { cn } from "@/lib/utils"
import { useEventStore } from "@/store/eventStore"
import { useUserStore } from "@/store/userStore"
import type { EventChatMessage } from "@/types/chat"
import type { PublicAttendeeProfile } from "@/types/profile"

type ChatTab = "general" | "messages"

function profileFromLastMessage(
  userId: string,
  msg: EventChatMessage
): PublicAttendeeProfile | null {
  if (msg.sender_user_id === userId) {
    return {
      user_id: userId,
      name: msg.sender_name,
      last_name: msg.sender_last_name,
      profile_picture_url: msg.sender_profile_picture_url,
    }
  }
  return null
}

export function EventChatPage(): React.ReactElement {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { eventId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeEventId = useEventStore((s) => s.activeEventId)
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)
  const currentUserId = useUserStore((s) => s.user?.id)

  const dmParam = searchParams.get("dm")
  const tabParam = searchParams.get("tab")
  const initialTab: ChatTab = tabParam === "messages" || dmParam ? "messages" : "general"

  const [activeTab, setActiveTab] = React.useState<ChatTab>(initialTab)
  const [selectedRecipientId, setSelectedRecipientId] = React.useState<string | null>(
    dmParam
  )
  const [profileCache, setProfileCache] = React.useState<
    Map<string, PublicAttendeeProfile>
  >(() => new Map())

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

  React.useEffect(() => {
    if (dmParam) {
      setSelectedRecipientId(dmParam)
      setActiveTab("messages")
    }
  }, [dmParam])

  const effectiveEventId = eventId ?? activeEventId ?? null
  const { data: schedule } = useEventSchedule(effectiveEventId)

  const {
    messages: restGeneralMessages,
    isLoading: isGeneralLoading,
    isError: isGeneralError,
    error: generalRestError,
    fetchNextPage: fetchNextGeneralPage,
    hasNextPage: hasNextGeneralPage,
    isFetchingNextPage: isFetchingNextGeneralPage,
  } = useEventGeneralChatMessages(effectiveEventId)

  const {
    conversations,
    isLoading: isInboxLoading,
    isError: isInboxError,
    error: inboxRestError,
    fetchNextPage: fetchNextInboxPage,
    hasNextPage: hasNextInboxPage,
    isFetchingNextPage: isFetchingNextInboxPage,
  } = useEventDmConversations(effectiveEventId)

  const {
    messages: restDmMessages,
    isLoading: isDmLoading,
    isError: isDmError,
    error: dmRestError,
    fetchNextPage: fetchNextDmPage,
    hasNextPage: hasNextDmPage,
    isFetchingNextPage: isFetchingNextDmPage,
  } = useEventDmMessages(effectiveEventId, selectedRecipientId)

  const { data: selectedProfileFromApi } = useEventPublicProfile(
    effectiveEventId,
    selectedRecipientId
  )

  const [generalLiveMessages, setGeneralLiveMessages] = React.useState<
    EventChatMessage[]
  >([])
  const [dmLiveMessages, setDmLiveMessages] = React.useState<EventChatMessage[]>([])
  const [generalDraft, setGeneralDraft] = React.useState("")
  const [dmDraft, setDmDraft] = React.useState("")
  const [generalSendError, setGeneralSendError] = React.useState<string | null>(null)
  const [dmSendError, setDmSendError] = React.useState<string | null>(null)
  const [registrationRequired, setRegistrationRequired] = React.useState(false)
  const generalListRef = React.useRef<HTMLDivElement>(null)
  const dmListRef = React.useRef<HTMLDivElement>(null)
  const generalStickToBottomRef = React.useRef(true)
  const dmStickToBottomRef = React.useRef(true)

  const cacheProfile = React.useCallback((profile: PublicAttendeeProfile) => {
    setProfileCache((prev) => {
      const next = new Map(prev)
      next.set(profile.user_id, profile)
      return next
    })
  }, [])

  React.useEffect(() => {
    for (const conv of conversations) {
      const fromMsg = profileFromLastMessage(
        conv.other_user_id,
        conv.last_message
      )
      if (fromMsg) cacheProfile(fromMsg)
    }
  }, [conversations, cacheProfile])

  React.useEffect(() => {
    if (selectedProfileFromApi) {
      cacheProfile(selectedProfileFromApi)
    }
  }, [selectedProfileFromApi, cacheProfile])

  const handleGeneralLiveMessage = React.useCallback((message: EventChatMessage) => {
    setGeneralLiveMessages((prev) => {
      if (prev.some((m) => m.message_id === message.message_id)) return prev
      return [...prev, message]
    })
  }, [])

  const handleDmLiveMessage = React.useCallback(
    (message: EventChatMessage) => {
      if (
        effectiveEventId &&
        currentUserId &&
        selectedRecipientId &&
        message.conversation_id !==
          dmConversationId(effectiveEventId, currentUserId, selectedRecipientId)
      ) {
        return
      }

      setDmLiveMessages((prev) => {
        if (prev.some((m) => m.message_id === message.message_id)) return prev
        return [...prev, message]
      })

      if (message.channel_type === "dm" && effectiveEventId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.events.chatDmConversations(effectiveEventId),
        })
      }
    },
    [currentUserId, effectiveEventId, queryClient, selectedRecipientId]
  )

  const handleInboxDmMessage = React.useCallback(
    (message: EventChatMessage) => {
      if (message.channel_type !== "dm" || !effectiveEventId) return

      if (
        selectedRecipientId &&
        currentUserId &&
        message.conversation_id ===
          dmConversationId(effectiveEventId, currentUserId, selectedRecipientId)
      ) {
        handleDmLiveMessage(message)
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.events.chatDmConversations(effectiveEventId),
      })
    },
    [
      currentUserId,
      effectiveEventId,
      handleDmLiveMessage,
      queryClient,
      selectedRecipientId,
    ]
  )

  const sendGeneralMessage = useSendGeneralChatMessage(effectiveEventId)
  const sendDmMessage = useSendDmMessage(effectiveEventId)

  const { connectionState, error: streamError, reconnectNow } = useEventChatStream({
    eventId: effectiveEventId,
    generalEnabled: activeTab === "general",
    onGeneralMessage: handleGeneralLiveMessage,
    onDmMessage: handleInboxDmMessage,
  })

  const generalMessages = React.useMemo(
    () => mergeMessages(restGeneralMessages, generalLiveMessages),
    [restGeneralMessages, generalLiveMessages]
  )

  const dmMessages = React.useMemo(
    () => mergeMessages(restDmMessages, dmLiveMessages),
    [restDmMessages, dmLiveMessages]
  )

  const prevEventIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    const prev = prevEventIdRef.current
    prevEventIdRef.current = effectiveEventId

    if (prev === null || prev === effectiveEventId) return

    setGeneralLiveMessages([])
    setDmLiveMessages([])
    setGeneralDraft("")
    setDmDraft("")
    setGeneralSendError(null)
    setDmSendError(null)
    setRegistrationRequired(false)
    setSelectedRecipientId(null)
    setProfileCache(new Map())
    generalStickToBottomRef.current = true
    dmStickToBottomRef.current = true
    setSearchParams({}, { replace: true })
  }, [effectiveEventId, setSearchParams])

  React.useEffect(() => {
    setDmLiveMessages([])
    setDmDraft("")
    setDmSendError(null)
    dmStickToBottomRef.current = true
  }, [selectedRecipientId])

  React.useEffect(() => {
    if (!generalStickToBottomRef.current || !generalListRef.current) return
    generalListRef.current.scrollTop = generalListRef.current.scrollHeight
  }, [generalMessages.length])

  React.useEffect(() => {
    if (!dmStickToBottomRef.current || !dmListRef.current) return
    dmListRef.current.scrollTop = dmListRef.current.scrollHeight
  }, [dmMessages.length])

  const handleGeneralListScroll = () => {
    const el = generalListRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    generalStickToBottomRef.current = distanceFromBottom < 80
  }

  const handleDmListScroll = () => {
    const el = dmListRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    dmStickToBottomRef.current = distanceFromBottom < 80
  }


  const isRestError =
    activeTab === "general"
      ? isGeneralError
      : selectedRecipientId
        ? isDmError
        : isInboxError
  const displayRestError =
    activeTab === "general"
      ? generalRestError
      : selectedRecipientId
        ? dmRestError
        : inboxRestError

  const eventName = schedule?.event?.name
  const notRegistered =
    registrationRequired ||
    isNotRegisteredError(generalRestError) ||
    isNotRegisteredError(inboxRestError) ||
    isNotRegisteredError(dmRestError) ||
    isForbiddenStreamError(streamError?.code)

  const trimmedGeneralDraft = generalDraft.trim()
  const canSendGeneral =
    !notRegistered &&
    !!trimmedGeneralDraft &&
    trimmedGeneralDraft.length <= MAX_MESSAGE_LENGTH &&
    !sendGeneralMessage.isPending

  const trimmedDmDraft = dmDraft.trim()
  const canSendDm =
    !notRegistered &&
    !!selectedRecipientId &&
    !!trimmedDmDraft &&
    trimmedDmDraft.length <= MAX_MESSAGE_LENGTH &&
    !sendDmMessage.isPending

  const handleSendGeneral = async () => {
    if (!canSendGeneral) return

    setGeneralSendError(null)
    const clientMsgId = crypto.randomUUID()

    try {
      const message = await sendGeneralMessage.mutateAsync({
        body: generalDraft,
        clientMsgId,
      })
      handleGeneralLiveMessage(message)
      setGeneralDraft("")
      generalStickToBottomRef.current = true
    } catch (e) {
      if (isNotRegisteredError(e)) {
        setRegistrationRequired(true)
        setGeneralSendError(null)
        return
      }
      setGeneralSendError(e instanceof Error ? e.message : "Failed to send message")
    }
  }

  const handleSendDm = async () => {
    if (!canSendDm || !selectedRecipientId) return

    setDmSendError(null)
    const clientMsgId = crypto.randomUUID()

    try {
      const message = await sendDmMessage.mutateAsync({
        recipientUserId: selectedRecipientId,
        body: dmDraft,
        clientMsgId,
      })
      handleDmLiveMessage(message)
      setDmDraft("")
      dmStickToBottomRef.current = true
      if (effectiveEventId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.events.chatDmConversations(effectiveEventId),
        })
      }
    } catch (e) {
      if (isNotRegisteredError(e)) {
        setRegistrationRequired(true)
        setDmSendError(null)
        return
      }
      if (e instanceof ApiError && e.status === 404) {
        setDmSendError("This attendee is not available for messaging")
        return
      }
      setDmSendError(e instanceof Error ? e.message : "Failed to send message")
    }
  }

  const handleGeneralComposerKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSendGeneral()
    }
  }

  const handleDmComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSendDm()
    }
  }

  const openThread = (recipientUserId: string) => {
    setSelectedRecipientId(recipientUserId)
    setActiveTab("messages")
    setSearchParams({ tab: "messages", dm: recipientUserId }, { replace: true })
  }

  const closeThread = () => {
    setSelectedRecipientId(null)
    setSearchParams({ tab: "messages" }, { replace: true })
  }

  const handleTabChange = (value: string) => {
    const tab = value as ChatTab
    setActiveTab(tab)
    if (tab === "general") {
      setSearchParams({}, { replace: true })
    } else if (selectedRecipientId) {
      setSearchParams(
        { tab: "messages", dm: selectedRecipientId },
        { replace: true }
      )
    } else {
      setSearchParams({ tab: "messages" }, { replace: true })
    }
  }

  const handleProfileSelect = (profile: PublicAttendeeProfile) => {
    cacheProfile(profile)
    openThread(profile.user_id)
  }

  const selectedProfile =
    (selectedRecipientId ? profileCache.get(selectedRecipientId) : undefined) ??
    selectedProfileFromApi
  const selectedRecipientName = selectedProfile
    ? profileDisplayName(selectedProfile)
    : "Direct message"

  const showChatPanel = !notRegistered

  return (
    <div className="mx-auto flex h-[min(100dvh-7rem,900px)] max-w-3xl flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">Event Chat</h2>
          {eventName ? (
            <p className="text-muted-foreground truncate text-sm">{eventName}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                connectionDotClass(connectionState)
              )}
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
              You must be registered for this event to view and send messages. Register
              yourself as an attendee, then return to this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/attendees">Go to Attendees</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!notRegistered && isRestError && displayRestError && (
        <Card className="border-destructive/40 shrink-0">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Failed to load chat
              {displayRestError instanceof ApiError && displayRestError.code
                ? ` (${displayRestError.code})`
                : ""}
            </CardTitle>
            <CardDescription className="text-destructive">
              {displayRestError instanceof Error
                ? displayRestError.message
                : "Unknown error"}
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
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="shrink-0 self-start">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent
            value="general"
            className="border-border/60 mt-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background shadow-sm data-[state=inactive]:hidden"
          >
            <div className="border-border/60 shrink-0 border-b px-4 py-2">
              <p className="text-muted-foreground text-sm">General room for all attendees</p>
            </div>
            <EventChatMessageList
              messages={generalMessages}
              currentUserId={currentUserId}
              listRef={generalListRef}
              onScroll={handleGeneralListScroll}
              hasNextPage={!!hasNextGeneralPage}
              isFetchingNextPage={isFetchingNextGeneralPage}
              onLoadOlder={() => fetchNextGeneralPage()}
              isLoading={isGeneralLoading}
              isEmpty={generalMessages.length === 0}
            />
            <EventChatComposer
              draft={generalDraft}
              onDraftChange={(value) => {
                setGeneralDraft(value)
                if (generalSendError) setGeneralSendError(null)
              }}
              onSend={() => void handleSendGeneral()}
              onKeyDown={handleGeneralComposerKeyDown}
              disabled={false}
              isSending={sendGeneralMessage.isPending}
              canSend={canSendGeneral}
              sendError={generalSendError}
            />
          </TabsContent>

          <TabsContent
            value="messages"
            className="border-border/60 mt-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background shadow-sm data-[state=inactive]:hidden"
          >
            {selectedRecipientId ? (
              <>
                <div className="border-border/60 flex shrink-0 items-center gap-2 border-b px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={closeThread}
                    aria-label="Back to inbox"
                  >
                    <ArrowLeft />
                  </Button>
                  <Avatar className="size-8 shrink-0">
                    {selectedProfile?.profile_picture_url ? (
                      <AvatarImage
                        src={selectedProfile.profile_picture_url}
                        alt={selectedRecipientName}
                      />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {getInitials(selectedRecipientName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{selectedRecipientName}</p>
                    {selectedProfile?.headline || selectedProfile?.company ? (
                      <p className="text-muted-foreground truncate text-xs">
                        {[selectedProfile.headline, selectedProfile.company]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>
                <EventChatMessageList
                  messages={dmMessages}
                  currentUserId={currentUserId}
                  listRef={dmListRef}
                  onScroll={handleDmListScroll}
                  hasNextPage={!!hasNextDmPage}
                  isFetchingNextPage={isFetchingNextDmPage}
                  onLoadOlder={() => fetchNextDmPage()}
                  isLoading={isDmLoading}
                  isEmpty={dmMessages.length === 0}
                />
                <EventChatComposer
                  draft={dmDraft}
                  onDraftChange={(value) => {
                    setDmDraft(value)
                    if (dmSendError) setDmSendError(null)
                  }}
                  onSend={() => void handleSendDm()}
                  onKeyDown={handleDmComposerKeyDown}
                  disabled={false}
                  isSending={sendDmMessage.isPending}
                  canSend={canSendDm}
                  sendError={dmSendError}
                  placeholder="Message…"
                />
              </>
            ) : (
              <>
                <div className="border-border/60 flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2">
                  <p className="text-muted-foreground text-sm">Direct messages</p>
                  <EventDmProfileSearch
                    eventId={effectiveEventId}
                    currentUserId={currentUserId}
                    onSelect={handleProfileSelect}
                  />
                </div>
                <EventDmInboxList
                  conversations={conversations}
                  currentUserId={currentUserId}
                  profileByUserId={profileCache}
                  selectedRecipientId={selectedRecipientId}
                  onSelect={openThread}
                  hasNextPage={!!hasNextInboxPage}
                  isFetchingNextPage={isFetchingNextInboxPage}
                  onLoadMore={() => fetchNextInboxPage()}
                  isLoading={isInboxLoading}
                  isEmpty={conversations.length === 0}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
