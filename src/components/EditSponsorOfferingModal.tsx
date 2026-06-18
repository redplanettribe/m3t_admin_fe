import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUpdateSponsorOffering } from "@/hooks/useSponsors"
import {
  OFFERING_KIND_LABELS,
  OFFERING_KINDS,
  SPONSOR_STATUS_LABELS,
  SPONSOR_STATUSES,
  updateOfferingSchema,
  type OfferingKind,
  type UpdateOfferingFormValues,
} from "@/lib/schemas/sponsor"
import { cn } from "@/lib/utils"
import type { EventSponsorOffering, UpdateEventSponsorOfferingRequest } from "@/types/event"

type EditSponsorOfferingModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
  sponsorId: string | null
  offering: EventSponsorOffering | null
}

const defaultValues: UpdateOfferingFormValues = {
  title: "",
  description: "",
  kind: "link",
  cta_label: "",
  cta_url: "",
  coupon_code: "",
  status: "draft",
}

function toUpdateOfferingRequest(
  values: UpdateOfferingFormValues
): UpdateEventSponsorOfferingRequest {
  const req: UpdateEventSponsorOfferingRequest = {
    title: values.title.trim(),
    kind: values.kind,
  }
  if (values.description?.trim()) req.description = values.description.trim()
  if (values.cta_label?.trim()) req.cta_label = values.cta_label.trim()
  if (values.cta_url?.trim()) req.cta_url = values.cta_url.trim()
  if (values.coupon_code?.trim()) req.coupon_code = values.coupon_code.trim()
  if (values.status) req.status = values.status
  return req
}

function usesCtaFields(kind: OfferingKind): boolean {
  return kind === "link" || kind === "resource" || kind === "demo"
}

function parseOfferingKind(kind: string | undefined): OfferingKind {
  if (kind && OFFERING_KINDS.includes(kind as OfferingKind)) {
    return kind as OfferingKind
  }
  return "link"
}

export function EditSponsorOfferingModal({
  open,
  onOpenChange,
  eventId,
  sponsorId,
  offering,
}: EditSponsorOfferingModalProps): React.ReactElement {
  const updateOffering = useUpdateSponsorOffering(eventId, sponsorId)
  const form = useForm<UpdateOfferingFormValues>({
    resolver: zodResolver(updateOfferingSchema),
    defaultValues,
  })
  const kind = form.watch("kind")

  React.useEffect(() => {
    if (open && offering) {
      form.reset({
        title: offering.title ?? "",
        description: offering.description ?? "",
        kind: parseOfferingKind(offering.kind),
        cta_label: offering.cta_label ?? "",
        cta_url: offering.cta_url ?? "",
        coupon_code: offering.coupon_code ?? "",
        status:
          offering.status && SPONSOR_STATUSES.includes(offering.status)
            ? offering.status
            : "draft",
      })
      updateOffering.reset()
    }
  }, [open, offering])

  const onSubmit = (values: UpdateOfferingFormValues) => {
    if (!offering) return
    updateOffering.mutate(
      {
        offeringId: offering.id,
        body: toUpdateOfferingRequest(values),
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit offering</DialogTitle>
          <DialogDescription>Update offering details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {updateOffering.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {updateOffering.error instanceof Error
                  ? updateOffering.error.message
                  : "Failed to update offering"}
              </p>
            )}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Free trial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kind</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select kind" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OFFERING_KINDS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {OFFERING_KIND_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      rows={3}
                      placeholder="Describe this offering..."
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
            {usesCtaFields(kind) && (
              <>
                <FormField
                  control={form.control}
                  name="cta_label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Claim offer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cta_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {kind === "coupon" && (
              <FormField
                control={form.control}
                name="coupon_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter coupon code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPONSOR_STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {SPONSOR_STATUS_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateOffering.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateOffering.isPending}>
                {updateOffering.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
