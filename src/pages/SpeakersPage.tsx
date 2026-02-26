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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AddSpeakerModal } from "@/components/AddSpeakerModal"
import {
  useSpeakers,
  useDeleteSpeaker,
} from "@/hooks/useSpeakers"
import { useEventStore } from "@/store/eventStore"
import type { Speaker } from "@/types/event"
import { cn } from "@/lib/utils"
import { Trash2, Eye } from "lucide-react"

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

export function SpeakersPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const { data: speakers = [], isLoading, isError, refetch } = useSpeakers(activeEventId)
  const deleteSpeaker = useDeleteSpeaker(activeEventId)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Speaker | null>(null)

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteSpeaker.mutate(
      { speakerId: deleteTarget.id },
      {
        onSuccess: () => {
          setDeleteTarget(null)
        },
      }
    )
  }

  if (!activeEventId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Speakers</h2>
        <p className="text-muted-foreground">
          Select an event to manage speakers.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Speakers</h2>
        <Button onClick={() => setAddModalOpen(true)}>Add speaker</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">Failed to load speakers.</p>
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
                <th className="h-10 w-12 px-2 text-left font-medium"></th>
                <th className="h-10 px-4 text-left font-medium">Name</th>
                <th className="h-10 px-4 text-left font-medium">Tag line</th>
                <th className="h-10 px-4 text-left font-medium">Top speaker</th>
                <th className="h-10 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {speakers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No speakers yet. Add one above.
                  </td>
                </tr>
              ) : (
                speakers.map((speaker) => (
                  <tr key={speaker.id} className="border-b last:border-0">
                    <td className="w-12 px-2 py-2">
                      <Avatar size="sm" className="size-8">
                        {speaker.profile_picture ? (
                          <AvatarImage
                            src={speaker.profile_picture}
                            alt={speakerDisplayName(speaker)}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {speakerInitials(speaker)}
                        </AvatarFallback>
                      </Avatar>
                    </td>
                    <td className="px-4 py-3">
                      {speakerDisplayName(speaker)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {speaker.tag_line?.trim() ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {speaker.is_top_speaker ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Yes
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="View speaker"
                          asChild
                        >
                          <Link
                            to={`/events/${activeEventId}/speakers/${speaker.id}`}
                          >
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete speaker"
                          onClick={() => setDeleteTarget(speaker)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
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

      <AddSpeakerModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        eventId={activeEventId}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            deleteSpeaker.reset()
          }
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete speaker</DialogTitle>
            <DialogDescription>
              This will permanently delete this speaker. Session-speaker links
              will be removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteSpeaker.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {deleteSpeaker.error instanceof Error
                  ? deleteSpeaker.error.message
                  : "Failed to delete speaker"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteSpeaker.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteSpeaker.isPending}
              >
                {deleteSpeaker.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
