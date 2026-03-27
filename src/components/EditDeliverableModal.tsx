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
import { useUpdateEventDeliverable } from "@/hooks/useDeliverables"
import {
  editDeliverableSchema,
  type EditDeliverableFormValues,
} from "@/lib/schemas/event"
import { cn } from "@/lib/utils"
import type { EventDeliverable, UpdateEventDeliverableRequest } from "@/types/event"

type EditDeliverableModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
  deliverable: EventDeliverable | null
}

function toUpdateDeliverableRequest(
  values: EditDeliverableFormValues
): UpdateEventDeliverableRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    repeatable: values.repeatable,
  }
}

export function EditDeliverableModal({
  open,
  onOpenChange,
  eventId,
  deliverable,
}: EditDeliverableModalProps): React.ReactElement {
  const updateDeliverable = useUpdateEventDeliverable(eventId)
  const form = useForm<EditDeliverableFormValues>({
    resolver: zodResolver(editDeliverableSchema),
    defaultValues: {
      name: "",
      description: "",
      repeatable: false,
    },
  })

  React.useEffect(() => {
    if (open && deliverable) {
      form.reset({
        name: deliverable.name ?? "",
        description: deliverable.description ?? "",
        repeatable: deliverable.repeatable ?? false,
      })
      updateDeliverable.reset()
    }
  }, [open, deliverable])

  const onSubmit = (values: EditDeliverableFormValues) => {
    if (!deliverable) return
    updateDeliverable.mutate(
      {
        deliverableId: deliverable.id,
        body: toUpdateDeliverableRequest(values),
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Edit deliverable</DialogTitle>
          <DialogDescription>
            Update deliverable details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {updateDeliverable.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {updateDeliverable.error instanceof Error
                  ? updateDeliverable.error.message
                  : "Failed to update deliverable"}
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
                      Allow multiple giveaways for the same attendee.
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
                disabled={updateDeliverable.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateDeliverable.isPending}>
                {updateDeliverable.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
