import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation, useParams } from "react-router-dom"
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
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useSpeaker, useUpdateSpeaker } from "@/hooks/useSpeakers"
import {
  createSpeakerSchema,
  type CreateSpeakerFormValues,
} from "@/lib/schemas/event"
import { useEventStore } from "@/store/eventStore"
import type { Speaker, UpdateSpeakerRequest } from "@/types/event"
import { useReturnNavigation } from "@/hooks/useReturnNavigation"
import { makeNavigateFrom } from "@/lib/returnNavigation"
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

function formValuesFromSpeaker(speaker: Speaker): CreateSpeakerFormValues {
  return {
    first_name: speaker.first_name ?? "",
    last_name: speaker.last_name ?? "",
    bio: speaker.bio ?? "",
    tag_line: speaker.tag_line ?? "",
    phone_number: speaker.phone_number ?? "",
    profile_picture: speaker.profile_picture ?? "",
    is_top_speaker: speaker.is_top_speaker ?? false,
  }
}

function toUpdateSpeakerRequest(values: CreateSpeakerFormValues): UpdateSpeakerRequest {
  const req: UpdateSpeakerRequest = {}
  req.first_name = values.first_name?.trim() || ""
  req.last_name = values.last_name?.trim() || ""
  req.bio = values.bio?.trim() || ""
  req.tag_line = values.tag_line?.trim() || ""
  req.phone_number = values.phone_number?.trim() || ""
  req.profile_picture = values.profile_picture?.trim() || ""
  req.is_top_speaker = values.is_top_speaker ?? false
  return req
}

export function SpeakerDetailPage(): React.ReactElement {
  const location = useLocation()
  const sessionNavigateState = makeNavigateFrom(location)
  const { returnPath, returnLabel } = useReturnNavigation("/speakers")
  const { eventId = null, speakerId = null } = useParams<{
    eventId: string
    speakerId: string
  }>()
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)
  const { data, isLoading, isError } = useSpeaker(eventId, speakerId)
  const updateSpeaker = useUpdateSpeaker(eventId, speakerId)
  const form = useForm<CreateSpeakerFormValues>({
    resolver: zodResolver(createSpeakerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      bio: "",
      tag_line: "",
      phone_number: "",
      profile_picture: "",
      is_top_speaker: false,
    },
  })

  React.useEffect(() => {
    if (eventId) setActiveEventId(eventId)
  }, [eventId, setActiveEventId])

  React.useEffect(() => {
    if (!data?.speaker) return
    form.reset(formValuesFromSpeaker(data.speaker))
  }, [data?.speaker, form])

  if (!eventId || !speakerId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Speaker</h2>
        <p className="text-muted-foreground">Invalid link.</p>
        <Button asChild variant="outline">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
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

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to={returnPath}>{returnLabel}</Link>
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

  const onSubmit = (values: CreateSpeakerFormValues) => {
    updateSpeaker.mutate(toUpdateSpeakerRequest(values))
  }

  const onCancel = () => {
    form.reset(formValuesFromSpeaker(speaker))
    updateSpeaker.reset()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to={returnPath}>{returnLabel}</Link>
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {updateSpeaker.isError && (
                <p
                  className={cn(
                    "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  )}
                  role="alert"
                >
                  {updateSpeaker.error instanceof Error
                    ? updateSpeaker.error.message
                    : "Failed to update speaker"}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="tag_line"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag line</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Senior Engineer at Acme"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555 555 5555" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Short bio..."
                        rows={3}
                        className={cn(
                          "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
                          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                          "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profile_picture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile picture URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_top_speaker"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Top speaker</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark this speaker as a top / featured speaker
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={updateSpeaker.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateSpeaker.isPending}>
                  {updateSpeaker.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>

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
                      state={sessionNavigateState}
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
