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
import { Skeleton } from "@/components/ui/skeleton"
import { useEventPublicProfile } from "@/hooks/useEventPublicProfiles"
import { useReturnNavigation } from "@/hooks/useReturnNavigation"
import { ApiError } from "@/lib/api"
import { isNotRegisteredError, profileDisplayName } from "@/lib/chatUtils"
import type { AttendeeProfileNavigateState } from "@/lib/returnNavigation"
import { getInitials } from "@/lib/user"
import { useEventStore } from "@/store/eventStore"
import type { PublicAttendeeProfile } from "@/types/profile"

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

export function EventAttendeeProfilePage(): React.ReactElement {
  const location = useLocation()
  const { eventId = null, userId = null } = useParams<{
    eventId: string
    userId: string
  }>()
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)
  const fallbackPath = eventId ? `/events/${eventId}/chat` : "/chat"
  const { returnPath, returnLabel } = useReturnNavigation(fallbackPath)

  const navState = location.state as AttendeeProfileNavigateState | null
  const fallbackProfile = navState?.fallbackProfile

  const { data: profile, isLoading, isError, error } = useEventPublicProfile(
    eventId,
    userId
  )

  React.useEffect(() => {
    if (eventId) setActiveEventId(eventId)
  }, [eventId, setActiveEventId])

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
      <div className="max-w-2xl space-y-6">
        <Button asChild variant="outline" size="sm">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
        <ProfileContent profile={fallbackProfile} isPrivate />
      </div>
    )
  }

  if (isPrivateProfile) {
    return (
      <div className="max-w-2xl space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
        <h2 className="text-2xl font-semibold tracking-tight">Attendee profile</h2>
        <p className="text-muted-foreground">
          This attendee&apos;s profile is not available.
        </p>
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="max-w-2xl space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
        <h2 className="text-2xl font-semibold tracking-tight">Attendee profile</h2>
        <p className="text-destructive text-muted-foreground">
          {error instanceof Error ? error.message : "Failed to load profile."}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link to={returnPath}>{returnLabel}</Link>
      </Button>
      <ProfileContent profile={profile as PublicAttendeeProfile} />
    </div>
  )
}
