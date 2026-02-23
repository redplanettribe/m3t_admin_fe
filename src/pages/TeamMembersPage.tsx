import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AddTeamMemberModal } from "@/components/AddTeamMemberModal"
import {
  useTeamMembers,
  useRemoveTeamMember,
} from "@/hooks/useTeamMembers"
import { useEventStore } from "@/store/eventStore"
import type { EventTeamMember } from "@/types/event"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"

export function TeamMembersPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const { data: members = [], isLoading, isError, refetch } = useTeamMembers(activeEventId)
  const removeMember = useRemoveTeamMember(activeEventId)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<EventTeamMember | null>(null)

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Team Members</h2>
        <Button onClick={() => setAddModalOpen(true)}>Add team member</Button>
      </div>

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
                    No team members yet. Add one by email above.
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

      <AddTeamMemberModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        eventId={activeEventId}
      />

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
