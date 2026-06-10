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
import { useCreateAdminUgcSocialNetwork } from "@/hooks/useAdminUgcSocialNetworks"
import {
  createUgcSocialNetworkSchema,
  type CreateUgcSocialNetworkFormValues,
} from "@/lib/schemas/admin"
import { cn } from "@/lib/utils"
import type { CreateAdminUgcSocialNetworkRequest } from "@/types/admin"

type AddUgcSocialNetworkModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const defaultValues: CreateUgcSocialNetworkFormValues = {
  code: "",
  display_name: "",
}

function toCreateRequest(
  values: CreateUgcSocialNetworkFormValues
): CreateAdminUgcSocialNetworkRequest {
  return {
    code: values.code.trim().toLowerCase(),
    display_name: values.display_name.trim(),
  }
}

export function AddUgcSocialNetworkModal({
  open,
  onOpenChange,
}: AddUgcSocialNetworkModalProps): React.ReactElement {
  const createNetwork = useCreateAdminUgcSocialNetwork()

  const form = useForm<CreateUgcSocialNetworkFormValues>({
    resolver: zodResolver(createUgcSocialNetworkSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      createNetwork.reset()
    }
  }, [open])

  const onSubmit = (values: CreateUgcSocialNetworkFormValues) => {
    createNetwork.mutate(toCreateRequest(values), {
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
          <DialogTitle>Add social network</DialogTitle>
          <DialogDescription>
            Add a social network to the platform UGC catalog. Event managers can
            then enable it for their events.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createNetwork.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {createNetwork.error instanceof Error
                  ? createNetwork.error.message
                  : "Failed to add social network"}
              </p>
            )}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. instagram"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toLowerCase())
                      }
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Lowercase identifier used in APIs (e.g. instagram, linkedin).
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Instagram" {...field} />
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
                disabled={createNetwork.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createNetwork.isPending}>
                {createNetwork.isPending ? "Adding…" : "Add network"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
