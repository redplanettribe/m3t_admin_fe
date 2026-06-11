import * as React from "react"
import { useState } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAddTeamMember,
  useTeamMembers,
  useRemoveTeamMember,
} from "@/hooks/useTeamMembers"
import {
  addTeamMembersSchema,
  type AddTeamMembersFormValues,
} from "@/lib/schemas/team"
import { useEventStore } from "@/store/eventStore"
import type { EventTeamMember } from "@/types/event"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"

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

export function TeamMembersPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const { data: members = [], isLoading, isError, refetch } = useTeamMembers(activeEventId)
  const addTeamMembers = useAddTeamMember(activeEventId)
  const removeMember = useRemoveTeamMember(activeEventId)
  const [removeTarget, setRemoveTarget] = useState<EventTeamMember | null>(null)
  const [lastAddResult, setLastAddResult] = useState<{
    added: number
    failed: string[]
  } | null>(null)

  const addForm = useForm<AddTeamMembersFormValues>({
    resolver: zodResolver(addTeamMembersSchema),
    defaultValues: { emails: "" },
  })

  const onAddSubmit = (values: AddTeamMembersFormValues) => {
    setLastAddResult(null)
    const emails = normalizeEmailsString(values.emails)
    addTeamMembers.mutate(
      { emails },
      {
        onSuccess: (data) => {
          if (data) {
            setLastAddResult({ added: data.added, failed: data.failed ?? [] })
            addForm.reset({ emails: "" })
          }
        },
      }
    )
  }

  const handleRemoveConfirm = () => {
    if (!removeTarget) return
    removeMember.mutate(
      { userID: removeTarget.user_id },
      {
        onSuccess: () => {
          setRemoveTarget(null)
        },
      }
    )
  }

  if (!activeEventId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Team Members</h2>
        <p className="text-muted-foreground">
          Select an event to manage team members.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Team Members</h2>
        <p className="text-muted-foreground">
          Add team members by email. Unknown addresses may receive new attendee accounts.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-medium tracking-tight">Add team members</h3>
        <Form {...addForm}>
          <form
            onSubmit={addForm.handleSubmit(onAddSubmit)}
            className="space-y-4 max-w-xl"
          >
            {addTeamMembers.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {addTeamMembers.error instanceof Error
                  ? addTeamMembers.error.message
                  : "Failed to add team members"}
              </p>
            )}

            {lastAddResult && (
              <div
                className={cn(
                  "rounded-md border px-3 py-2 text-sm",
                  lastAddResult.failed.length > 0
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                    : "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-200"
                )}
                role="status"
              >
                {lastAddResult.added > 0 && (
                  <p>
                    {lastAddResult.added} team member
                    {lastAddResult.added !== 1 ? "s" : ""} added.
                  </p>
                )}
                {lastAddResult.failed.length > 0 && (
                  <>
                    <p className="font-medium mt-1">
                      Some addresses could not be added (owner, already a member, or error):
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {lastAddResult.failed.map((email) => (
                        <li key={email}>{email}</li>
                      ))}
                    </ul>
                  </>
                )}
                {lastAddResult.added === 0 && lastAddResult.failed.length === 0 && (
                  <p>No new team members added (e.g. all already members).</p>
                )}
              </div>
            )}

            <FormField
              control={addForm.control}
              name="emails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email addresses</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      placeholder="alice@example.com, bob@example.com"
                      rows={4}
                      disabled={addTeamMembers.isPending}
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

            <Button type="submit" disabled={addTeamMembers.isPending}>
              {addTeamMembers.isPending ? "Adding…" : "Add team members"}
            </Button>
          </form>
        </Form>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium tracking-tight">Current team members</h3>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">Failed to load team members.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => refetch()}
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
                  <th className="h-10 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No team members yet. Add team members by email above.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.user_id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        {[member.name, member.last_name].filter(Boolean).join(" ") ||
                          "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {member.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove team member"
                          onClick={() => setRemoveTarget(member)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null)
            removeMember.reset()
          }
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Remove team member</DialogTitle>
            <DialogDescription>
              This will remove this user from the event team. They will no longer have access to manage this event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {removeMember.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {removeMember.error instanceof Error
                  ? removeMember.error.message
                  : "Failed to remove team member"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRemoveTarget(null)}
                disabled={removeMember.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemoveConfirm}
                disabled={removeMember.isPending}
              >
                {removeMember.isPending ? "Removing…" : "Remove"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
