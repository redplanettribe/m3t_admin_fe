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
import {
  useConfirmEventThumbnail,
  useRequestEventThumbnailUpload,
  useUpdateEvent,
} from "@/hooks/useEvents"
import {
  updateEventSchema,
  type UpdateEventFormInput,
} from "@/lib/schemas/event"
import type { Event } from "@/types/event"
import { cn } from "@/lib/utils"

function getLocalUtcOffsetTimeZone(): string {
  // JS getTimezoneOffset() is minutes *behind* UTC (e.g. UTC+2 -> -120).
  const offsetMinutes = -new Date().getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const abs = Math.abs(offsetMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  return `${sign}${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`
}

/** Normalize API date to YYYY-MM-DD for <input type="date">. */
function toDateOnly(value: string | undefined): string {
  if (value == null || value === "") return ""
  const trimmed = String(value).trim()
  if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10)
  }
  return trimmed
}

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
  const requestThumbnailUpload = useRequestEventThumbnailUpload(event.id)
  const confirmThumbnail = useConfirmEventThumbnail(event.id)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = React.useState(false)
  const [thumbnailError, setThumbnailError] = React.useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = React.useState<string | undefined>(
    event.thumbnail_url
  )

  const form = useForm<UpdateEventFormInput>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: {
      start_date: "",
      duration_days: undefined,
      description: "",
      location_lat: undefined,
      location_lng: undefined,
      time_zone: event.time_zone ?? getLocalUtcOffsetTimeZone(),
    },
  })

  React.useEffect(() => {
    if (open && event) {
      form.reset({
        start_date: toDateOnly(event.start_date),
        duration_days: event.duration_days,
        description: event.description ?? "",
        location_lat: event.location_lat,
        location_lng: event.location_lng,
        time_zone: event.time_zone ?? getLocalUtcOffsetTimeZone(),
      })
      setThumbnailUrl(event.thumbnail_url)
      setThumbnailError(null)
    }
  }, [
    open,
    event?.id,
    event?.start_date,
    event?.duration_days,
    event?.description,
    event?.location_lat,
    event?.location_lng,
    event?.time_zone,
    event?.thumbnail_url,
    form,
  ])

  const handleThumbnailButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleThumbnailChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setThumbnailError(null)

    if (!file.type.startsWith("image/")) {
      setThumbnailError("Please select an image file.")
      e.target.value = ""
      return
    }

    setIsUploadingThumbnail(true)
    try {
      const { key, upload_url } = await requestThumbnailUpload.mutateAsync()
      const res = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      })

      if (!res.ok) {
        throw new Error("Failed to upload image. Please try again.")
      }

      const updatedEvent = await confirmThumbnail.mutateAsync({ key })
      setThumbnailUrl(updatedEvent.thumbnail_url)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload thumbnail."
      setThumbnailError(message)
    } finally {
      setIsUploadingThumbnail(false)
      e.target.value = ""
    }
  }

  const onSubmit = (values: UpdateEventFormInput) => {
    const body = {
      time_zone: values.time_zone,
      ...(values.start_date !== undefined && values.start_date !== "" && {
        start_date: values.start_date,
      }),
      ...(typeof values.duration_days === "number" && {
        duration_days: values.duration_days,
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
            Update start date, duration, description, and location. Event name and code cannot be changed here.
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
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
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
              name="time_zone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Time zone <span className="text-destructive" aria-hidden>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder='e.g. "+02:00"'
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
              name="duration_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 1"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const v = e.target.value
                        field.onChange(v === "" ? "" : Number(v))
                      }}
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
            <div className="space-y-2">
              <FormLabel>Thumbnail</FormLabel>
              <div className="flex items-center gap-4">
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt={event.name ? `${event.name} thumbnail` : "Event thumbnail"}
                    className="h-16 w-16 rounded-md border bg-muted object-cover"
                  />
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleThumbnailButtonClick}
                    disabled={
                      isUploadingThumbnail ||
                      requestThumbnailUpload.isPending ||
                      confirmThumbnail.isPending
                    }
                  >
                    {isUploadingThumbnail ||
                    requestThumbnailUpload.isPending ||
                    confirmThumbnail.isPending
                      ? "Uploading…"
                      : thumbnailUrl
                        ? "Change thumbnail"
                        : "Upload thumbnail"}
                  </Button>
                  {thumbnailError && (
                    <p className="text-xs text-destructive">{thumbnailError}</p>
                  )}
                </div>
              </div>
            </div>
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
