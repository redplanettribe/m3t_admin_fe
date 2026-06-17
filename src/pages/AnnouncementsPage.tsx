import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useEventAnnouncements,
  useSendEventAnnouncement,
} from "@/hooks/useEventAnnouncements"
import { useEventSchedule } from "@/hooks/useEvents"
import {
  sendAnnouncementSchema,
  type SendAnnouncementFormValues,
} from "@/lib/schemas/announcement"
import { cn } from "@/lib/utils"
import { useEventStore } from "@/store/eventStore"
import type { AnnouncementAction, EventAnnouncement } from "@/types/event"

const DEFAULT_PAGE_SIZE = 20

const ACTION_LABELS: Record<AnnouncementAction, string> = {
  info: "Info only",
  open_event: "Open event",
  open_session: "Open session",
  open_agenda: "Open agenda",
  open_url: "Open URL",
}

function formatDate(value?: string): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString()
}

function truncateText(value: string, maxLength = 80): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}…`
}

function formatActionLabel(announcement: EventAnnouncement): string {
  const base = ACTION_LABELS[announcement.action] ?? announcement.action
  if (announcement.action === "open_session" && announcement.action_payload?.session_id) {
    return `${base} (${announcement.action_payload.session_id.slice(0, 8)}…)`
  }
  if (announcement.action === "open_url" && announcement.action_payload?.url) {
    return `${base}: ${truncateText(announcement.action_payload.url, 40)}`
  }
  return base
}

function buildRequestBody(values: SendAnnouncementFormValues) {
  const action_payload: { session_id?: string; url?: string } = {}
  if (values.action === "open_session" && values.session_id?.trim()) {
    action_payload.session_id = values.session_id.trim()
  }
  if (values.action === "open_url" && values.url?.trim()) {
    action_payload.url = values.url.trim()
  }
  return {
    title: values.title.trim(),
    body: values.body.trim(),
    action: values.action,
    ...(Object.keys(action_payload).length > 0 ? { action_payload } : {}),
  }
}

export function AnnouncementsPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const [page, setPage] = React.useState(1)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingValues, setPendingValues] = React.useState<SendAnnouncementFormValues | null>(
    null
  )
  const [lastSendResult, setLastSendResult] = React.useState<EventAnnouncement | null>(null)

  const { data: schedule } = useEventSchedule(activeEventId)
  const announcements = useEventAnnouncements(activeEventId, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const sendAnnouncement = useSendEventAnnouncement(activeEventId)

  const sessionOptions = React.useMemo(() => {
    const rooms = schedule?.rooms ?? []
    const sessions: { id: string; title: string }[] = []
    for (const room of rooms) {
      for (const session of room.sessions ?? []) {
        sessions.push({
          id: session.id,
          title: session.title?.trim() || session.id,
        })
      }
    }
    return sessions.sort((a, b) => a.title.localeCompare(b.title))
  }, [schedule])

  const form = useForm<SendAnnouncementFormValues>({
    resolver: zodResolver(sendAnnouncementSchema),
    defaultValues: {
      title: "",
      body: "",
      action: "info",
      session_id: "",
      url: "",
    },
  })

  const selectedAction = form.watch("action")

  React.useEffect(() => {
    setPage(1)
    setLastSendResult(null)
  }, [activeEventId])

  const onSubmit = (values: SendAnnouncementFormValues) => {
    setPendingValues(values)
    setConfirmOpen(true)
  }

  const handleConfirmSend = () => {
    if (!pendingValues) return
    setLastSendResult(null)
    sendAnnouncement.mutate(buildRequestBody(pendingValues), {
      onSuccess: (data) => {
        if (data) {
          setLastSendResult(data)
          form.reset({
            title: "",
            body: "",
            action: "info",
            session_id: "",
            url: "",
          })
          setPage(1)
        }
        setConfirmOpen(false)
        setPendingValues(null)
      },
    })
  }

  if (!activeEventId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Announcements</h2>
        <p className="text-muted-foreground">Select an event to send announcements.</p>
      </div>
    )
  }

  const items = announcements.data?.items ?? []
  const pagination = announcements.data?.pagination
  const canGoPrev = page > 1
  const canGoNext = pagination ? page < pagination.total_pages : false

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Announcements</h2>
        <p className="text-muted-foreground">
          Send push notifications to checked-in attendees on the attendee mobile app.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-medium tracking-tight">Send announcement</h3>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-w-xl"
          >
            {sendAnnouncement.isError && !confirmOpen && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {sendAnnouncement.error instanceof Error
                  ? sendAnnouncement.error.message
                  : "Failed to send announcement"}
              </p>
            )}

            {lastSendResult && (
              <div
                className={cn(
                  "rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-800 dark:text-green-200"
                )}
                role="status"
              >
                Announcement sent to {lastSendResult.recipient_count ?? 0} checked-in attendee
                {(lastSendResult.recipient_count ?? 0) !== 1 ? "s" : ""}
                {lastSendResult.push_sent_count != null && (
                  <> ({lastSendResult.push_sent_count} push delivered)</>
                )}
                .
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Announcement title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <textarea
                      className={cn(
                        "flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                      placeholder="Message shown in the push notification"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tap action</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(ACTION_LABELS) as AnnouncementAction[]).map((action) => (
                        <SelectItem key={action} value={action}>
                          {ACTION_LABELS[action]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedAction === "open_session" && (
              <FormField
                control={form.control}
                name="session_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sessionOptions.length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            No sessions available
                          </SelectItem>
                        ) : (
                          sessionOptions.map((session) => (
                            <SelectItem key={session.id} value={session.id}>
                              {session.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedAction === "open_url" && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={sendAnnouncement.isPending}>
              Send announcement
            </Button>
          </form>
        </Form>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium tracking-tight">Announcement history</h3>

        {announcements.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : announcements.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">Failed to load announcements.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => announcements.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium whitespace-nowrap">Sent</th>
                    <th className="h-10 px-4 text-left font-medium">Title</th>
                    <th className="h-10 px-4 text-left font-medium">Body</th>
                    <th className="h-10 px-4 text-left font-medium">Action</th>
                    <th className="h-10 px-4 text-left font-medium whitespace-nowrap">
                      Recipients
                    </th>
                    <th className="h-10 px-4 text-left font-medium whitespace-nowrap">
                      Push delivered
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-16 px-4 text-center text-muted-foreground">
                        No announcements sent yet.
                      </td>
                    </tr>
                  ) : (
                    items.map((announcement) => (
                      <tr key={announcement.id} className="border-b last:border-0">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDate(announcement.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium">{announcement.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {truncateText(announcement.body)}
                        </td>
                        <td className="px-4 py-3">{formatActionLabel(announcement)}</td>
                        <td className="px-4 py-3">{announcement.recipient_count ?? "-"}</td>
                        <td className="px-4 py-3">{announcement.push_sent_count ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {pagination
                  ? `Page ${pagination.page} of ${pagination.total_pages} (${pagination.total} total)`
                  : "Page 1"}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={!canGoPrev || announcements.isFetching}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!canGoNext || announcements.isFetching}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <Dialog open={confirmOpen} onOpenChange={(open) => !open && setConfirmOpen(false)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Send announcement?</DialogTitle>
            <DialogDescription>
              This will send a push notification to all checked-in attendees on the attendee
              mobile app. The announcement will be saved even if some pushes fail to deliver.
            </DialogDescription>
          </DialogHeader>
          {sendAnnouncement.isError && (
            <p
              className={cn(
                "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              )}
              role="alert"
            >
              {sendAnnouncement.error instanceof Error
                ? sendAnnouncement.error.message
                : "Failed to send announcement"}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false)
                setPendingValues(null)
              }}
              disabled={sendAnnouncement.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSend}
              disabled={sendAnnouncement.isPending}
            >
              {sendAnnouncement.isPending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
