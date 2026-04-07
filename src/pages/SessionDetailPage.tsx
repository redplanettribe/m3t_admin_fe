import * as React from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ChevronsUpDown, X } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  useEventSchedule,
  useEventTags,
  useAddSessionTag,
  useRemoveSessionTag,
  useUpdateSessionContent,
  useUpdateSessionStatus,
  useToggleSessionAllAttend,
  useAddSessionTier,
  useEventTiers,
  useRemoveSessionTier,
  useSessionById,
  useSessionTiers,
} from "@/hooks/useEvents"
import { useAddSessionSpeaker, useRemoveSessionSpeaker, useSessionSpeakers, useSpeakers } from "@/hooks/useSpeakers"
import { useEventStore } from "@/store/eventStore"
import {
  SESSION_STATUSES,
  type Room,
  type Session,
  type SessionStatus,
  type Speaker,
} from "@/types/event"
import { useReturnNavigation } from "@/hooks/useReturnNavigation"
import { makeNavigateFrom } from "@/lib/returnNavigation"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

function speakerDisplayName(s: Speaker): string {
  return [s.first_name, s.last_name].filter(Boolean).join(" ").trim() || "—"
}

function speakerInitials(s: Speaker): string {
  if (s.first_name && s.last_name) {
    return `${s.first_name[0]}${s.last_name[0]}`.toUpperCase()
  }
  if (s.first_name?.trim()) {
    return s.first_name.slice(0, 2).toUpperCase()
  }
  if (s.last_name?.trim()) {
    return s.last_name.slice(0, 2).toUpperCase()
  }
  return "?"
}

function AddSpeakerCombobox({
  speakers,
  disabled,
  onSelect,
}: {
  speakers: Speaker[]
  disabled?: boolean
  onSelect: (speakerId: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="w-[260px] justify-between font-normal"
          disabled={disabled}
        >
          Add a speaker…
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search speakers…" />
          <CommandList>
            <CommandEmpty>No speakers found.</CommandEmpty>
            <CommandGroup>
              {speakers.map((sp) => {
                const name = speakerDisplayName(sp)
                return (
                  <CommandItem
                    key={sp.id}
                    value={name}
                    onSelect={() => {
                      onSelect(sp.id)
                      setOpen(false)
                    }}
                  >
                    <Avatar size="sm" className="size-5 mr-1">
                      {sp.profile_picture ? (
                        <AvatarImage
                          src={sp.profile_picture}
                          alt={name}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="text-[8px]">
                        {speakerInitials(sp)}
                      </AvatarFallback>
                    </Avatar>
                    {name}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function SessionDetailPage(): React.ReactElement {
  const location = useLocation()
  const { returnPath, returnLabel } = useReturnNavigation("/schedule")
  const speakerNavigateState = makeNavigateFrom(location)
  const { eventId = null, sessionId = null } = useParams<{
    eventId: string
    sessionId: string
  }>()

  const {
    data: schedule,
    isLoading: isScheduleLoading,
    isError: isScheduleError,
  } = useEventSchedule(eventId)
  const {
    data: session,
    isLoading: isSessionLoading,
    isError: isSessionError,
  } = useSessionById(sessionId)
  const { data: eventTags = [] } = useEventTags(eventId)
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)
  const updateContent = useUpdateSessionContent(eventId, sessionId)
  const updateStatus = useUpdateSessionStatus(eventId, sessionId)
  const toggleAllAttend = useToggleSessionAllAttend(eventId, sessionId)
  const addTag = useAddSessionTag(eventId, sessionId)
  const removeTag = useRemoveSessionTag(eventId, sessionId)
  const {
    data: sessionSpeakers = [],
    isLoading: isSpeakersLoading,
    isError: isSpeakersError,
  } = useSessionSpeakers(eventId, sessionId)
  const {
    data: eventSpeakers = [],
    isLoading: isEventSpeakersLoading,
    isError: isEventSpeakersError,
  } = useSpeakers(eventId)
  const removeSpeaker = useRemoveSessionSpeaker(eventId, sessionId)
  const addSpeaker = useAddSessionSpeaker(eventId, sessionId)
  const eventTiers = useEventTiers(eventId)
  const sessionTiers = useSessionTiers(eventId, sessionId)
  const addSessionTier = useAddSessionTier(eventId, sessionId)
  const removeSessionTier = useRemoveSessionTier(eventId, sessionId)
  const [selectedTierId, setSelectedTierId] = React.useState("")

  const [isEditingContent, setIsEditingContent] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState("")
  const [editDescription, setEditDescription] = React.useState("")
  const [isEditingStatus, setIsEditingStatus] = React.useState(false)
  const [editStatus, setEditStatus] = React.useState<SessionStatus>("Scheduled")

  React.useEffect(() => {
    if (eventId) setActiveEventId(eventId)
  }, [eventId, setActiveEventId])

  const startEditingContent = React.useCallback((s: Session) => {
    setEditTitle(s.title ?? "")
    setEditDescription(s.description ?? "")
    setIsEditingContent(true)
  }, [setEditTitle, setEditDescription, setIsEditingContent])

  const cancelEditingContent = React.useCallback(() => {
    setIsEditingContent(false)
  }, [setIsEditingContent])

  const saveContent = React.useCallback(() => {
    updateContent.mutate(
      { title: editTitle || undefined, description: editDescription || undefined },
      {
        onSuccess: () => {
          setIsEditingContent(false)
        },
      }
    )
  }, [editTitle, editDescription, updateContent])

  const startEditingStatus = React.useCallback((s: Session) => {
    setEditStatus(s.status ?? "Scheduled")
    setIsEditingStatus(true)
  }, [])

  const cancelEditingStatus = React.useCallback(() => {
    setIsEditingStatus(false)
  }, [])

  const saveStatus = React.useCallback(() => {
    updateStatus.mutate(
      { status: editStatus },
      {
        onSuccess: () => {
          setIsEditingStatus(false)
        },
      }
    )
  }, [editStatus, updateStatus])

  const event = schedule?.event
  const rooms: Room[] = schedule != null ? schedule.rooms.map((rw) => rw.room) : []
  const room = session ? rooms?.find((r) => r.id === session.room_id) : null

  if (!eventId || !sessionId) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Session</h2>
        <p className="text-muted-foreground">Invalid link.</p>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to={returnPath}>{returnLabel}</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isSessionLoading || isScheduleLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Session</h2>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (isSessionError) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Session</h2>
        <p className="text-muted-foreground text-destructive">Failed to load session.</p>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to={returnPath}>{returnLabel}</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Session</h2>
        <p className="text-muted-foreground">Session not found.</p>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to={returnPath}>{returnLabel}</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isScheduleError || !schedule) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Session</h2>
        <p className="text-muted-foreground text-destructive">Failed to load event.</p>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to={returnPath}>{returnLabel}</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Session date = event start date + (event_day - 1) days; session time = start_time (HH:mm) – end_time
  const sessionDateLabel = (() => {
    const startDate = event?.start_date?.trim()
    if (!startDate || session.event_day == null) return null
    const eventStart = new Date(startDate + "T00:00:00Z")
    if (Number.isNaN(eventStart.getTime())) return null
    const sessionDay = new Date(eventStart)
    sessionDay.setUTCDate(sessionDay.getUTCDate() + (session.event_day - 1))
    const sessionDayStr = sessionDay.toISOString().slice(0, 10)
    const displayDate = new Date(sessionDayStr + "T12:00:00Z")
    return displayDate.toLocaleDateString(undefined, { dateStyle: "medium" })
  })()

  const durationMin = (() => {
    if (session.start_time == null || session.end_time == null) return 0
    const [sh, sm] = session.start_time.split(":").map(Number)
    const [eh, em] = session.end_time.split(":").map(Number)
    return (eh * 60 + (em ?? 0)) - (sh * 60 + (sm ?? 0))
  })()

  const assignedSessionTierIds = new Set(
    (sessionTiers.data ?? []).map((tier) => tier.id)
  )
  const availableSessionTiers = (eventTiers.data ?? []).filter(
    (tier) => !assignedSessionTierIds.has(tier.id)
  )

  const handleAddSessionTier = () => {
    if (!selectedTierId || assignedSessionTierIds.has(selectedTierId)) return
    addSessionTier.mutate(
      { tier_id: selectedTierId },
      {
        onSuccess: () => {
          setSelectedTierId("")
        },
      }
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 text-center sm:text-left">
          <h2 className="text-2xl font-semibold tracking-tight">
            {session.title ?? `Session ${session.id}`}
          </h2>
          <p className="text-sm text-muted-foreground">
            {event?.name}
            {room?.name || session.room_id
              ? ` · ${room?.name ?? session.room_id}`
              : ""}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session details</CardTitle>
          <CardDescription>Time, room, and speakers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Time</dt>
              <dd className="mt-0.5">
                {session.start_time != null && session.end_time != null ? (
                  <>
                    {sessionDateLabel ? `${sessionDateLabel} · ` : ""}
                    {session.start_time} – {session.end_time}
                    {durationMin > 0 && ` (${durationMin} min)`}
                  </>
                ) : (
                  <span className="text-muted-foreground">Not scheduled</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Room</dt>
              <dd className="mt-0.5">
                {room?.name ?? session.room_id ?? (
                  <span className="text-muted-foreground">Not assigned</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1 space-y-2">
                <p className="text-xs text-muted-foreground md:max-w-md">
                  Event managers can set lifecycle status. Only one{" "}
                  <span className="font-medium text-foreground">Live</span> session is
                  allowed per room.
                </p>
                {isEditingStatus ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={editStatus}
                      onValueChange={(v) => setEditStatus(v as SessionStatus)}
                      disabled={updateStatus.isPending}
                    >
                      <SelectTrigger className="w-[180px]" size="sm">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {SESSION_STATUSES.map((st) => (
                          <SelectItem key={st} value={st}>
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveStatus}
                      disabled={updateStatus.isPending}
                    >
                      {updateStatus.isPending ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={cancelEditingStatus}
                      disabled={updateStatus.isPending}
                    >
                      Cancel
                    </Button>
                    {updateStatus.isError ? (
                      <span className="text-xs text-destructive">
                        {updateStatus.error instanceof Error
                          ? updateStatus.error.message
                          : "Failed to update status"}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm">{session.status ?? "—"}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startEditingStatus(session)}
                    >
                      Change status
                    </Button>
                  </div>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">All attendees</dt>
              <dd className="mt-1 space-y-2">
                <p className="text-xs text-muted-foreground md:max-w-md">
                  When enabled, this session appears on all registered attendees' schedules.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!session.all_attend}
                      onCheckedChange={() => toggleAllAttend.mutate()}
                      disabled={toggleAllAttend.isPending}
                      aria-label="Toggle all-attend session"
                    />
                    <span className="text-sm">
                      {toggleAllAttend.isPending
                        ? "Saving…"
                        : session.all_attend
                          ? "Enabled"
                          : "Disabled"}
                    </span>
                  </div>
                  {toggleAllAttend.isError ? (
                    <span className="text-xs text-destructive">
                      {toggleAllAttend.error instanceof Error
                        ? toggleAllAttend.error.message
                        : "Failed to update all-attend"}
                    </span>
                  ) : null}
                </div>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Speakers</dt>
              <dd className="mt-1 space-y-2">
                {isSpeakersLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-8 w-44" />
                  </div>
                ) : isSpeakersError ? (
                  <p className="text-xs text-muted-foreground">
                    Speakers are available to event owners only.
                  </p>
                ) : sessionSpeakers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No speakers assigned.</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {sessionSpeakers.map((sp) => {
                        const name = speakerDisplayName(sp)
                        return (
                          <li
                            key={sp.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar size="sm" className="size-7">
                                {sp.profile_picture ? (
                                  <AvatarImage
                                    src={sp.profile_picture}
                                    alt={name}
                                    className="object-cover"
                                  />
                                ) : null}
                                <AvatarFallback className="text-[10px]">
                                  {speakerInitials(sp)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <Link
                                  to={`/events/${eventId}/speakers/${sp.id}`}
                                  state={speakerNavigateState}
                                  className="text-sm text-primary underline underline-offset-2 hover:no-underline"
                                >
                                  {name}
                                </Link>
                                {sp.tag_line?.trim() ? (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {sp.tag_line.trim()}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Remove ${name} from session`}
                              onClick={() => removeSpeaker.mutate({ speakerId: sp.id })}
                              disabled={removeSpeaker.isPending}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="size-4" />
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                    {removeSpeaker.isError ? (
                      <p className="text-xs text-destructive">
                        {removeSpeaker.error instanceof Error
                          ? removeSpeaker.error.message
                          : "Failed to remove speaker"}
                      </p>
                    ) : null}
                  </>
                )}

                {!isSpeakersLoading && !isSpeakersError ? (
                  <div className="pt-2">
                    {isEventSpeakersLoading ? (
                      <Skeleton className="h-8 w-56" />
                    ) : isEventSpeakersError ? (
                      <p className="text-xs text-muted-foreground">
                        Failed to load event speakers.
                      </p>
                    ) : (() => {
                      const availableToAdd = eventSpeakers.filter(
                        (sp) => !sessionSpeakers.some((ss) => ss.id === sp.id)
                      )
                      if (availableToAdd.length === 0) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            All event speakers are already on this session.
                          </p>
                        )
                      }
                      return (
                        <>
                          <AddSpeakerCombobox
                            speakers={availableToAdd}
                            disabled={addSpeaker.isPending}
                            onSelect={(speakerId) => addSpeaker.mutate({ speakerId })}
                          />
                          {addSpeaker.isError ? (
                            <p className="mt-1 text-xs text-destructive">
                              {addSpeaker.error instanceof Error
                                ? addSpeaker.error.message
                                : "Failed to add speaker"}
                            </p>
                          ) : null}
                        </>
                      )
                    })()}
                  </div>
                ) : null}
              </dd>
            </div>
            {session.tags && session.tags.length > 0 && (
              <div>
                <dt className="font-medium text-muted-foreground">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {session.tags.map((tag) => (
                    <span
                      key={tag.id || tag.name}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      )}
                    >
                      {tag.name}
                      {tag.id && (
                        <button
                          type="button"
                          className="rounded-full hover:bg-muted-foreground/20 p-0.5 -mr-0.5"
                          onClick={() =>
                            removeTag.mutate(
                              { tagId: tag.id },
                              { onError: () => {} }
                            )
                          }
                          disabled={removeTag.isPending}
                          aria-label={`Remove ${tag.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {eventTags.length > 0 && (
              <div>
                <dt className="font-medium text-muted-foreground">
                  {session.tags && session.tags.length > 0 ? "Add tag" : "Tags"}
                </dt>
                <dd className="mt-1">
                  {(() => {
                    const availableToAdd = eventTags.filter(
                      (et) =>
                        !session.tags?.some(
                          (st) => st.id === et.id || st.name === et.name
                        )
                    )
                    if (availableToAdd.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground">
                          All event tags are on this session
                        </p>
                      )
                    }
                    return (
                      <>
                        <Select
                          value=""
                          onValueChange={(tagId) => {
                            if (tagId) addTag.mutate({ tagId })
                          }}
                          disabled={addTag.isPending}
                        >
                          <SelectTrigger className="w-[180px]" size="sm">
                            <SelectValue placeholder="Add a tag…" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableToAdd.map((tag) => (
                              <SelectItem key={tag.id} value={tag.id}>
                                {tag.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {addTag.isError && (
                          <p className="mt-1 text-xs text-destructive">
                            {addTag.error?.message}
                          </p>
                        )}
                      </>
                    )
                  })()}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Allowed tiers</CardTitle>
          <CardDescription>
            Control which event tiers can book and check in for this session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={selectedTierId}
              onValueChange={setSelectedTierId}
              disabled={eventTiers.isLoading || addSessionTier.isPending}
            >
              <SelectTrigger className="w-full sm:max-w-xs">
                <SelectValue placeholder="Select tier to allow" />
              </SelectTrigger>
              <SelectContent>
                {availableSessionTiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    <span className="inline-flex items-center gap-2">
                      {tier.color && (
                        <span
                          className="inline-block h-3.5 w-4 rounded border border-border shrink-0"
                          style={{ backgroundColor: tier.color }}
                          aria-hidden
                        />
                      )}
                      {tier.name || tier.id}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={handleAddSessionTier}
              disabled={
                !selectedTierId ||
                addSessionTier.isPending ||
                eventTiers.isLoading ||
                availableSessionTiers.length === 0
              }
            >
              {addSessionTier.isPending ? "Adding…" : "Allow tier"}
            </Button>
          </div>

          {addSessionTier.isError && (
            <p
              className={cn(
                "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              )}
              role="alert"
            >
              {addSessionTier.error instanceof Error
                ? addSessionTier.error.message
                : "Failed to allow tier"}
            </p>
          )}

          {removeSessionTier.isError && (
            <p
              className={cn(
                "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              )}
              role="alert"
            >
              {removeSessionTier.error instanceof Error
                ? removeSessionTier.error.message
                : "Failed to remove tier"}
            </p>
          )}

          {eventTiers.isLoading || sessionTiers.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading tiers…</p>
          ) : eventTiers.isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">Failed to load event tiers.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => eventTiers.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : sessionTiers.isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                Failed to load allowed tiers for this session.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => sessionTiers.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : (sessionTiers.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tiers are allowed for this session yet.
            </p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Tier</th>
                    <th className="h-10 px-4 text-left font-medium">Color</th>
                    <th className="h-10 px-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(sessionTiers.data ?? []).map((tier) => (
                    <tr key={tier.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{tier.name || tier.id}</td>
                      <td className="px-4 py-3">
                        {tier.color ? (
                          <span
                            className="inline-block h-5 w-8 rounded border border-border"
                            style={{ backgroundColor: tier.color }}
                            title={tier.color}
                            aria-hidden
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            removeSessionTier.isPending &&
                            removeSessionTier.variables?.tierId === tier.id
                          }
                          onClick={() => removeSessionTier.mutate({ tierId: tier.id })}
                        >
                          {removeSessionTier.isPending &&
                          removeSessionTier.variables?.tierId === tier.id
                            ? "Removing…"
                            : "Remove"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
          <div>
            <CardTitle className="text-base">Session content</CardTitle>
            <CardDescription>Title and description. Only the event owner can edit.</CardDescription>
          </div>
          {!isEditingContent ? (
            <Button variant="outline" size="sm" onClick={() => startEditingContent(session)}>
              Edit content
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingContent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-title">Title</Label>
                <Input
                  id="session-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Session title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-description">Description</Label>
                <textarea
                  id="session-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Session description"
                  rows={4}
                  className={cn(
                    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveContent}
                  disabled={updateContent.isPending}
                >
                  {updateContent.isPending ? "Saving…" : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEditingContent}
                  disabled={updateContent.isPending}
                >
                  Cancel
                </Button>
                {updateContent.isError && (
                  <span className="text-sm text-destructive self-center">
                    {updateContent.error?.message}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Title</dt>
                <dd className="mt-0.5">{session.title ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Description</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">
                  {session.description ?? "—"}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
