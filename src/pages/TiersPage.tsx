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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  assignTierEmailsSchema,
  type AssignTierEmailsFormValues,
} from "@/lib/schemas/event"
import {
  useAssignTierUsers,
  useDeleteEventTier,
  useEventTiers,
} from "@/hooks/useEvents"
import { useEventStore } from "@/store/eventStore"
import { cn } from "@/lib/utils"
import { AddTierModal } from "@/components/AddTierModal"
import { EditTierModal } from "@/components/EditTierModal"
import type { EventTier } from "@/types/event"

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

export function TiersPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const [addTierOpen, setAddTierOpen] = React.useState(false)
  const [editTier, setEditTier] = React.useState<EventTier | null>(null)
  const [tierToDelete, setTierToDelete] = React.useState<EventTier | null>(null)
  const [selectedTierId, setSelectedTierId] = React.useState<string>("")
  const [lastAssignResult, setLastAssignResult] = React.useState<{
    added: number
    failed: string[]
  } | null>(null)

  const tiers = useEventTiers(activeEventId)
  const deleteTier = useDeleteEventTier(activeEventId)
  const assignTierUsers = useAssignTierUsers(activeEventId)

  const assignForm = useForm<AssignTierEmailsFormValues>({
    resolver: zodResolver(assignTierEmailsSchema),
    defaultValues: { emails: "" },
  })

  const onAssignSubmit = (values: AssignTierEmailsFormValues) => {
    if (!selectedTierId) return
    setLastAssignResult(null)
    const emails = normalizeEmailsString(values.emails)
    assignTierUsers.mutate(
      { tierId: selectedTierId, emails },
      {
        onSuccess: (data) => {
          if (data) {
            setLastAssignResult({ added: data.added, failed: data.failed ?? [] })
            assignForm.reset({ emails: "" })
          }
        },
      }
    )
  }

  if (!activeEventId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Tiers</h2>
        <p className="text-muted-foreground">Select an event to manage tiers.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tiers</h2>
        <p className="text-muted-foreground">
          Manage event tiers and assign existing users by email.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium tracking-tight">Event tiers</h3>
          <Button onClick={() => setAddTierOpen(true)}>Add tier</Button>
        </div>

        {tiers.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : tiers.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">Failed to load tiers.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => tiers.refetch()}
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
                  <th className="h-10 px-4 text-left font-medium">Color</th>
                  <th className="h-10 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(tiers.data ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No tiers yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  (tiers.data ?? []).map((tier) => (
                    <tr key={tier.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{tier.name ?? "—"}</td>
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
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditTier(tier)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setTierToDelete(tier)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium tracking-tight">
          Bulk assign users to tier by email
        </h3>
        <Form {...assignForm}>
          <form
            onSubmit={assignForm.handleSubmit(onAssignSubmit)}
            className="space-y-4 max-w-xl"
          >
            {assignTierUsers.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {assignTierUsers.error instanceof Error
                  ? assignTierUsers.error.message
                  : "Failed to assign users"}
              </p>
            )}

            {lastAssignResult && (
              <div
                className={cn(
                  "rounded-md border px-3 py-2 text-sm",
                  lastAssignResult.failed.length > 0
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                    : "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-200"
                )}
                role="status"
              >
                {lastAssignResult.added > 0 && (
                  <p>
                    {lastAssignResult.added} user
                    {lastAssignResult.added !== 1 ? "s" : ""} added to tier.
                  </p>
                )}
                {lastAssignResult.failed.length > 0 && (
                  <>
                    <p className="font-medium mt-1">Some could not be assigned:</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {lastAssignResult.failed.map((email) => (
                        <li key={email}>{email}</li>
                      ))}
                    </ul>
                  </>
                )}
                {lastAssignResult.added === 0 && lastAssignResult.failed.length === 0 && (
                  <p>No new assignments (e.g. all already in tier).</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="tier-select" className="text-sm font-medium leading-none">
                Tier
              </label>
              <Select value={selectedTierId} onValueChange={setSelectedTierId}>
                <SelectTrigger id="tier-select" className="w-full max-w-xs">
                  <SelectValue placeholder="Select a tier" />
                </SelectTrigger>
                <SelectContent>
                  {(tiers.data ?? []).map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name ?? tier.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormField
              control={assignForm.control}
              name="emails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email addresses</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      placeholder="alice@example.com, bob@example.com"
                      rows={4}
                      disabled={assignTierUsers.isPending}
                      className={cn(
                        "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                      )}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Enter one or more email addresses, separated by commas or spaces.
                    Users must already exist.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={
                assignTierUsers.isPending || !selectedTierId || (tiers.data ?? []).length === 0
              }
            >
              {assignTierUsers.isPending ? "Assigning…" : "Assign to tier"}
            </Button>
          </form>
        </Form>
      </section>

      <AddTierModal open={addTierOpen} onOpenChange={setAddTierOpen} eventId={activeEventId} />
      <EditTierModal
        open={editTier !== null}
        onOpenChange={(open) => !open && setEditTier(null)}
        eventId={activeEventId}
        tier={editTier}
      />
      <Dialog open={tierToDelete !== null} onOpenChange={(open) => !open && setTierToDelete(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete tier</DialogTitle>
            <DialogDescription>
              This will remove the tier
              {tierToDelete?.name ? ` "${tierToDelete.name}"` : ""} from the event. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteTier.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {deleteTier.error instanceof Error
                  ? deleteTier.error.message
                  : "Failed to delete tier"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTierToDelete(null)}
                disabled={deleteTier.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (tierToDelete) {
                    deleteTier.mutate(
                      { tierId: tierToDelete.id },
                      { onSuccess: () => setTierToDelete(null) }
                    )
                  }
                }}
                disabled={deleteTier.isPending}
              >
                {deleteTier.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
