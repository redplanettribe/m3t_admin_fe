import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  sendInvitationsSchema,
  type SendInvitationsFormValues,
} from "@/lib/schemas/event"
import {
  useEventInvitations,
  useEventRegistrations,
  useSendEventInvitations,
  useCheckInAttendee,
  useEventTiers,
  useAssignTierUsers,
} from "@/hooks/useEvents"
import { useEventStore } from "@/store/eventStore"
import { cn } from "@/lib/utils"

/** Normalize raw input: split on commas/whitespace, filter empty, dedupe, rejoin for API */
function normalizeEmailsString(raw: string): string {
  const tokens = raw
    .trim()
    .split(/[\s,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const unique = [...new Set(tokens)]
  return unique.join(", ")
}

export function AttendeesPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const ALL_TIERS_VALUE = "__all__"
  const [invitesPage, setInvitesPage] = React.useState(1)
  const [invitesPageSize] = React.useState(20)
  const [invitesSearch, setInvitesSearch] = React.useState("")
  const [registrationsPage, setRegistrationsPage] = React.useState(1)
  const [registrationsPageSize] = React.useState(20)
  const [registrationsSearch, setRegistrationsSearch] = React.useState("")
  const [registrationsTierId, setRegistrationsTierId] = React.useState<string>("")

  const queryClient = useQueryClient()
  const tiers = useEventTiers(activeEventId)
  const assignTierUsers = useAssignTierUsers(activeEventId)

  const invitations = useEventInvitations(activeEventId, {
    page: invitesPage,
    pageSize: invitesPageSize,
    search: invitesSearch,
  })
  const registrations = useEventRegistrations(activeEventId, {
    page: registrationsPage,
    pageSize: registrationsPageSize,
    search: registrationsSearch,
    tierId: registrationsTierId,
  })
  const sendInvitations = useSendEventInvitations(activeEventId)
  const checkInAttendee = useCheckInAttendee(activeEventId)
  const [lastResult, setLastResult] = React.useState<{
    queued: number
    rejected: string[]
  } | null>(null)

  const form = useForm<SendInvitationsFormValues>({
    resolver: zodResolver(sendInvitationsSchema),
    defaultValues: { emails: "" },
  })

  const onSubmit = (values: SendInvitationsFormValues) => {
    setLastResult(null)
    const emails = normalizeEmailsString(values.emails)
    sendInvitations.mutate(
      { emails },
      {
        onSuccess: (data) => {
          if (data) {
            setLastResult({
              queued: data.queued,
              rejected: data.rejected ?? [],
            })
            form.reset({ emails: "" })
          }
        },
      }
    )
  }

  if (!activeEventId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Attendees</h2>
        <p className="text-muted-foreground">
          Select an event to send invitations.
        </p>
      </div>
    )
  }

  const isPending = sendInvitations.isPending

  const handleInvitesSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvitesSearch(e.target.value)
    setInvitesPage(1)
  }

  const handleRegistrationsSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegistrationsSearch(e.target.value)
    setRegistrationsPage(1)
  }

  const handleRegistrationsTierChange = (tierId: string) => {
    setRegistrationsTierId(tierId === ALL_TIERS_VALUE ? "" : tierId)
    setRegistrationsPage(1)
  }

  const invitesPagination = invitations.data?.pagination
  const inviteItems = invitations.data?.items ?? []
  const registrationsPagination = registrations.data?.pagination
  const registrationItems = registrations.data?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Attendees</h2>
        <p className="text-muted-foreground">
          Send invitations and view registered attendees for this event.
        </p>
      </div>

      <Tabs defaultValue="invitations" className="space-y-4">
        <TabsList
          variant="line"
          className="w-full border-b bg-transparent px-0"
        >
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="registered">Registered</TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-6">
          {/* Invited emails list - above the form */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium tracking-tight">Invited emails</h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Input
                type="search"
                placeholder="Search by email…"
                value={invitesSearch}
                onChange={handleInvitesSearchChange}
                className="max-w-xs"
                aria-label="Search invited emails"
              />
            </div>

            {invitations.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : invitations.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">Failed to load invited emails.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => invitations.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Email</th>
                      <th className="h-10 px-4 text-left font-medium">Status</th>
                      <th className="h-10 px-4 text-left font-medium">Enqueued at</th>
                      <th className="h-10 px-4 text-left font-medium">Delivered at</th>
                      <th className="h-10 px-4 text-left font-medium">Last error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inviteItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          {invitesSearch.trim()
                            ? "No matching emails."
                            : "No invitations yet."}
                        </td>
                      </tr>
                    ) : (
                      inviteItems.map((inv) => (
                        <tr key={inv.id} className="border-b last:border-0">
                          <td className="px-4 py-3">{inv.email ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {inv.status ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {inv.sent_at
                              ? new Date(inv.sent_at).toLocaleString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {inv.delivered_at
                              ? new Date(inv.delivered_at).toLocaleString()
                              : "—"}
                          </td>
                          <td
                            className="px-4 py-3 text-muted-foreground max-w-[14rem] truncate"
                            title={inv.last_error ?? undefined}
                          >
                            {inv.last_error ?? "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {invitesPagination && invitesPagination.total_pages > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Page {invitesPagination.page} of {invitesPagination.total_pages}
                  {invitesPagination.total > 0 &&
                    ` (${invitesPagination.total} total)`}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={invitesPagination.page <= 1}
                    onClick={() => setInvitesPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={invitesPagination.page >= invitesPagination.total_pages}
                    onClick={() =>
                      setInvitesPage((p) =>
                        Math.min(invitesPagination.total_pages, p + 1)
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </section>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 max-w-xl"
            >
              {sendInvitations.isError && (
                <p
                  className={cn(
                    "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  )}
                  role="alert"
                >
                  {sendInvitations.error instanceof Error
                    ? sendInvitations.error.message
                    : "Failed to queue invitations"}
                </p>
              )}

              {lastResult && (
                <div
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm",
                    lastResult.rejected.length > 0
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                      : "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-200"
                  )}
                  role="status"
                >
                  {lastResult.queued > 0 && (
                    <p>
                      {lastResult.queued} invitation
                      {lastResult.queued !== 1 ? "s" : ""} queued for delivery.
                    </p>
                  )}
                  {lastResult.rejected.length > 0 && (
                    <>
                      <p className="font-medium mt-1">
                        Some addresses were not queued (duplicates or errors):
                      </p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {lastResult.rejected.map((email) => (
                          <li key={email}>{email}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {lastResult.queued === 0 && lastResult.rejected.length === 0 && (
                    <p>
                      No new invitations queued (for example, all addresses were already
                      invited).
                    </p>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="emails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email addresses</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        placeholder="alice@example.com, bob@example.com"
                        rows={4}
                        disabled={isPending}
                        className={cn(
                          "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                        )}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Enter one or more email addresses, separated by commas or spaces.
                      Invitations are queued for delivery; check the list above for status.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending}>
                {isPending ? "Queueing…" : "Send invitations"}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="registered" className="space-y-6">
          <section className="space-y-4">
            <h3 className="text-lg font-medium tracking-tight">Registered attendees</h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Input
                type="search"
                placeholder="Search by name or email…"
                value={registrationsSearch}
                onChange={handleRegistrationsSearchChange}
                className="max-w-xs"
                aria-label="Search registered attendees"
              />
              <Select
                value={registrationsTierId || ALL_TIERS_VALUE}
                onValueChange={handleRegistrationsTierChange}
              >
                <SelectTrigger className="max-w-xs" aria-label="Filter registered by tier">
                  <SelectValue placeholder="All tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_TIERS_VALUE}>All tiers</SelectItem>
                  {(tiers.data ?? []).map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      <span className="inline-flex items-center gap-1.5">
                        {tier.color && (
                          <span
                            className="inline-block h-3.5 w-4 rounded border border-border shrink-0"
                            style={{ backgroundColor: tier.color }}
                            aria-hidden
                          />
                        )}
                        {tier.name ?? tier.id}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {registrations.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : registrations.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">
                  Failed to load registered attendees.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => registrations.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Name</th>
                      <th className="h-10 px-4 text-left font-medium">Email</th>
                      <th className="h-10 px-4 text-left font-medium">Tier</th>
                      <th className="h-10 px-4 text-left font-medium">Registered at</th>
                      <th className="h-10 px-4 text-left font-medium">Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrationItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          {registrationsSearch.trim()
                            ? "No matching attendees."
                            : "No one has registered yet."}
                        </td>
                      </tr>
                    ) : (
                      registrationItems.map((reg) => (
                        <tr
                          key={reg.registration_id}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-3">
                            {reg.name || reg.last_name
                              ? [reg.name, reg.last_name].filter(Boolean).join(" ")
                              : "—"}
                          </td>
                          <td className="px-4 py-3">{reg.email ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Select
                              value={reg.tier?.id ?? ""}
                              onValueChange={(tierId) => {
                                if (!tierId || !reg.email) return
                                assignTierUsers.mutate(
                                  { tierId, emails: reg.email },
                                  {
                                    onSuccess: () => {
                                      if (activeEventId) {
                                        queryClient.invalidateQueries({
                                          queryKey: ["events", activeEventId, "registrations"],
                                        })
                                      }
                                    },
                                  }
                                )
                              }}
                              disabled={
                                assignTierUsers.isPending &&
                                assignTierUsers.variables?.emails === reg.email
                              }
                            >
                              <SelectTrigger
                                className="h-8 min-w-[7rem] border-0 bg-transparent shadow-none hover:bg-muted/50 data-[state=open]:bg-muted/50"
                                aria-label={`Change tier for ${reg.email ?? "attendee"}`}
                              >
                                <SelectValue placeholder="Assign tier…" />
                              </SelectTrigger>
                              <SelectContent>
                                {(tiers.data ?? []).map((tier) => (
                                  <SelectItem key={tier.id} value={tier.id}>
                                    <span className="inline-flex items-center gap-1.5">
                                      {tier.color && (
                                        <span
                                          className="inline-block h-3.5 w-4 rounded border border-border shrink-0"
                                          style={{ backgroundColor: tier.color }}
                                          aria-hidden
                                        />
                                      )}
                                      {tier.name ?? tier.id}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {reg.created_at
                              ? new Date(reg.created_at).toLocaleString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {reg.checked_in === true ? (
                              <span className="inline-flex items-center rounded-md bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                                Checked in
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                  !reg.user_id ||
                                  checkInAttendee.isPending &&
                                    checkInAttendee.variables?.userId === reg.user_id
                                }
                                onClick={() =>
                                  reg.user_id &&
                                  checkInAttendee.mutate({ userId: reg.user_id })
                                }
                              >
                                {checkInAttendee.isPending &&
                                checkInAttendee.variables?.userId === reg.user_id
                                  ? "Checking in…"
                                  : "Check in"}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {registrationsPagination && registrationsPagination.total_pages > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Page {registrationsPagination.page} of{" "}
                  {registrationsPagination.total_pages}
                  {registrationsPagination.total > 0 &&
                    ` (${registrationsPagination.total} total)`}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={registrationsPagination.page <= 1}
                    onClick={() =>
                      setRegistrationsPage((p) => Math.max(1, p - 1))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      registrationsPagination.page >=
                      registrationsPagination.total_pages
                    }
                    onClick={() =>
                      setRegistrationsPage((p) =>
                        Math.min(registrationsPagination.total_pages, p + 1)
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
