import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Loader2, Search, X } from "lucide-react"
import { AdminEventDetailSheet } from "@/components/AdminEventDetailSheet"
import { AdminEventTimelineChart } from "@/components/AdminEventTimelineChart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchAdminEventDetail } from "@/hooks/useAdminEventDetail"
import { useAdminEventTimeline } from "@/hooks/useAdminEventTimeline"
import { useAdminEvents } from "@/hooks/useAdminEvents"
import { ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import {
  aggregateTimelineBuckets,
  formatTimelineRangeLabel,
} from "@/lib/adminEventTimeline"
import {
  EVENT_DISPLAY_STATUS_LABELS,
  HAS_OWNER_ALL,
  STATUS_ALL,
  STATUS_FILTER_HELPER_TEXT,
  countAdvancedFilters,
  getActiveFilterChips,
  getEventDisplayStatus,
  hasActiveFilters,
  hasAdvancedFilters,
  parseSortPreset,
  SORT_PRESETS,
  type EventDisplayStatus,
} from "@/lib/adminEventFilters"
import { formatDateOnly, formatDateTime } from "@/lib/formatDate"
import { cn } from "@/lib/utils"
import type {
  AdminEventListItem,
  AdminEventOwner,
  AdminEventTimelineParams,
  ListAdminEventsParams,
} from "@/types/admin"

const SEARCH_DEBOUNCE_MS = 300
const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

function SearchInput(props: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  className?: string
}): React.ReactElement {
  const { id, label, placeholder, value, onChange, className } = props
  const hasValue = value.length > 0

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted/50 px-3 shadow-none",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:bg-background"
        )}
      >
        <Search className="size-4 shrink-0 text-muted-foreground opacity-60" aria-hidden />
        <input
          id={id}
          type="text"
          role="searchbox"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && hasValue) {
              e.preventDefault()
              onChange("")
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
        {hasValue ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="-mr-1 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onChange("")}
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: EventDisplayStatus }): React.ReactElement {
  const styles: Record<EventDisplayStatus, string> = {
    active: "bg-green-500/10 text-green-700 dark:text-green-400",
    past: "bg-muted text-muted-foreground",
    upcoming: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    unknown: "bg-muted/50 text-muted-foreground",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        styles[status]
      )}
    >
      {EVENT_DISPLAY_STATUS_LABELS[status]}
    </span>
  )
}

function OwnerCell({ owner }: { owner?: AdminEventOwner | null }): React.ReactElement {
  if (!owner) {
    return <span className="text-muted-foreground">—</span>
  }
  const name = [owner.name, owner.last_name].filter(Boolean).join(" ").trim()
  const title = [name, owner.email].filter(Boolean).join(" · ")
  const compact = [name, owner.email].filter(Boolean).join(" · ")

  return (
    <div className="min-w-0 max-w-[14rem]" title={title || undefined}>
      <p className="truncate md:hidden text-sm">{compact || "—"}</p>
      <div className="hidden md:block min-w-0">
        {name ? <p className="font-medium truncate text-sm">{name}</p> : null}
        {owner.email ? (
          <p className="text-xs text-muted-foreground truncate">{owner.email}</p>
        ) : !name ? (
          <span className="text-muted-foreground">—</span>
        ) : null}
      </div>
    </div>
  )
}

function EventRow({
  item,
  onSelect,
  onPrefetch,
}: {
  item: AdminEventListItem
  onSelect: (eventId: string) => void
  onPrefetch?: (eventId: string) => void
}): React.ReactElement {
  const { event, owner } = item
  const displayStatus = getEventDisplayStatus(event)
  const detailLabel = `View details for ${event.name ?? event.event_code ?? "event"}`

  return (
    <tr
      className="border-b last:border-0 cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
      role="button"
      tabIndex={0}
      aria-label={detailLabel}
      onClick={() => onSelect(event.id)}
      onMouseEnter={() => onPrefetch?.(event.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(event.id)
        }
      }}
    >
      <td className="px-4 py-2">
        <div className="min-w-0 max-w-[14rem]">
          <p className="font-medium truncate text-sm">{event.name ?? "—"}</p>
        </div>
      </td>
      <td className="px-4 py-2">
        {event.event_code ? (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{event.event_code}</code>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-2">
        <StatusBadge status={displayStatus} />
      </td>
      <td className="px-4 py-2 text-muted-foreground whitespace-nowrap tabular-nums">
        {formatDateOnly(event.start_date)}
      </td>
      <td className="px-4 py-2">
        <OwnerCell owner={owner} />
      </td>
      <td className="px-4 py-2 text-muted-foreground whitespace-nowrap tabular-nums">
        {formatDateTime(event.created_at)}
      </td>
      <td className="px-4 py-2 text-muted-foreground whitespace-nowrap tabular-nums hidden lg:table-cell">
        {formatDateTime(event.updated_at)}
      </td>
      <td className="px-2 py-2 w-10 text-muted-foreground">
        <ChevronRight className="size-4 mx-auto" aria-hidden />
      </td>
    </tr>
  )
}

type FilterState = {
  searchInput: string
  ownerSearchInput: string
  status: string
  eventCode: string
  hasOwner: string
  ownerId: string
  startDateFrom: string
  startDateTo: string
  createdFrom: string
  createdTo: string
}

function getInitialAdvancedOpen(state: FilterState): boolean {
  return hasAdvancedFilters({
    eventCode: state.eventCode,
    hasOwner: state.hasOwner,
    ownerId: state.ownerId,
    startDateFrom: state.startDateFrom,
    startDateTo: state.startDateTo,
    createdFrom: state.createdFrom,
    createdTo: state.createdTo,
  })
}

export function SystemEventsPage(): React.ReactElement {
  const queryClient = useQueryClient()
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)
  const [searchInput, setSearchInput] = React.useState("")
  const [ownerSearchInput, setOwnerSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [debouncedOwnerSearch, setDebouncedOwnerSearch] = React.useState("")
  const [status, setStatus] = React.useState<string>(STATUS_ALL)
  const [sortPreset, setSortPreset] = React.useState("created_at:desc")
  const [eventCode, setEventCode] = React.useState("")
  const [hasOwner, setHasOwner] = React.useState(HAS_OWNER_ALL)
  const [ownerId, setOwnerId] = React.useState("")
  const [startDateFrom, setStartDateFrom] = React.useState("")
  const [startDateTo, setStartDateTo] = React.useState("")
  const [createdFrom, setCreatedFrom] = React.useState("")
  const [createdTo, setCreatedTo] = React.useState("")

  const [advancedOpen, setAdvancedOpen] = React.useState(() =>
    getInitialAdvancedOpen({
      searchInput: "",
      ownerSearchInput: "",
      status: STATUS_ALL,
      eventCode: "",
      hasOwner: HAS_OWNER_ALL,
      ownerId: "",
      startDateFrom: "",
      startDateTo: "",
      createdFrom: "",
      createdTo: "",
    })
  )

  const { sort, order } = parseSortPreset(sortPreset)

  React.useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [searchInput])

  React.useEffect(() => {
    const id = window.setTimeout(
      () => setDebouncedOwnerSearch(ownerSearchInput.trim()),
      SEARCH_DEBOUNCE_MS
    )
    return () => window.clearTimeout(id)
  }, [ownerSearchInput])

  const queryParams = React.useMemo((): ListAdminEventsParams => {
    const params: ListAdminEventsParams = {
      page,
      page_size: pageSize,
      sort,
      order,
    }
    if (debouncedSearch) params.search = debouncedSearch
    if (debouncedOwnerSearch) params.owner_search = debouncedOwnerSearch
    if (status !== STATUS_ALL) params.status = status as ListAdminEventsParams["status"]
    if (eventCode.trim()) params.event_code = eventCode.trim()
    if (ownerId.trim()) params.owner_id = ownerId.trim()
    if (hasOwner === "true") params.has_owner = true
    if (hasOwner === "false") params.has_owner = false
    if (startDateFrom.trim()) params.start_date_from = startDateFrom.trim()
    if (startDateTo.trim()) params.start_date_to = startDateTo.trim()
    if (createdFrom.trim()) params.created_from = createdFrom.trim()
    if (createdTo.trim()) params.created_to = createdTo.trim()
    return params
  }, [
    page,
    pageSize,
    sort,
    order,
    debouncedSearch,
    debouncedOwnerSearch,
    status,
    eventCode,
    ownerId,
    hasOwner,
    startDateFrom,
    startDateTo,
    createdFrom,
    createdTo,
  ])

  const filtersActive = hasActiveFilters(queryParams)
  const filterChips = getActiveFilterChips(queryParams)
  const advancedFilterCount = countAdvancedFilters({
    eventCode,
    hasOwner,
    ownerId,
    startDateFrom,
    startDateTo,
    createdFrom,
    createdTo,
  })

  React.useEffect(() => {
    setPage(1)
  }, [
    debouncedSearch,
    debouncedOwnerSearch,
    status,
    sortPreset,
    pageSize,
    eventCode,
    ownerId,
    hasOwner,
    startDateFrom,
    startDateTo,
    createdFrom,
    createdTo,
  ])

  const timelineParams = React.useMemo((): AdminEventTimelineParams => {
    const params: AdminEventTimelineParams = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      granularity: "day",
    }
    if (status !== STATUS_ALL) {
      params.status = status as AdminEventTimelineParams["status"]
    }
    if (startDateFrom.trim()) params.from = startDateFrom.trim()
    if (startDateTo.trim()) params.to = startDateTo.trim()
    return params
  }, [status, startDateFrom, startDateTo])

  const {
    data: timelineData,
    isLoading: timelineLoading,
    isError: timelineError,
    error: timelineErrorObj,
    refetch: refetchTimeline,
  } = useAdminEventTimeline(timelineParams)

  const chartPoints = React.useMemo(
    () => aggregateTimelineBuckets(timelineData?.buckets ?? []),
    [timelineData]
  )

  const timelineRangeLabel = formatTimelineRangeLabel(
    timelineData,
    startDateFrom.trim() || undefined,
    startDateTo.trim() || undefined
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminEvents(queryParams)

  const items = data?.items ?? []
  const selectedPreview =
    items.find((item) => item.event.id === selectedEventId) ?? null

  const prefetchEventDetail = React.useCallback(
    (eventId: string) => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.admin.eventDetail(eventId),
        queryFn: () => fetchAdminEventDetail(eventId),
      })
    },
    [queryClient]
  )
  const pagination = data?.pagination
  const total = pagination?.total ?? 0
  const canGoPrev = page > 1
  const canGoNext = pagination ? page < pagination.total_pages : false

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = pagination
    ? Math.min(page * pagination.page_size, total)
    : items.length

  const clearAdvanced = () => {
    setEventCode("")
    setHasOwner(HAS_OWNER_ALL)
    setOwnerId("")
    setStartDateFrom("")
    setStartDateTo("")
    setCreatedFrom("")
    setCreatedTo("")
  }

  const clearAllFilters = () => {
    setSearchInput("")
    setOwnerSearchInput("")
    setDebouncedSearch("")
    setDebouncedOwnerSearch("")
    setStatus(STATUS_ALL)
    setSortPreset("created_at:desc")
    clearAdvanced()
    setPage(1)
  }

  const clearChip = (chipId: string) => {
    switch (chipId) {
      case "search":
        setSearchInput("")
        setDebouncedSearch("")
        break
      case "owner_search":
        setOwnerSearchInput("")
        setDebouncedOwnerSearch("")
        break
      case "status":
        setStatus(STATUS_ALL)
        break
      case "event_code":
        setEventCode("")
        break
      case "owner_id":
        setOwnerId("")
        break
      case "has_owner":
        setHasOwner(HAS_OWNER_ALL)
        break
      case "start_dates":
        setStartDateFrom("")
        setStartDateTo("")
        break
      case "created_dates":
        setCreatedFrom("")
        setCreatedTo("")
        break
    }
    setPage(1)
  }

  const errorMessage =
    error instanceof ApiError && error.status === 403
      ? "Platform administrator access is required to list events."
      : error instanceof Error
        ? error.message
        : "Failed to load events."

  const headerResultsLabel =
    filtersActive && total > 0
      ? `${total} event${total === 1 ? "" : "s"} matching filters`
      : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Events</h2>
        <p className="text-muted-foreground">
          Explore, filter, and sort all events on the platform.
        </p>
      </div>

      <AdminEventTimelineChart
        data={chartPoints}
        isLoading={timelineLoading}
        isError={timelineError}
        error={timelineErrorObj}
        rangeLabel={timelineRangeLabel}
        onRetry={() => void refetchTimeline()}
      />

      <section className="space-y-3">
        <Card className="py-0 gap-0">
          <CardContent className="p-4 space-y-3">
            <CardDescription className="sr-only">Find events</CardDescription>
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
              <SearchInput
                id="event-search"
                label="Search"
                placeholder="Name, code, or description…"
                value={searchInput}
                onChange={setSearchInput}
              />
              <SearchInput
                id="owner-search"
                label="Owner"
                placeholder="Email or name…"
                value={ownerSearchInput}
                onChange={setOwnerSearchInput}
              />
              </div>
              <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex flex-col gap-1.5 w-full sm:min-w-[9rem]">
                    <Label htmlFor="status-filter" className="text-xs text-muted-foreground">
                      Status
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status-filter" aria-label="Filter by status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={STATUS_ALL}>All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="past">Past</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 w-full sm:min-w-[11rem]">
                    <Label htmlFor="sort-preset" className="text-xs text-muted-foreground">
                      Sort
                    </Label>
                    <Select value={sortPreset} onValueChange={setSortPreset}>
                      <SelectTrigger id="sort-preset" aria-label="Sort events">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_PRESETS.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {status === "active" ? (
                  <p className="text-xs text-muted-foreground max-w-md">
                    {STATUS_FILTER_HELPER_TEXT}
                  </p>
                ) : null}
              </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 h-9 min-h-9 w-fit"
                >
                  <ChevronDown
                    className={cn("size-4 transition-transform", advancedOpen && "rotate-180")}
                  />
                  Advanced
                  {advancedFilterCount > 0 ? (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                      {advancedFilterCount}
                    </span>
                  ) : null}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-5 rounded-lg border p-4">
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Event
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="event-code">Event code</Label>
                        <Input
                          id="event-code"
                          placeholder="Exact code (lowercase)"
                          value={eventCode}
                          onChange={(e) => setEventCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Owner
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label>Has owner</Label>
                        <Select value={hasOwner} onValueChange={setHasOwner}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={HAS_OWNER_ALL}>All</SelectItem>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="owner-id">Owner ID</Label>
                        <Input
                          id="owner-id"
                          placeholder="UUID"
                          value={ownerId}
                          onChange={(e) => setOwnerId(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Dates
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="start-from">Start from</Label>
                        <Input
                          id="start-from"
                          type="date"
                          value={startDateFrom}
                          onChange={(e) => setStartDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="start-to">Start to</Label>
                        <Input
                          id="start-to"
                          type="date"
                          value={startDateTo}
                          onChange={(e) => setStartDateTo(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="created-from">Created from</Label>
                        <Input
                          id="created-from"
                          type="date"
                          value={createdFrom}
                          onChange={(e) => setCreatedFrom(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="created-to">Created to</Label>
                        <Input
                          id="created-to"
                          type="date"
                          value={createdTo}
                          onChange={(e) => setCreatedTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <Separator />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={clearAdvanced}
                    >
                      Clear advanced
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
              </div>
            </Collapsible>
          </CardContent>
        </Card>

        {filterChips.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {filterChips.map((chip) => (
                <Button
                  key={chip.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-9 min-h-9 gap-1 pr-2"
                  onClick={() => clearChip(chip.id)}
                >
                  {chip.label}
                  <X className="size-3.5 opacity-60" aria-hidden />
                  <span className="sr-only">Remove filter</span>
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 min-h-9 text-muted-foreground shrink-0"
              onClick={clearAllFilters}
            >
              Clear all
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">{errorMessage}</p>
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
          <Card className="py-0 gap-0 overflow-hidden">
            {(headerResultsLabel || isFetching) ? (
              <div className="px-4 py-2 border-b flex items-center justify-between gap-2 min-h-9">
                {headerResultsLabel ? (
                  <p className="text-sm text-muted-foreground">{headerResultsLabel}</p>
                ) : (
                  <span />
                )}
                {isFetching ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" aria-hidden />
                ) : null}
              </div>
            ) : null}

            <div
              className="overflow-x-auto"
              aria-busy={isFetching}
              aria-live="polite"
            >
              <table className="w-full text-sm min-w-[52rem]">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <tr className="border-b">
                    <th scope="col" className="h-9 px-4 text-left font-medium">
                      Name
                    </th>
                    <th scope="col" className="h-9 px-4 text-left font-medium">
                      Code
                    </th>
                    <th scope="col" className="h-9 px-4 text-left font-medium">
                      Status
                    </th>
                    <th scope="col" className="h-9 px-4 text-left font-medium">
                      Start
                    </th>
                    <th scope="col" className="h-9 px-4 text-left font-medium">
                      Owner
                    </th>
                    <th scope="col" className="h-9 px-4 text-left font-medium">
                      Created
                    </th>
                    <th
                      scope="col"
                      className="h-10 px-4 text-left font-medium hidden lg:table-cell"
                    >
                      Updated
                    </th>
                    <th scope="col" className="h-9 w-10 px-2">
                      <span className="sr-only">View details</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={cn(isFetching && "opacity-60 pointer-events-none")}>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <p className="text-muted-foreground">
                          {filtersActive
                            ? "No events match the current filters."
                            : "No events found."}
                        </p>
                        {status === "active" && filtersActive ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => setStatus(STATUS_ALL)}
                          >
                            Try all statuses
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <EventRow
                        key={item.event.id}
                        item={item}
                        onSelect={setSelectedEventId}
                        onPrefetch={prefetchEventDetail}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                {total > 0
                  ? `Showing ${rangeStart}–${rangeEnd} of ${total}`
                  : "Showing 0 of 0"}
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <div className="flex items-center gap-2">
                  <Label htmlFor="page-size" className="text-sm text-muted-foreground shrink-0">
                    Per page
                  </Label>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => setPageSize(Number(v))}
                  >
                    <SelectTrigger id="page-size" className="w-[5.5rem] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 min-w-[5.5rem]"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!canGoPrev || isFetching}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 min-w-[5.5rem]"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!canGoNext || isFetching}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </section>

      <AdminEventDetailSheet
        eventId={selectedEventId}
        preview={selectedPreview}
        open={selectedEventId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedEventId(null)
        }}
      />
    </div>
  )
}
