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
import { useUpdateEventTier } from "@/hooks/useEvents"
import {
  editTierFormSchema,
  type EditTierFormValues,
} from "@/lib/schemas/event"
import { cn } from "@/lib/utils"
import type { EventTier, UpdateEventTierRequest } from "@/types/event"

type EditTierModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
  tier: EventTier | null
}

function toUpdateTierRequest(values: EditTierFormValues): UpdateEventTierRequest {
  const req: UpdateEventTierRequest = {
    name: values.name.trim(),
  }
  if (values.color !== undefined) req.color = values.color?.trim() || undefined
  return req
}

export function EditTierModal({
  open,
  onOpenChange,
  eventId,
  tier,
}: EditTierModalProps): React.ReactElement {
  const updateTier = useUpdateEventTier(eventId)

  const form = useForm<EditTierFormValues>({
    resolver: zodResolver(editTierFormSchema),
    defaultValues: { name: "", color: "" },
  })

  React.useEffect(() => {
    if (open && tier) {
      form.reset({
        name: tier.name ?? "",
        color: tier.color ?? "",
      })
      updateTier.reset()
    }
  }, [open, tier])

  const onSubmit = (values: EditTierFormValues) => {
    if (!tier) return
    const body = toUpdateTierRequest(values)
    updateTier.mutate(
      { tierId: tier.id, body },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Edit tier</DialogTitle>
          <DialogDescription>
            Update the tier name or color.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {updateTier.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {updateTier.error instanceof Error
                  ? updateTier.error.message
                  : "Failed to update tier"}
              </p>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. VIP" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. #3b82f6"
                      {...field}
                      value={field.value ?? ""}
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
                disabled={updateTier.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateTier.isPending}>
                {updateTier.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
