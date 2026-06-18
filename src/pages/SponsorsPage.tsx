import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AddSponsorModal } from "@/components/AddSponsorModal"
import { SponsorEngagementMetrics } from "@/components/SponsorEngagementMetrics"
import { useDeleteEventSponsor, useEventSponsors } from "@/hooks/useSponsors"
import { useEventSettings } from "@/hooks/useEventSettings"
import {
  SPONSOR_BOOTH_TYPE_LABELS,
  type SponsorBoothType,
} from "@/lib/schemas/sponsor"
import { makeNavigateFrom } from "@/lib/returnNavigation"
import { cn } from "@/lib/utils"
import { useEventStore } from "@/store/eventStore"
import type { EventSponsor } from "@/types/event"

const DEFAULT_PAGE_SIZE = 20

function sponsorDisplayName(sponsor: EventSponsor): string {
  return sponsor.name?.trim() || "—"
}

function sponsorBoothDisplay(sponsor: EventSponsor): string {
  const label = sponsor.booth_label?.trim()
  if (label) return label
  const boothType = sponsor.booth_type
  if (boothType && boothType in SPONSOR_BOOTH_TYPE_LABELS) {
    return SPONSOR_BOOTH_TYPE_LABELS[boothType as SponsorBoothType]
  }
  return "—"
}

export function SponsorsPage(): React.ReactElement {
  const location = useLocation()
  const sponsorNavigateState = makeNavigateFrom(location)
  const activeEventId = useEventStore((s) => s.activeEventId)
  const [page, setPage] = React.useState(1)
  const [activeTab, setActiveTab] = React.useState("sponsors")
  const [addOpen, setAddOpen] = React.useState(false)
  const [sponsorToDelete, setSponsorToDelete] = React.useState<EventSponsor | null>(null)

  const settings = useEventSettings(activeEventId)
  const sponsorsEnabled = settings.data?.features?.sponsors?.enabled ?? false
  const sponsors = useEventSponsors(activeEventId, {
    page,
    page_size: DEFAULT_PAGE_SIZE,
  })
  const deleteSponsor = useDeleteEventSponsor(activeEventId)

  React.useEffect(() => {
    setPage(1)
    setActiveTab("sponsors")
  }, [activeEventId])

  if (!activeEventId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Sponsors</h2>
        <p className="text-muted-foreground">Select an event to manage sponsors.</p>
      </div>
    )
  }

  const items = sponsors.data?.items ?? []
  const pagination = sponsors.data?.pagination
  const canGoPrev = page > 1
  const canGoNext = pagination ? page < pagination.total_pages : false

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sponsors</h2>
        <p className="text-muted-foreground">
          Manage sponsor profiles, logos, and offerings for this event.
        </p>
      </div>

      {settings.isLoading ? (
        <Skeleton className="h-14 w-full" />
      ) : !sponsorsEnabled ? (
        <div
          className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
          role="status"
        >
          Sponsors are hidden from attendees until enabled in{" "}
          <Link to="/settings" className="font-medium text-foreground underline-offset-4 hover:underline">
            event settings
          </Link>
          . You can still manage profiles here.
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList variant="line" className="w-full border-b bg-transparent px-0">
          <TabsTrigger value="sponsors">Manage</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="sponsors" className="space-y-4">
          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-medium tracking-tight">Event sponsors</h3>
              <Button onClick={() => setAddOpen(true)}>Add sponsor</Button>
            </div>

            {sponsors.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : sponsors.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">Failed to load sponsors.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => sponsors.refetch()}
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
                    <th className="h-10 w-12 px-2 text-left font-medium"></th>
                    <th className="h-10 px-4 text-left font-medium">Name</th>
                    <th className="h-10 px-4 text-left font-medium">Level</th>
                    <th className="h-10 px-4 text-left font-medium">Status</th>
                    <th className="h-10 px-4 text-left font-medium">Booth</th>
                    <th className="h-10 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No sponsors yet. Add one to get started.
                      </td>
                    </tr>
                  ) : (
                    items.map((sponsor) => (
                      <tr key={sponsor.id} className="border-b last:border-0">
                        <td className="w-12 px-2 py-2">
                          {sponsor.logo_url ? (
                            <img
                              src={sponsor.logo_url}
                              alt=""
                              className="size-8 rounded border bg-muted object-contain"
                            />
                          ) : (
                            <div className="size-8 rounded border bg-muted" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{sponsorDisplayName(sponsor)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {sponsor.sponsorship_level?.trim() || "—"}
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {sponsor.status?.trim() || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {sponsorBoothDisplay(sponsor)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="View sponsor"
                              asChild
                            >
                              <Link
                                to={`/events/${activeEventId}/sponsors/${sponsor.id}`}
                                state={sponsorNavigateState}
                              >
                                <Eye className="size-4" />
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Delete sponsor"
                              onClick={() => setSponsorToDelete(sponsor)}
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
                  disabled={!canGoPrev || sponsors.isFetching}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!canGoNext || sponsors.isFetching}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
          </section>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <SponsorEngagementMetrics
            eventId={activeEventId}
            enabled={activeTab === "engagement"}
          />
        </TabsContent>
      </Tabs>

      <AddSponsorModal open={addOpen} onOpenChange={setAddOpen} eventId={activeEventId} />

      <Dialog
        open={sponsorToDelete !== null}
        onOpenChange={(open) => !open && setSponsorToDelete(null)}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete sponsor</DialogTitle>
            <DialogDescription>
              This will remove
              {sponsorToDelete?.name ? ` "${sponsorToDelete.name}"` : " this sponsor"}
              {" "}and all offerings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteSponsor.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {deleteSponsor.error instanceof Error
                  ? deleteSponsor.error.message
                  : "Failed to delete sponsor"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSponsorToDelete(null)}
                disabled={deleteSponsor.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (sponsorToDelete) {
                    deleteSponsor.mutate(
                      { sponsorId: sponsorToDelete.id },
                      { onSuccess: () => setSponsorToDelete(null) }
                    )
                  }
                }}
                disabled={deleteSponsor.isPending}
              >
                {deleteSponsor.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
