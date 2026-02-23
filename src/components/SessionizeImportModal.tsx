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
import { useImportSessionize } from "@/hooks/useEvents"
import {
  sessionizeImportSchema,
  type SessionizeImportFormValues,
} from "@/lib/schemas/sessionize"
import { useEventStore } from "@/store/eventStore"
import { cn } from "@/lib/utils"

type SessionizeImportModalProps = {
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Saved Sessionize API ID to show as default when reopening the modal. */
  defaultSessionizeId?: string
}

export function SessionizeImportModal({
  eventId,
  open,
  onOpenChange,
  defaultSessionizeId = "",
}: SessionizeImportModalProps): React.ReactElement {
  const importSessionize = useImportSessionize(eventId)
  const setSessionizeIdForEvent = useEventStore(
    (s) => s.setSessionizeIdForEvent
  )

  const form = useForm<SessionizeImportFormValues>({
    resolver: zodResolver(sessionizeImportSchema),
    defaultValues: {
      sessionizeId: defaultSessionizeId,
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({ sessionizeId: defaultSessionizeId })
    }
  }, [open, defaultSessionizeId, form])

  const onSubmit = (values: SessionizeImportFormValues) => {
    importSessionize.mutateAsync(
      { sessionizeId: values.sessionizeId },
      {
        onSuccess: () => {
          setSessionizeIdForEvent(eventId, values.sessionizeId)
          onOpenChange(false)
          form.reset({ sessionizeId: values.sessionizeId })
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Update from Sessionize</DialogTitle>
          <DialogDescription>
            Enter your Sessionize API ID (8 characters) to import and update the
            event schedule.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {importSessionize.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {importSessionize.error instanceof Error
                  ? importSessionize.error.message
                  : "Import failed"}
              </p>
            )}
            <FormField
              control={form.control}
              name="sessionizeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sessionize API ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. abc12xyz"
                      maxLength={8}
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
                disabled={importSessionize.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={importSessionize.isPending}>
                {importSessionize.isPending ? "Importing…" : "Import"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
