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
import { useAddTeamMember } from "@/hooks/useTeamMembers"
import {
  addTeamMemberSchema,
  type AddTeamMemberFormValues,
} from "@/lib/schemas/team"
import { cn } from "@/lib/utils"

type AddTeamMemberModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
}

export function AddTeamMemberModal({
  open,
  onOpenChange,
  eventId,
}: AddTeamMemberModalProps): React.ReactElement {
  const addTeamMember = useAddTeamMember(eventId)

  const form = useForm<AddTeamMemberFormValues>({
    resolver: zodResolver(addTeamMemberSchema),
    defaultValues: { email: "" },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({ email: "" })
      addTeamMember.reset()
    }
    // Only depend on open: including form/addTeamMember causes infinite loop
    // (addTeamMember reference changes after reset() -> effect re-runs).
  }, [open])

  const onSubmit = (values: AddTeamMemberFormValues) => {
    addTeamMember.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset({ email: "" })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
          <DialogDescription>
            Enter the email of a user to add them as a team member. They must already have an account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {addTeamMember.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {addTeamMember.error instanceof Error
                  ? addTeamMember.error.message
                  : "Failed to add team member"}
              </p>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="e.g. colleague@example.com"
                      autoComplete="email"
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
                disabled={addTeamMember.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addTeamMember.isPending}>
                {addTeamMember.isPending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
