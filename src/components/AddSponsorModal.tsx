import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
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
import { useCreateEventSponsor } from "@/hooks/useSponsors"
import {
  createSponsorSchema,
  SPONSOR_BOOTH_TYPE_LABELS,
  SPONSOR_BOOTH_TYPES,
  type CreateSponsorFormValues,
} from "@/lib/schemas/sponsor"
import { cn } from "@/lib/utils"
import type { CreateEventSponsorRequest } from "@/types/event"

type AddSponsorModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
}

const defaultValues: CreateSponsorFormValues = {
  name: "",
  sponsorship_level: "",
  status: "draft",
  booth_type: "virtual",
}

function toCreateSponsorRequest(values: CreateSponsorFormValues): CreateEventSponsorRequest {
  const req: CreateEventSponsorRequest = {
    name: values.name.trim(),
    status: values.status,
    booth_type: values.booth_type,
  }
  if (values.sponsorship_level?.trim()) {
    req.sponsorship_level = values.sponsorship_level.trim()
  }
  return req
}

export function AddSponsorModal({
  open,
  onOpenChange,
  eventId,
}: AddSponsorModalProps): React.ReactElement {
  const navigate = useNavigate()
  const createSponsor = useCreateEventSponsor(eventId)
  const form = useForm<CreateSponsorFormValues>({
    resolver: zodResolver(createSponsorSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      createSponsor.reset()
    }
  }, [open])

  const onSubmit = (values: CreateSponsorFormValues) => {
    createSponsor.mutate(toCreateSponsorRequest(values), {
      onSuccess: (sponsor) => {
        onOpenChange(false)
        if (eventId && sponsor.id) {
          navigate(`/events/${eventId}/sponsors/${sponsor.id}`)
        }
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Add sponsor</DialogTitle>
          <DialogDescription>
            Create a sponsor profile. You can add more details after creation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createSponsor.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {createSponsor.error instanceof Error
                  ? createSponsor.error.message
                  : "Failed to create sponsor"}
              </p>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sponsor company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sponsorship_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sponsorship level</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Gold, Silver" {...field} />
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
                        <SelectValue placeholder="Select booth type" />
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
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
                disabled={createSponsor.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSponsor.isPending}>
                {createSponsor.isPending ? "Creating..." : "Create sponsor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
