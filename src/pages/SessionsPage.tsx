import * as React from "react"
import { useEffect, useState } from "react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEventSessionsSchedule, useDeleteSession } from "@/hooks/useEvents"
import { useEventStore } from "@/store/eventStore"
import type { RoomWithSessions, SessionInput } from "@/types/event"
import { cn } from "@/lib/utils"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

function sessionTitle(s: SessionInput): string {
  const t = "title" in s ? s.title : undefined
  return (t && String(t).trim()) || "Untitled session"
}

/** Flatten paginated API shape into one list; room column comes from each session’s room. */
function flattenSessionsFromSchedule(
  rooms: RoomWithSessions[],
  unscheduled: SessionInput[]
): { session: SessionInput; roomLabel: string }[] {
  const fromRooms = rooms.flatMap((rw) => {
    const label = rw.room.name?.trim() || rw.room.id
    return rw.sessions.map((session) => ({ session, roomLabel: label }))
  })
  const fromUnscheduled = unscheduled.map((session) => ({
    session,
    roomLabel: "Unscheduled",
  }))
  return [...fromRooms, ...fromUnscheduled]
}

function SessionsTable(props: {
  rows: { session: SessionInput; roomLabel: string }[]
  activeEventId: string
  onDelete: (s: SessionInput) => void
}): React.ReactElement {
  const { rows, activeEventId, onDelete } = props
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-4 py-8 text-center">
        No sessions on this page.
      </p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="px-4 py-2 font-medium">Title</th>
            <th className="px-4 py-2 font-medium">Room</th>
            <th className="px-4 py-2 font-medium">Day / time</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ session: s, roomLabel }) => {
            const id = String(s.id)
            const day = "event_day" in s && s.event_day != null ? s.event_day : "—"
            const start = "start_time" in s ? s.start_time : undefined
            const end = "end_time" in s ? s.end_time : undefined
            const timeLabel =
              start != null && end != null ? `${start}–${end}` : start ?? end ?? "—"
            const status = "status" in s && s.status ? s.status : "—"
            return (
              <tr key={id} className="border-b last:border-0">
                <td className="px-4 py-3 max-w-[200px]">
                  <span className="line-clamp-2 font-medium">{sessionTitle(s)}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {roomLabel}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  Day {day}
                  {timeLabel !== "—" ? ` · ${timeLabel}` : ""}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{status}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/events/${activeEventId}/sessions/${id}`}>View</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(s)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const SEARCH_DEBOUNCE_MS = 400

export function SessionsPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sessionToDelete, setSessionToDelete] = useState<SessionInput | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  useEffect(() => {
    setSearchInput("")
    setDebouncedSearch("")
    setPage(1)
  }, [activeEventId])

  const { data, isPending, isError, refetch } = useEventSessionsSchedule(activeEventId, {
    page,
    pageSize,
    search: debouncedSearch,
  })
  const deleteSession = useDeleteSession(activeEventId)

  const deleteDialogOpen = sessionToDelete !== null

  const handleDeleteConfirm = () => {
    if (!sessionToDelete) return
    deleteSession.mutate(
      { sessionId: String(sessionToDelete.id) },
      {
        onSuccess: () => {
          setSessionToDelete(null)
        },
      }
    )
  }

  const closeDeleteDialog = () => {
    if (!deleteSession.isPending) {
      setSessionToDelete(null)
      deleteSession.reset()
    }
  }

  if (!activeEventId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Sessions</h2>
        <p className="text-muted-foreground">
          Select an event from the dropdown in the sidebar to view and manage sessions.
        </p>
      </div>
    )
  }

  const pagination = data?.pagination
  const sessionRows =
    data != null
      ? flattenSessionsFromSchedule(data.rooms ?? [], data.unscheduled_sessions ?? [])
      : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sessions</h2>
        <p className="text-muted-foreground">
          Search, paginate, and open or delete sessions for this event.
        </p>
      </div>

      <div className="max-w-md space-y-2">
        <label htmlFor="sessions-search" className="text-sm font-medium">
          Search
        </label>
        <Input
          id="sessions-search"
          placeholder="Title or description…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Results update shortly after you stop typing.
        </p>
      </div>

      {isError ? (
        <div className="space-y-4">
          <p className="text-sm text-destructive">Failed to load sessions.</p>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isPending && data == null ? (
        <p className="text-sm text-muted-foreground">Loading sessions…</p>
      ) : data ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
              <div>
                <CardTitle className="text-base">All sessions</CardTitle>
                <CardDescription>
                  {sessionRows.length} session{sessionRows.length !== 1 ? "s" : ""} on this
                  page
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Per page
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v))}
                >
                  <SelectTrigger className="w-[100px]" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <SessionsTable
                rows={sessionRows}
                activeEventId={activeEventId}
                onDelete={setSessionToDelete}
              />
            </CardContent>
          </Card>

          {pagination && pagination.total_pages > 0 && (
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.total_pages}
                {pagination.total > 0 && ` (${pagination.total} total)`}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() =>
                    setPage((p) => Math.min(pagination.total_pages, p + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete session</DialogTitle>
            <DialogDescription>
              This will permanently delete
              {sessionToDelete ? ` "${sessionTitle(sessionToDelete)}"` : " this session"}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteSession.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {deleteSession.error instanceof Error
                  ? deleteSession.error.message
                  : "Failed to delete session"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteDialog}
                disabled={deleteSession.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteSession.isPending}
              >
                {deleteSession.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
