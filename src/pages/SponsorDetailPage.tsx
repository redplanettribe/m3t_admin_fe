import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useParams } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SponsorLogoUpload } from "@/components/SponsorLogoUpload"
import { AddSponsorOfferingModal } from "@/components/AddSponsorOfferingModal"
import { EditSponsorOfferingModal } from "@/components/EditSponsorOfferingModal"
import {
  useDeleteSponsorOffering,
  useEventSponsor,
  useUpdateEventSponsor,
} from "@/hooks/useSponsors"
import {
  SPONSOR_BOOTH_TYPE_LABELS,
  SPONSOR_BOOTH_TYPES,
  updateSponsorSchema,
  type SponsorBoothType,
  type UpdateSponsorFormValues,
} from "@/lib/schemas/sponsor"
import { useReturnNavigation } from "@/hooks/useReturnNavigation"
import { cn } from "@/lib/utils"
import { useEventStore } from "@/store/eventStore"
import type { EventSponsor, EventSponsorOffering, UpdateEventSponsorRequest } from "@/types/event"

function normalizeBoothType(value?: string): SponsorBoothType {
  if (value && (SPONSOR_BOOTH_TYPES as readonly string[]).includes(value)) {
    return value as SponsorBoothType
  }
  return "virtual"
}

function formValuesFromSponsor(sponsor: EventSponsor): UpdateSponsorFormValues {
  const status = sponsor.status
  const validStatus =
    status === "draft" || status === "published" || status === "hidden"
      ? status
      : "draft"
  return {
    name: sponsor.name ?? "",
    tagline: sponsor.tagline ?? "",
    description: sponsor.description ?? "",
    sponsorship_level: sponsor.sponsorship_level ?? "",
    status: validStatus,
    featured: sponsor.featured ?? false,
    sort_order: sponsor.sort_order,
    booth_label: sponsor.booth_label ?? "",
    booth_type: normalizeBoothType(sponsor.booth_type),
    hall: sponsor.hall ?? "",
    how_to_get_there: sponsor.how_to_get_there ?? "",
    virtual_booth_url: sponsor.virtual_booth_url ?? "",
    website_url: sponsor.website_url ?? "",
  }
}

function toUpdateSponsorRequest(values: UpdateSponsorFormValues): UpdateEventSponsorRequest {
  const req: UpdateEventSponsorRequest = {
    name: values.name.trim(),
    tagline: values.tagline?.trim() || "",
    description: values.description?.trim() || "",
    sponsorship_level: values.sponsorship_level?.trim() || "",
    status: values.status,
    featured: values.featured,
    booth_label: values.booth_label?.trim() || "",
    booth_type: values.booth_type,
    hall: values.hall?.trim() || "",
    how_to_get_there: values.how_to_get_there?.trim() || "",
    virtual_booth_url: values.virtual_booth_url?.trim() || "",
    website_url: values.website_url?.trim() || "",
  }
  if (values.sort_order != null) req.sort_order = values.sort_order
  return req
}

export function SponsorDetailPage(): React.ReactElement {
  const { returnPath, returnLabel } = useReturnNavigation("/sponsors")
  const { eventId = null, sponsorId = null } = useParams<{
    eventId: string
    sponsorId: string
  }>()
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)
  const { data: sponsor, isLoading, isError, refetch } = useEventSponsor(eventId, sponsorId)
  const updateSponsor = useUpdateEventSponsor(eventId, sponsorId)
  const deleteOffering = useDeleteSponsorOffering(eventId, sponsorId)

  const [addOfferingOpen, setAddOfferingOpen] = React.useState(false)
  const [editOffering, setEditOffering] = React.useState<EventSponsorOffering | null>(null)
  const [offeringToDelete, setOfferingToDelete] = React.useState<EventSponsorOffering | null>(
    null
  )

  const form = useForm<UpdateSponsorFormValues>({
    resolver: zodResolver(updateSponsorSchema),
    defaultValues: formValuesFromSponsor({ id: "" }),
  })

  React.useEffect(() => {
    if (eventId) setActiveEventId(eventId)
  }, [eventId, setActiveEventId])

  React.useEffect(() => {
    if (!sponsor) return
    form.reset(formValuesFromSponsor(sponsor))
  }, [sponsor, form])

  if (!eventId || !sponsorId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Sponsor</h2>
        <p className="text-muted-foreground">Invalid link.</p>
        <Button asChild variant="outline">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline" size="sm">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    )
  }

  if (isError || !sponsor) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
        <h2 className="text-2xl font-semibold tracking-tight">Sponsor</h2>
        <p className="text-destructive text-muted-foreground">Failed to load sponsor.</p>
      </div>
    )
  }

  const offerings = sponsor.offerings ?? []
  const displayName = sponsor.name?.trim() || "Sponsor"

  const onSubmit = (values: UpdateSponsorFormValues) => {
    updateSponsor.mutate(toUpdateSponsorRequest(values))
  }

  const onCancel = () => {
    form.reset(formValuesFromSponsor(sponsor))
    updateSponsor.reset()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Button asChild variant="outline" size="sm">
        <Link to={returnPath}>{returnLabel}</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{displayName}</CardTitle>
          {sponsor.tagline ? (
            <CardDescription className="text-base">{sponsor.tagline}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-medium">Logo</h3>
            <SponsorLogoUpload
              eventId={eventId}
              sponsorId={sponsorId}
              existingImageUrl={sponsor.logo_url}
              onUploadComplete={() => refetch()}
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {updateSponsor.isError && (
                <p
                  className={cn(
                    "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  )}
                  role="alert"
                >
                  {updateSponsor.error instanceof Error
                    ? updateSponsor.error.message
                    : "Failed to update sponsor"}
                </p>
              )}
              {updateSponsor.isSuccess && (
                <p className="text-sm text-muted-foreground">Changes saved.</p>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={4}
                        className={cn(
                          "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
                          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                          "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sponsorship_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sponsorship level</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Featured</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Highlight this sponsor in attendee views.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="booth_label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booth label</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="booth_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booth type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SPONSOR_BOOTH_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {SPONSOR_BOOTH_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="hall"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hall</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="how_to_get_there"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How to get there</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={2}
                        className={cn(
                          "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
                          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="virtual_booth_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Virtual booth URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const v = e.target.value
                          field.onChange(v === "" ? undefined : Number(v))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={updateSponsor.isPending}>
                  {updateSponsor.isPending ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={updateSponsor.isPending}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-medium tracking-tight">Offerings</h3>
            <p className="text-sm text-muted-foreground">
              CTAs and perks shown on the sponsor profile.
            </p>
          </div>
          <Button onClick={() => setAddOfferingOpen(true)}>Add offering</Button>
        </div>

        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium">Title</th>
                <th className="h-10 px-4 text-left font-medium">Kind</th>
                <th className="h-10 px-4 text-left font-medium">Status</th>
                <th className="h-10 px-4 text-left font-medium">CTA</th>
                <th className="h-10 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offerings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No offerings yet.
                  </td>
                </tr>
              ) : (
                offerings.map((offering) => (
                  <tr key={offering.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{offering.title || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{offering.kind || "—"}</td>
                    <td className="px-4 py-3 capitalize">{offering.status || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {offering.cta_label || offering.cta_url || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditOffering(offering)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setOfferingToDelete(offering)}
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
      </section>

      <AddSponsorOfferingModal
        open={addOfferingOpen}
        onOpenChange={setAddOfferingOpen}
        eventId={eventId}
        sponsorId={sponsorId}
      />
      <EditSponsorOfferingModal
        open={editOffering !== null}
        onOpenChange={(open) => !open && setEditOffering(null)}
        eventId={eventId}
        sponsorId={sponsorId}
        offering={editOffering}
      />
      <Dialog
        open={offeringToDelete !== null}
        onOpenChange={(open) => !open && setOfferingToDelete(null)}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete offering</DialogTitle>
            <DialogDescription>
              This will remove
              {offeringToDelete?.title ? ` "${offeringToDelete.title}"` : " this offering"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteOffering.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {deleteOffering.error instanceof Error
                  ? deleteOffering.error.message
                  : "Failed to delete offering"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOfferingToDelete(null)}
                disabled={deleteOffering.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (offeringToDelete) {
                    deleteOffering.mutate(
                      { offeringId: offeringToDelete.id },
                      { onSuccess: () => setOfferingToDelete(null) }
                    )
                  }
                }}
                disabled={deleteOffering.isPending}
              >
                {deleteOffering.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
