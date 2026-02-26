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
import { Switch } from "@/components/ui/switch"
import { useCreateRoom } from "@/hooks/useEvents"
import {
  createRoomSchema,
  type CreateRoomFormValues,
} from "@/lib/schemas/event"
import { cn } from "@/lib/utils"
import type { CreateRoomRequest } from "@/types/event"

type AddRoomModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
}

const defaultValues: CreateRoomFormValues = {
  name: "",
  description: "",
  capacity: undefined,
  how_to_get_there: "",
  not_bookable: false,
}

function toCreateRoomRequest(values: CreateRoomFormValues): CreateRoomRequest {
  const req: CreateRoomRequest = {
    name: values.name.trim(),
  }
  if (values.description?.trim()) req.description = values.description.trim()
  if (values.capacity != null && values.capacity > 0)
    req.capacity = Number(values.capacity)
  if (values.how_to_get_there?.trim())
    req.how_to_get_there = values.how_to_get_there.trim()
  if (values.not_bookable === true) req.not_bookable = true
  return req
}

export function AddRoomModal({
  open,
  onOpenChange,
  eventId,
}: AddRoomModalProps): React.ReactElement {
  const createRoom = useCreateRoom(eventId)

  const form = useForm<CreateRoomFormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      createRoom.reset()
    }
  }, [open])

  const onSubmit = (values: CreateRoomFormValues) => {
    createRoom.mutate(toCreateRoomRequest(values), {
      onSuccess: () => {
        onOpenChange(false)
        form.reset(defaultValues)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Add room</DialogTitle>
          <DialogDescription>
            Create a new room for this event. Name is required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createRoom.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {createRoom.error instanceof Error
                  ? createRoom.error.message
                  : "Failed to create room"}
              </p>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Hall" {...field} />
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
                      placeholder="Optional description..."
                      rows={2}
                      className={cn(
                        "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
                        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                        "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                      {...field}
                    />
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
                      min={1}
                      placeholder="Optional"
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
              name="how_to_get_there"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How to get there</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional directions"
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Not bookable</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Hide this room from attendee booking (e.g. for breaks)
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createRoom.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRoom.isPending}>
                {createRoom.isPending ? "Creating…" : "Create room"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
