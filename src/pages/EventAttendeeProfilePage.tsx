import * as React from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useEventSchedule } from "@/hooks/useEvents"
import {
  useBanChatUser,
  useEventChatBans,
  useUnbanChatUser,
} from "@/hooks/useEventChatBans"
import { useEventPublicProfile } from "@/hooks/useEventPublicProfiles"
import { useReturnNavigation } from "@/hooks/useReturnNavigation"
import { useTeamMembers } from "@/hooks/useTeamMembers"
import { ApiError } from "@/lib/api"
import { isNotRegisteredError, profileDisplayName } from "@/lib/chatUtils"
import type { AttendeeProfileNavigateState } from "@/lib/returnNavigation"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/user"
import { useEventStore } from "@/store/eventStore"
import { useUserStore } from "@/store/userStore"
import type { PublicAttendeeProfile } from "@/types/profile"

function formatBanDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

function ProfileTagList({
  label,
  items,
}: {
  label: string
  items: string[] | undefined
}): React.ReactElement | null {
  if (!items?.length) return null
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="bg-muted text-muted-foreground inline-flex rounded-full px-2.5 py-0.5 text-xs"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProfileContent({
  profile,
  isPrivate,
}: {
  profile: {
    name?: string
    last_name?: string
    profile_picture_url?: string
    headline?: string
    company?: string
    linkedin_url?: string
    web_page_url?: string
    topics_of_interest?: string[]
    intent_seeking?: string[]
    intent_offering?: string[]
  }
  isPrivate?: boolean
}): React.ReactElement {
  const name = profileDisplayName(profile)
  const subtitle = [profile.headline, profile.company].filter(Boolean).join(" · ")

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <Avatar className="size-20 shrink-0 data-[size=lg]:size-24" size="lg">
            {profile.profile_picture_url ? (
              <AvatarImage
                src={profile.profile_picture_url}
                alt={name}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="text-lg">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-2xl">{name}</CardTitle>
            {subtitle ? (
              <CardDescription className="text-base">{subtitle}</CardDescription>
            ) : null}
            {isPrivate ? (
              <p className="text-muted-foreground pt-1 text-sm">
                This attendee has not made their networking profile public.
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      {!isPrivate && (
        <CardContent className="space-y-6">
          {(profile.linkedin_url || profile.web_page_url) && (
            <div className="flex flex-wrap gap-3">
              {profile.linkedin_url ? (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                >
                  LinkedIn
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
              {profile.web_page_url ? (
                <a
                  href={profile.web_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                >
                  Website
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          )}
          <ProfileTagList label="Topics of interest" items={profile.topics_of_interest} />
          <ProfileTagList label="Seeking" items={profile.intent_seeking} />
          <ProfileTagList label="Offering" items={profile.intent_offering} />
        </CardContent>
      )}
    </Card>
  )
}

type ChatModerationCardProps = {
  eventId: string
  userId: string
  attendeeName: string
}

function ChatModerationCard({
  eventId,
  userId,
  attendeeName,
}: ChatModerationCardProps): React.ReactElement {
  const { data: bansList } = useEventChatBans(eventId, { enabled: true })
  const banChatUser = useBanChatUser(eventId)
  const unbanChatUser = useUnbanChatUser(eventId)

  const [banDialogOpen, setBanDialogOpen] = React.useState(false)
  const [unbanDialogOpen, setUnbanDialogOpen] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  const existingBan = React.useMemo(
    () => bansList?.items.find((ban) => ban.user_id === userId),
    [bansList?.items, userId]
  )

  const isPending = banChatUser.isPending || unbanChatUser.isPending

  const closeBanDialog = () => {
    setBanDialogOpen(false)
    setActionError(null)
    banChatUser.reset()
  }

  const closeUnbanDialog = () => {
    setUnbanDialogOpen(false)
    setActionError(null)
    unbanChatUser.reset()
  }

  const handleBanConfirm = () => {
    setActionError(null)
    banChatUser.mutate(
      { userId },
      {
        onSuccess: () => closeBanDialog(),
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : "Failed to ban user")
        },
      }
    )
  }

  const handleUnbanConfirm = () => {
    setActionError(null)
    unbanChatUser.mutate(
      { userId },
      {
        onSuccess: () => closeUnbanDialog(),
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : "Failed to unban user")
        },
      }
    )
  }

  return (
    <>
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base">Chat moderation</CardTitle>
          <CardDescription>
            Manage this attendee&apos;s access to event chat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingBan ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-destructive/10 text-destructive inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium">
                  Banned from chat
                </span>
                <span className="text-muted-foreground text-sm">
                  Since {formatBanDate(existingBan.banned_at)}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUnbanDialogOpen(true)}
              >
                Unban from chat
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setBanDialogOpen(true)}
            >
              Ban from chat
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={banDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeBanDialog()
          else setBanDialogOpen(true)
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Ban from chat</DialogTitle>
            <DialogDescription>
              Ban {attendeeName} from event chat? They will not be able to send messages,
              and their profile will be hidden from public attendee lists.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionError && banDialogOpen && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {actionError}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeBanDialog}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleBanConfirm}
                disabled={isPending}
              >
                {banChatUser.isPending ? "Banning…" : "Ban"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unbanDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeUnbanDialog()
          else setUnbanDialogOpen(true)
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Unban from chat</DialogTitle>
            <DialogDescription>
              Restore {attendeeName}&apos;s access to event chat and public profile
              visibility?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionError && unbanDialogOpen && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {actionError}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeUnbanDialog}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleUnbanConfirm} disabled={isPending}>
                {unbanChatUser.isPending ? "Unbanning…" : "Unban"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

type ProfilePageLayoutProps = {
  returnPath: string
  returnLabel: string
  children: React.ReactNode
  moderation?: React.ReactNode
}

function ProfilePageLayout({
  returnPath,
  returnLabel,
  children,
  moderation,
}: ProfilePageLayoutProps): React.ReactElement {
  return (
    <div className="max-w-2xl space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link to={returnPath}>{returnLabel}</Link>
      </Button>
      {children}
      {moderation}
    </div>
  )
}

export function EventAttendeeProfilePage(): React.ReactElement {
  const location = useLocation()
  const { eventId = null, userId = null } = useParams<{
    eventId: string
    userId: string
  }>()
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)
  const currentUserId = useUserStore((s) => s.user?.id)
  const fallbackPath = eventId ? `/events/${eventId}/chat` : "/chat"
  const { returnPath, returnLabel } = useReturnNavigation(fallbackPath)

  const navState = location.state as AttendeeProfileNavigateState | null
  const fallbackProfile = navState?.fallbackProfile

  const { data: schedule } = useEventSchedule(eventId)
  const { data: teamMembers = [] } = useTeamMembers(eventId)

  const { data: profile, isLoading, isError, error } = useEventPublicProfile(
    eventId,
    userId
  )

  const canModerate = React.useMemo(() => {
    if (!currentUserId || !eventId || !userId) return false
    if (currentUserId === userId) return false
    if (schedule?.event?.owner_id === currentUserId) return true
    return teamMembers.some((member) => member.user_id === currentUserId)
  }, [currentUserId, eventId, userId, schedule?.event?.owner_id, teamMembers])

  React.useEffect(() => {
    if (eventId) setActiveEventId(eventId)
  }, [eventId, setActiveEventId])

  const attendeeName = React.useMemo(() => {
    if (profile) return profileDisplayName(profile)
    if (fallbackProfile) return profileDisplayName(fallbackProfile)
    return "this attendee"
  }, [profile, fallbackProfile])

  const moderationCard =
    canModerate && eventId && userId ? (
      <ChatModerationCard
        eventId={eventId}
        userId={userId}
        attendeeName={attendeeName}
      />
    ) : null

  if (!eventId || !userId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Attendee profile</h2>
        <p className="text-muted-foreground">Invalid link.</p>
        <Button asChild variant="outline">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Button asChild variant="outline" size="sm">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
        <div className="space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (isNotRegisteredError(error)) {
    return (
      <div className="max-w-2xl space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Registration required
            </CardTitle>
            <CardDescription>
              You must be registered for this event to view attendee profiles. Register
              yourself as an attendee, then return to this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/attendees">Go to Attendees</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPrivateProfile =
    isError && error instanceof ApiError && error.status === 404

  if (isPrivateProfile && fallbackProfile) {
    return (
      <ProfilePageLayout
        returnPath={returnPath}
        returnLabel={returnLabel}
        moderation={moderationCard}
      >
        <ProfileContent profile={fallbackProfile} isPrivate />
      </ProfilePageLayout>
    )
  }

  if (isPrivateProfile) {
    return (
      <ProfilePageLayout
        returnPath={returnPath}
        returnLabel={returnLabel}
        moderation={moderationCard}
      >
        <h2 className="text-2xl font-semibold tracking-tight">Attendee profile</h2>
        <p className="text-muted-foreground">
          This attendee&apos;s profile is not available.
        </p>
      </ProfilePageLayout>
    )
  }

  if (isError || !profile) {
    return (
      <ProfilePageLayout returnPath={returnPath} returnLabel={returnLabel}>
        <h2 className="text-2xl font-semibold tracking-tight">Attendee profile</h2>
        <p className="text-destructive text-muted-foreground">
          {error instanceof Error ? error.message : "Failed to load profile."}
        </p>
      </ProfilePageLayout>
    )
  }

  return (
    <ProfilePageLayout
      returnPath={returnPath}
      returnLabel={returnLabel}
      moderation={moderationCard}
    >
      <ProfileContent profile={profile as PublicAttendeeProfile} />
    </ProfilePageLayout>
  )
}
