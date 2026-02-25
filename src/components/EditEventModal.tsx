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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUpdateEvent } from "@/hooks/useEvents"
import {
  updateEventSchema,
  type UpdateEventFormInput,
} from "@/lib/schemas/event"
import type { Event } from "@/types/event"
import { cn } from "@/lib/utils"

type EditEventModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event
}

export function EditEventModal({
  open,
  onOpenChange,
  event,
}: EditEventModalProps): React.ReactElement {
  const updateEvent = useUpdateEvent(event.id)

  const form = useForm<UpdateEventFormInput>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: {
      date: "",
      description: "",
      location_lat: undefined,
      location_lng: undefined,
    },
  })

  React.useEffect(() => {
    if (open && event) {
      const dateOnly = event.date?.slice(0, 10) ?? ""
      form.reset({
        date: dateOnly,
        description: event.description ?? "",
        location_lat: event.location_lat,
        location_lng: event.location_lng,
      })
    }
  }, [open, event?.id, event?.date, event?.description, event?.location_lat, event?.location_lng, form])

  const onSubmit = (values: UpdateEventFormInput) => {
    const body = {
      ...(values.date !== undefined && values.date !== "" && {
        date: `${values.date}T12:00:00Z`,
      }),
      ...(values.description !== undefined && values.description !== "" && {
        description: values.description,
      }),
      ...(values.location_lat !== undefined &&
        values.location_lat !== "" && { location_lat: values.location_lat }),
      ...(values.location_lng !== undefined &&
        values.location_lng !== "" && { location_lng: values.location_lng }),
    }
    updateEvent.mutate(body, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Edit event details</DialogTitle>
          <DialogDescription>
            Update date, description, and location. Event name and code cannot be changed here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {updateEvent.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {updateEvent.error instanceof Error
                  ? updateEvent.error.message
                  : "Failed to update event"}
              </p>
            )}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      autoComplete="off"
                      {...field}
                      value={field.value ?? ""}
                    />
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
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Event description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location_lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g. 52.52"
                        {...field}
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
              <FormField
                control={form.control}
                name="location_lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g. 13.405"
                        {...field}
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
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateEvent.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateEvent.isPending}>
                {updateEvent.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
