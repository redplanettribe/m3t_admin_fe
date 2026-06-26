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
import { useCreateOrganization } from "@/hooks/useOrganizations"
import {
  createOrganizationSchema,
  type CreateOrganizationFormValues,
} from "@/lib/schemas/organization"
import { cn } from "@/lib/utils"

type CreateOrganizationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOrganizationModal({
  open,
  onOpenChange,
}: CreateOrganizationModalProps): React.ReactElement {
  const createOrganization = useCreateOrganization()

  const defaultValues: CreateOrganizationFormValues = { name: "" }

  const form = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, form])

  const onSubmit = (values: CreateOrganizationFormValues) => {
    createOrganization.mutate(values, {
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
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            Organizations group your events and team. You will be the owner of the new organization.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createOrganization.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {createOrganization.error instanceof Error
                  ? createOrganization.error.message
                  : "Failed to create organization"}
              </p>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Organization name <span className="text-destructive" aria-hidden>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Acme Events"
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
                disabled={createOrganization.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createOrganization.isPending}>
                {createOrganization.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
