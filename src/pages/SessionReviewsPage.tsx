import * as React from "react"
import { Link } from "react-router-dom"
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
import { useEventSchedule } from "@/hooks/useEvents"
import { useEventSessionReviews } from "@/hooks/useSessionReviews"
import { useEventStore } from "@/store/eventStore"
import type { EventSessionReviewItem } from "@/types/event"

const DEFAULT_PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400
const ALL_SESSIONS_VALUE = "__all__"
const ALL_RATINGS_VALUE = "__all__"

function formatDate(value?: string): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function truncateText(value: string, maxLength = 80): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}…`
}

function formatRating(rating?: number): string {
  if (rating == null || rating < 1 || rating > 5) return "—"
  return "★".repeat(rating) + "☆".repeat(5 - rating)
}

function reviewerDisplay(review: EventSessionReviewItem): string {
  if (review.anonymized_at) return "Anonymous"
  const name = review.user_name?.trim()
  const email = review.user_email?.trim()
  if (name && email) return `${name} (${email})`
  return name || email || "—"
}

export function SessionReviewsPage(): React.ReactElement {
  const activeEventId = useEventStore((s) => s.activeEventId)
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [sessionId, setSessionId] = React.useState(ALL_SESSIONS_VALUE)
  const [rating, setRating] = React.useState(ALL_RATINGS_VALUE)

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [search])

  React.useEffect(() => {
    setPage(1)
  }, [activeEventId, debouncedSearch, sessionId, rating])

  const { data: schedule } = useEventSchedule(activeEventId)

  const sessionOptions = React.useMemo(() => {
    if (!schedule?.rooms) return []
    const sessions: { id: string; title: string }[] = []
    for (const room of schedule.rooms) {
      for (const session of room.sessions ?? []) {
        sessions.push({
          id: session.id,
          title: session.title?.trim() || session.id,
        })
      }
    }
    return sessions.sort((a, b) => a.title.localeCompare(b.title))
  }, [schedule?.rooms])

  const reviews = useEventSessionReviews(activeEventId, {
    page,
    page_size: DEFAULT_PAGE_SIZE,
    session_id: sessionId === ALL_SESSIONS_VALUE ? undefined : sessionId,
    rating: rating === ALL_RATINGS_VALUE ? undefined : Number(rating),
    search: debouncedSearch,
  })

  if (!activeEventId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Session reviews</h2>
        <p className="text-muted-foreground">Select an event to explore session reviews.</p>
      </div>
    )
  }

  const items = reviews.data?.items ?? []
  const pagination = reviews.data?.pagination
  const canGoPrev = page > 1
  const canGoNext = pagination ? page < pagination.total_pages : false

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Session reviews</h2>
        <p className="text-muted-foreground">
          Browse attendee feedback across all sessions for this event.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[200px] space-y-1">
          <label htmlFor="reviews-search" className="text-sm font-medium">
            Search comments
          </label>
          <Input
            id="reviews-search"
            type="search"
            placeholder="Filter by comment text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[220px] space-y-1">
          <label htmlFor="reviews-session" className="text-sm font-medium">
            Session
          </label>
          <Select value={sessionId} onValueChange={setSessionId}>
            <SelectTrigger id="reviews-session" className="w-full">
              <SelectValue placeholder="All sessions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SESSIONS_VALUE}>All sessions</SelectItem>
              {sessionOptions.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  No sessions available
                </SelectItem>
              ) : (
                sessionOptions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[160px] space-y-1">
          <label htmlFor="reviews-rating" className="text-sm font-medium">
            Rating
          </label>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger id="reviews-rating" className="w-full">
              <SelectValue placeholder="All ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_RATINGS_VALUE}>All ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {formatRating(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {reviews.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : reviews.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">Failed to load session reviews.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => reviews.refetch()}
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
                  <th className="h-10 px-4 text-left font-medium">Session</th>
                  <th className="h-10 px-4 text-left font-medium">Rating</th>
                  <th className="h-10 px-4 text-left font-medium">Comment</th>
                  <th className="h-10 px-4 text-left font-medium">Reviewer</th>
                  <th className="h-10 px-4 text-left font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No reviews match the current filters.
                    </td>
                  </tr>
                ) : (
                  items.map((review) => {
                    const comment = review.comment?.trim() ?? ""
                    const sessionLabel =
                      review.session_number != null
                        ? `#${review.session_number} ${review.session_title?.trim() || "Untitled"}`
                        : review.session_title?.trim() || "Untitled session"

                    return (
                      <tr key={review.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          {review.session_id ? (
                            <Link
                              to={`/events/${activeEventId}/sessions/${review.session_id}`}
                              className="font-medium text-foreground underline-offset-4 hover:underline"
                            >
                              {sessionLabel}
                            </Link>
                          ) : (
                            <span className="font-medium">{sessionLabel}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-amber-600 dark:text-amber-400">
                          {formatRating(review.rating)}
                        </td>
                        <td
                          className="px-4 py-3 text-muted-foreground max-w-xs"
                          title={comment || undefined}
                        >
                          {comment ? truncateText(comment) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {review.anonymized_at || !review.user_id ? (
                            <span className="text-muted-foreground">
                              {reviewerDisplay(review)}
                            </span>
                          ) : (
                            <Link
                              to={`/events/${activeEventId}/attendees/${review.user_id}`}
                              className="text-foreground underline-offset-4 hover:underline"
                            >
                              {reviewerDisplay(review)}
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(review.created_at)}
                        </td>
                      </tr>
                    )
                  })
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
                disabled={!canGoPrev || reviews.isFetching}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => current + 1)}
                disabled={!canGoNext || reviews.isFetching}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
