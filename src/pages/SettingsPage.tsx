import * as React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEventStore } from "@/store/eventStore"
import { useDeleteEvent } from "@/hooks/useEvents"
import { cn } from "@/lib/utils"

export function SettingsPage(): React.ReactElement {
  const navigate = useNavigate()
  const activeEventId = useEventStore((s) => s.activeEventId)
  const deleteEvent = useDeleteEvent(activeEventId)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleDeleteConfirm = () => {
    deleteEvent.mutate(undefined, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        navigate("/")
      },
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>

      {!activeEventId ? (
        <p className="text-muted-foreground">
          Select an event to manage its settings.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground">
            Manage settings for the selected event.
          </p>

          <section className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <h3 className="font-medium text-destructive">Danger zone</h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete this event and all its data. This cannot be undone.
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete event
            </Button>
          </section>
        </>
      )}

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) deleteEvent.reset()
          setDeleteDialogOpen(open)
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete event</DialogTitle>
            <DialogDescription>
              This will permanently delete the event and all its data (rooms, sessions).
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteEvent.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {deleteEvent.error instanceof Error
                  ? deleteEvent.error.message
                  : "Failed to delete event"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteEvent.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteEvent.isPending}
              >
                {deleteEvent.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
