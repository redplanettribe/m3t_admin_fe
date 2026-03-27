import * as React from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AddDeliverableModal } from "@/components/AddDeliverableModal"
import { EditDeliverableModal } from "@/components/EditDeliverableModal"
import { useDeleteEventDeliverable, useEventDeliverables } from "@/hooks/useDeliverables"
import { cn } from "@/lib/utils"
import { useEventStore } from "@/store/eventStore"
import type { EventDeliverable } from "@/types/event"

const DEFAULT_PAGE_SIZE = 20

function formatDate(value?: string): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString()
}

export function DeliverablesPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const [page, setPage] = React.useState(1)
  const [addOpen, setAddOpen] = React.useState(false)
  const [editDeliverable, setEditDeliverable] = React.useState<EventDeliverable | null>(null)
  const [deliverableToDelete, setDeliverableToDelete] = React.useState<EventDeliverable | null>(null)

  const deliverables = useEventDeliverables(activeEventId, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const deleteDeliverable = useDeleteEventDeliverable(activeEventId)

  React.useEffect(() => {
    setPage(1)
  }, [activeEventId])

  if (!activeEventId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Deliverables</h2>
        <p className="text-muted-foreground">Select an event to manage deliverables.</p>
      </div>
    )
  }

  const items = deliverables.data?.items ?? []
  const pagination = deliverables.data?.pagination
  const canGoPrev = page > 1
  const canGoNext = pagination ? page < pagination.total_pages : false

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Deliverables</h2>
        <p className="text-muted-foreground">
          Manage event deliverables that can be given to attendees.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium tracking-tight">Event deliverables</h3>
          <Button onClick={() => setAddOpen(true)}>Add deliverable</Button>
        </div>

        {deliverables.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : deliverables.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">Failed to load deliverables.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => deliverables.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Name</th>
                    <th className="h-10 px-4 text-left font-medium">Description</th>
                    <th className="h-10 px-4 text-left font-medium">Repeatable</th>
                    <th className="h-10 px-4 text-left font-medium">Updated</th>
                    <th className="h-10 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No deliverables yet. Add one to get started.
                      </td>
                    </tr>
                  ) : (
                    items.map((deliverable) => (
                      <tr key={deliverable.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{deliverable.name || "-"}</td>
                        <td className="px-4 py-3">{deliverable.description || "-"}</td>
                        <td className="px-4 py-3">{deliverable.repeatable ? "Yes" : "No"}</td>
                        <td className="px-4 py-3">{formatDate(deliverable.updated_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditDeliverable(deliverable)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeliverableToDelete(deliverable)}
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
                  disabled={!canGoPrev || deliverables.isFetching}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!canGoNext || deliverables.isFetching}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <AddDeliverableModal open={addOpen} onOpenChange={setAddOpen} eventId={activeEventId} />
      <EditDeliverableModal
        open={editDeliverable !== null}
        onOpenChange={(open) => !open && setEditDeliverable(null)}
        eventId={activeEventId}
        deliverable={editDeliverable}
      />
      <Dialog
        open={deliverableToDelete !== null}
        onOpenChange={(open) => !open && setDeliverableToDelete(null)}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete deliverable</DialogTitle>
            <DialogDescription>
              This will remove
              {deliverableToDelete?.name ? ` "${deliverableToDelete.name}"` : " this deliverable"}
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteDeliverable.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {deleteDeliverable.error instanceof Error
                  ? deleteDeliverable.error.message
                  : "Failed to delete deliverable"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeliverableToDelete(null)}
                disabled={deleteDeliverable.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (deliverableToDelete) {
                    deleteDeliverable.mutate(
                      { deliverableId: deliverableToDelete.id },
                      { onSuccess: () => setDeliverableToDelete(null) }
                    )
                  }
                }}
                disabled={deleteDeliverable.isPending}
              >
                {deleteDeliverable.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
