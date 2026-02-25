import * as React from "react"
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
import {
  sendInvitationsSchema,
  type SendInvitationsFormValues,
} from "@/lib/schemas/event"
import { useSendEventInvitations } from "@/hooks/useEvents"
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
  const sendInvitations = useSendEventInvitations(activeEventId)
  const [lastResult, setLastResult] = React.useState<{
    sent: number
    failed: string[]
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
            setLastResult({ sent: data.sent, failed: data.failed ?? [] })
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Attendees</h2>
        <p className="text-muted-foreground">
          Send invitation emails so people can register for this event.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
          {sendInvitations.isError && (
            <p
              className={cn(
                "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              )}
              role="alert"
            >
              {sendInvitations.error instanceof Error
                ? sendInvitations.error.message
                : "Failed to send invitations"}
            </p>
          )}

          {lastResult && (
            <div
              className={cn(
                "rounded-md border px-3 py-2 text-sm",
                lastResult.failed.length > 0
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                  : "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-200"
              )}
              role="status"
            >
              {lastResult.sent > 0 && (
                <p>
                  {lastResult.sent} invitation{lastResult.sent !== 1 ? "s" : ""}{" "}
                  sent.
                </p>
              )}
              {lastResult.failed.length > 0 && (
                <>
                  <p className="font-medium mt-1">Some invitations could not be sent:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {lastResult.failed.map((email) => (
                      <li key={email}>{email}</li>
                    ))}
                  </ul>
                </>
              )}
              {lastResult.sent === 0 && lastResult.failed.length === 0 && (
                <p>No new invitations sent (e.g. all already invited).</p>
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
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isPending}>
            {isPending ? "Sending…" : "Send invitations"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
