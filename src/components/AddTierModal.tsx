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
import { useCreateEventTier } from "@/hooks/useEvents"
import {
  createTierSchema,
  type CreateTierFormValues,
} from "@/lib/schemas/event"
import { cn } from "@/lib/utils"
import type { CreateEventTierRequest } from "@/types/event"

type AddTierModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
}

const defaultValues: CreateTierFormValues = {
  name: "",
  color: "",
}

function toCreateTierRequest(values: CreateTierFormValues): CreateEventTierRequest {
  const req: CreateEventTierRequest = {
    name: values.name.trim(),
  }
  if (values.color?.trim()) req.color = values.color.trim()
  return req
}

export function AddTierModal({
  open,
  onOpenChange,
  eventId,
}: AddTierModalProps): React.ReactElement {
  const createTier = useCreateEventTier(eventId)

  const form = useForm<CreateTierFormValues>({
    resolver: zodResolver(createTierSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      createTier.reset()
    }
  }, [open])

  const onSubmit = (values: CreateTierFormValues) => {
    createTier.mutate(toCreateTierRequest(values), {
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
          <DialogTitle>Add tier</DialogTitle>
          <DialogDescription>
            Create a new tier for this event. Name is required; color is optional (e.g. hex).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createTier.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {createTier.error instanceof Error
                  ? createTier.error.message
                  : "Failed to create tier"}
              </p>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. VIP" {...field} />
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
                disabled={createTier.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTier.isPending}>
                {createTier.isPending ? "Creating…" : "Create tier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
