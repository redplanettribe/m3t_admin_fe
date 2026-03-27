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
import { useCreateEventDeliverable } from "@/hooks/useDeliverables"
import {
  createDeliverableSchema,
  type CreateDeliverableFormValues,
} from "@/lib/schemas/event"
import { cn } from "@/lib/utils"
import type { CreateEventDeliverableRequest } from "@/types/event"

type AddDeliverableModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
}

const defaultValues: CreateDeliverableFormValues = {
  name: "",
  description: "",
  repeatable: false,
}

function toCreateDeliverableRequest(
  values: CreateDeliverableFormValues
): CreateEventDeliverableRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    repeatable: values.repeatable,
  }
}

export function AddDeliverableModal({
  open,
  onOpenChange,
  eventId,
}: AddDeliverableModalProps): React.ReactElement {
  const createDeliverable = useCreateEventDeliverable(eventId)
  const form = useForm<CreateDeliverableFormValues>({
    resolver: zodResolver(createDeliverableSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      createDeliverable.reset()
    }
  }, [open])

  const onSubmit = (values: CreateDeliverableFormValues) => {
    createDeliverable.mutate(toCreateDeliverableRequest(values), {
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
          <DialogTitle>Add deliverable</DialogTitle>
          <DialogDescription>
            Create a new deliverable that can be granted to attendees.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createDeliverable.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {createDeliverable.error instanceof Error
                  ? createDeliverable.error.message
                  : "Failed to create deliverable"}
              </p>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Welcome tote bag" {...field} />
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
                      placeholder="Describe this deliverable..."
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
            <FormField
              control={form.control}
              name="repeatable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Repeatable</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Allow the same attendee to receive this deliverable multiple times.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
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
                disabled={createDeliverable.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createDeliverable.isPending}>
                {createDeliverable.isPending ? "Creating..." : "Create deliverable"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
