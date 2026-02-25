import * as React from "react"
import { useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useEventStore } from "@/store/eventStore"
import { useRoom, useUpdateRoom } from "@/hooks/useEvents"
import { roomUpdateSchema, type RoomUpdateFormValues } from "@/lib/schemas/room"
import { cn } from "@/lib/utils"

export function RoomDetailPage(): React.ReactElement {
  const { roomId = null } = useParams<{ roomId: string }>()
  const activeEventId = useEventStore((s) => s.activeEventId)

  const {
    data: room,
    isLoading,
    isError,
    error,
    refetch,
  } = useRoom(activeEventId, roomId)
  const updateRoom = useUpdateRoom(activeEventId)
  const [showSuccess, setShowSuccess] = React.useState(false)
  const successTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    }
  }, [])

  const form = useForm<RoomUpdateFormValues>({
    resolver: zodResolver(roomUpdateSchema),
    defaultValues: {
      capacity: undefined,
      description: "",
      how_to_get_there: "",
      not_bookable: undefined,
    },
  })

  useEffect(() => {
    if (room) {
      form.reset({
        capacity: room.capacity,
        description: room.description ?? "",
        how_to_get_there: room.how_to_get_there ?? "",
        not_bookable: room.not_bookable,
      })
    }
  }, [
    room?.id,
    room?.capacity,
    room?.description,
    room?.how_to_get_there,
    room?.not_bookable,
    form,
  ])

  if (!activeEventId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Room</h2>
        <p className="text-muted-foreground">
          Select an event from the sidebar to view room details.
        </p>
        <Button asChild variant="outline">
          <Link to="/rooms">Back to rooms</Link>
        </Button>
      </div>
    )
  }

  if (!roomId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Room</h2>
        <p className="text-muted-foreground">No room selected.</p>
        <Button asChild variant="outline">
          <Link to="/rooms">Back to rooms</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Room</h2>
        <p className="text-muted-foreground">Loading room…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Room</h2>
        <p className="text-muted-foreground text-destructive">
          Failed to load room{error instanceof Error ? `: ${error.message}` : ""}.
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
        <Button asChild variant="ghost">
          <Link to="/rooms">Back to rooms</Link>
        </Button>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Room</h2>
        <p className="text-muted-foreground">Room not found.</p>
        <Button asChild variant="outline">
          <Link to="/rooms">Back to rooms</Link>
        </Button>
      </div>
    )
  }

  const onSubmit = (values: RoomUpdateFormValues) => {
    updateRoom.mutate(
      {
        roomId,
        ...values,
      },
      {
        onSuccess: () => {
          setShowSuccess(true)
          if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
          successTimeoutRef.current = setTimeout(() => {
            setShowSuccess(false)
            successTimeoutRef.current = null
          }, 4000)
        },
      },
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Room: {room.name ?? room.id}
          </h2>
          <p className="text-sm text-muted-foreground">ID: {room.id}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/rooms">Back to rooms</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Room details</CardTitle>
          <CardDescription>
            Edit capacity, description, how to get there, and booking status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {showSuccess && (
                <p
                  className="rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
                  role="status"
                >
                  Room updated successfully.
                </p>
              )}
              {updateRoom.isError && (
                <p
                  className={cn(
                    "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                  )}
                  role="alert"
                >
                  {updateRoom.error instanceof Error
                    ? updateRoom.error.message
                    : "Failed to update room"}
                </p>
              )}

              <div className="space-y-1">
                <FormLabel>Name</FormLabel>
                <Input value={room.name ?? room.id} disabled className="bg-muted" />
              </div>

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const value = event.target.value
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          )
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
                        {...field}
                      />
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
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="not_bookable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border px-3 py-2">
                    <div className="space-y-0.5">
                      <FormLabel>Not bookable</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        When enabled, this room will not be used for new session bookings.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={updateRoom.isPending}
                >
                  {updateRoom.isPending ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={updateRoom.isPending}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

