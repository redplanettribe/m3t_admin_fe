import * as React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useEventRooms, useDeleteRoom } from "@/hooks/useEvents"
import { useEventStore } from "@/store/eventStore"
import type { Room } from "@/types/event"
import { cn } from "@/lib/utils"

export function RoomsPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const { data: rooms = [], isLoading, isError, refetch } = useEventRooms(activeEventId)
  const deleteRoom = useDeleteRoom(activeEventId)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)

  const deleteDialogOpen = roomToDelete !== null

  const handleDeleteConfirm = () => {
    if (!roomToDelete) return
    deleteRoom.mutate(
      { roomId: roomToDelete.id },
      {
        onSuccess: () => {
          setRoomToDelete(null)
        },
      }
    )
  }

  const closeDeleteDialog = () => {
    if (!deleteRoom.isPending) {
      setRoomToDelete(null)
      deleteRoom.reset()
    }
  }

  if (!activeEventId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Rooms</h2>
        <p className="text-muted-foreground">
          Select an event from the dropdown in the sidebar to manage its rooms.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Rooms</h2>
        <p className="text-muted-foreground">Loading rooms…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Rooms</h2>
        <p className="text-muted-foreground text-destructive">
          Failed to load rooms.
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Rooms</h2>
      <p className="text-muted-foreground">
        View and manage rooms for the selected event.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event rooms</CardTitle>
          <CardDescription>
            {rooms.length} room{rooms.length !== 1 ? "s" : ""} for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rooms yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {rooms.map((room) => (
                <li
                  key={room.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/rooms/${room.id}`}
                      className="inline-flex min-w-0 flex-col text-left hover:underline"
                    >
                      <span className="font-medium truncate">
                        {room.name ?? room.id}
                      </span>
                      {room.description && (
                        <span className="mt-0.5 truncate text-xs text-muted-foreground">
                          {room.description}
                        </span>
                      )}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {room.capacity != null && (
                        <span>Capacity: {room.capacity}</span>
                      )}
                      {room.not_bookable && <span>Not bookable</span>}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setRoomToDelete(room)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete room</DialogTitle>
            <DialogDescription>
              This will permanently delete the room
              {roomToDelete?.name ? ` "${roomToDelete.name}"` : ""} and all sessions
              in it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteRoom.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {deleteRoom.error instanceof Error
                  ? deleteRoom.error.message
                  : "Failed to delete room"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteDialog}
                disabled={deleteRoom.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteRoom.isPending}
              >
                {deleteRoom.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
