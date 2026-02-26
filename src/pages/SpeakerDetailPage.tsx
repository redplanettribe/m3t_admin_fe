import * as React from "react"
import { Link, useParams } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSpeaker } from "@/hooks/useSpeakers"
import { useEventStore } from "@/store/eventStore"
import type { Speaker } from "@/types/event"
import { cn } from "@/lib/utils"

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

export function SpeakerDetailPage(): React.ReactElement {
  const { eventId = null, speakerId = null } = useParams<{
    eventId: string
    speakerId: string
  }>()
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)
  const { data, isLoading, isError } = useSpeaker(eventId, speakerId)

  React.useEffect(() => {
    if (eventId) setActiveEventId(eventId)
  }, [eventId, setActiveEventId])

  if (!eventId || !speakerId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Speaker</h2>
        <p className="text-muted-foreground">Invalid link.</p>
        <Button asChild variant="outline">
          <Link to="/speakers">Back to speakers</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline" size="sm">
          <Link to="/speakers">Back to speakers</Link>
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

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/speakers">Back to speakers</Link>
        </Button>
        <h2 className="text-2xl font-semibold tracking-tight">Speaker</h2>
        <p className="text-muted-foreground text-destructive">
          Failed to load speaker.
        </p>
      </div>
    )
  }

  const { speaker, sessions } = data
  const name = speakerDisplayName(speaker)
  const initials = speakerInitials(speaker)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/speakers">Back to speakers</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <Avatar className="size-20 shrink-0 data-[size=lg]:size-24" size="lg">
              {speaker.profile_picture ? (
                <AvatarImage
                  src={speaker.profile_picture}
                  alt={name}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-2xl">{name}</CardTitle>
              {speaker.tag_line ? (
                <CardDescription className="text-base">
                  {speaker.tag_line}
                </CardDescription>
              ) : null}
              {speaker.is_top_speaker && (
                <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Top speaker
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {speaker.bio ? (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Bio
              </h3>
              <p className="whitespace-pre-wrap text-sm">{speaker.bio}</p>
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Sessions
            </h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sessions assigned.
              </p>
            ) : (
              <ul className="space-y-2">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <Link
                      to={`/events/${eventId}/sessions/${session.id}`}
                      className={cn(
                        "text-sm text-primary underline underline-offset-2 hover:no-underline"
                      )}
                    >
                      {session.title ?? `Session ${session.id}`}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
