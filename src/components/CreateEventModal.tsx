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
import { useCreateEvent } from "@/hooks/useEvents"
import {
  createEventSchema,
  type CreateEventFormValues,
} from "@/lib/schemas/event"
import { cn } from "@/lib/utils"

type CreateEventModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateEventModal({
  open,
  onOpenChange,
}: CreateEventModalProps): React.ReactElement {
  const createEvent = useCreateEvent()

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { name: "", slug: "" },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({ name: "", slug: "" })
    }
  }, [open, form])

  const onSubmit = (values: CreateEventFormValues) => {
    createEvent.mutate(values, {
        onSuccess: () => {
        onOpenChange(false)
        form.reset({ name: "", slug: "" })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Create new event</DialogTitle>
          <DialogDescription>
            Enter a name and URL-friendly slug for the new event. You can change them later in settings.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createEvent.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {createEvent.error instanceof Error
                  ? createEvent.error.message
                  : "Failed to create event"}
              </p>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. My Conference 2025"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. my-conference-2025"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createEvent.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createEvent.isPending}>
                {createEvent.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
