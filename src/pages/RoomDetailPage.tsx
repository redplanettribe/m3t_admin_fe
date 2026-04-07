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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useEventStore } from "@/store/eventStore"
import {
  useAddRoomTier,
  useEventTiers,
  useRemoveRoomTier,
  useRoom,
  useRoomTiers,
  useUpdateRoom,
} from "@/hooks/useEvents"
import { roomUpdateSchema, type RoomUpdateFormValues } from "@/lib/schemas/room"
import { useReturnNavigation } from "@/hooks/useReturnNavigation"
import { cn } from "@/lib/utils"

export function RoomDetailPage(): React.ReactElement {
  const { returnPath, returnLabel } = useReturnNavigation("/rooms")
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
  const eventTiers = useEventTiers(activeEventId)
  const roomTiers = useRoomTiers(activeEventId, roomId)
  const addRoomTier = useAddRoomTier(activeEventId, roomId)
  const removeRoomTier = useRemoveRoomTier(activeEventId, roomId)
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [selectedTierId, setSelectedTierId] = React.useState("")
  const successTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    }
  }, [])

  const form = useForm<RoomUpdateFormValues>({
    resolver: zodResolver(roomUpdateSchema),
    defaultValues: {
      name: "",
      capacity: undefined,
      description: "",
      how_to_get_there: "",
      not_bookable: undefined,
    },
  })

  useEffect(() => {
    if (room) {
      form.reset({
        name: room.name ?? "",
        capacity: room.capacity,
        description: room.description ?? "",
        how_to_get_there: room.how_to_get_there ?? "",
        not_bookable: room.not_bookable,
      })
    }
  }, [
    room?.id,
    room?.name,
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
          <Link to={returnPath}>{returnLabel}</Link>
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
          <Link to={returnPath}>{returnLabel}</Link>
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
          <Link to={returnPath}>{returnLabel}</Link>
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
          <Link to={returnPath}>{returnLabel}</Link>
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

  const assignedTierIds = new Set((roomTiers.data ?? []).map((tier) => tier.id))
  const availableTiers = (eventTiers.data ?? []).filter(
    (tier) => !assignedTierIds.has(tier.id)
  )

  const handleAddTier = () => {
    if (!selectedTierId || assignedTierIds.has(selectedTierId)) return
    addRoomTier.mutate(
      { tier_id: selectedTierId },
      {
        onSuccess: () => {
          setSelectedTierId("")
        },
      }
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Room: {room.name ?? room.id}
          </h2>
          <p className="text-sm text-muted-foreground">ID: {room.id}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={returnPath}>{returnLabel}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Room details</CardTitle>
          <CardDescription>
            Edit name, capacity, description, how to get there, and booking status.
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

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder={room.id} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Allowed tiers</CardTitle>
          <CardDescription>
            Control which event tiers can book and check in for this room.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={selectedTierId}
              onValueChange={setSelectedTierId}
              disabled={eventTiers.isLoading || addRoomTier.isPending}
            >
              <SelectTrigger className="w-full sm:max-w-xs">
                <SelectValue placeholder="Select tier to allow" />
              </SelectTrigger>
              <SelectContent>
                {availableTiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    <span className="inline-flex items-center gap-2">
                      {tier.color && (
                        <span
                          className="inline-block h-3.5 w-4 rounded border border-border shrink-0"
                          style={{ backgroundColor: tier.color }}
                          aria-hidden
                        />
                      )}
                      {tier.name || tier.id}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={handleAddTier}
              disabled={
                !selectedTierId ||
                addRoomTier.isPending ||
                eventTiers.isLoading ||
                availableTiers.length === 0
              }
            >
              {addRoomTier.isPending ? "Adding…" : "Allow tier"}
            </Button>
          </div>

          {addRoomTier.isError && (
            <p
              className={cn(
                "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              )}
              role="alert"
            >
              {addRoomTier.error instanceof Error
                ? addRoomTier.error.message
                : "Failed to allow tier"}
            </p>
          )}

          {removeRoomTier.isError && (
            <p
              className={cn(
                "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              )}
              role="alert"
            >
              {removeRoomTier.error instanceof Error
                ? removeRoomTier.error.message
                : "Failed to remove tier"}
            </p>
          )}

          {eventTiers.isLoading || roomTiers.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading tiers…</p>
          ) : eventTiers.isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">Failed to load event tiers.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => eventTiers.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : roomTiers.isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                Failed to load allowed tiers for this room.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => roomTiers.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : (roomTiers.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tiers are allowed for this room yet.
            </p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Tier</th>
                    <th className="h-10 px-4 text-left font-medium">Color</th>
                    <th className="h-10 px-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(roomTiers.data ?? []).map((tier) => (
                    <tr key={tier.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{tier.name || tier.id}</td>
                      <td className="px-4 py-3">
                        {tier.color ? (
                          <span
                            className="inline-block h-5 w-8 rounded border border-border"
                            style={{ backgroundColor: tier.color }}
                            title={tier.color}
                            aria-hidden
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            removeRoomTier.isPending &&
                            removeRoomTier.variables?.tierId === tier.id
                          }
                          onClick={() => removeRoomTier.mutate({ tierId: tier.id })}
                        >
                          {removeRoomTier.isPending &&
                          removeRoomTier.variables?.tierId === tier.id
                            ? "Removing…"
                            : "Remove"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

