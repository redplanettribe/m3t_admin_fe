import * as React from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAddOrganizationMember,
  useOrganizationMembers,
  useRemoveOrganizationMember,
  useUpdateOrganization,
  useUpdateOrganizationMemberRole,
} from "@/hooks/useOrganizations"
import {
  addOrganizationMemberSchema,
  updateOrganizationSchema,
  type AddOrganizationMemberFormValues,
  type UpdateOrganizationFormValues,
} from "@/lib/schemas/organization"
import { cn } from "@/lib/utils"
import type { OrganizationMember, OrganizationRole, OrganizationWithRole } from "@/types/organization"

const ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
}

const ASSIGNABLE_ROLES: OrganizationRole[] = ["admin", "member"]

type ManageOrganizationSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: OrganizationWithRole | null
}

function canManageMembers(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin"
}

export function ManageOrganizationSheet({
  open,
  onOpenChange,
  organization,
}: ManageOrganizationSheetProps): React.ReactElement {
  const organizationId = organization?.id ?? null
  const callerRole = organization?.role ?? "member"
  const canManage = canManageMembers(callerRole)
  const canChangeRoles = callerRole === "owner"

  const updateOrganization = useUpdateOrganization(organizationId)
  const { data: members = [], isLoading, isError, refetch } = useOrganizationMembers(
    open ? organizationId : null
  )
  const addMember = useAddOrganizationMember(organizationId)
  const removeMember = useRemoveOrganizationMember(organizationId)
  const updateMemberRole = useUpdateOrganizationMemberRole(organizationId)

  const [removeTarget, setRemoveTarget] = useState<OrganizationMember | null>(null)
  const [roleTarget, setRoleTarget] = useState<OrganizationMember | null>(null)
  const [pendingRole, setPendingRole] = useState<OrganizationRole>("member")

  const renameForm = useForm<UpdateOrganizationFormValues>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: { name: organization?.name ?? "" },
  })

  const addForm = useForm<AddOrganizationMemberFormValues>({
    resolver: zodResolver(addOrganizationMemberSchema),
    defaultValues: { email: "", role: "member" },
  })

  React.useEffect(() => {
    if (open && organization) {
      renameForm.reset({ name: organization.name })
      addForm.reset({ email: "", role: "member" })
    }
  }, [open, organization, renameForm, addForm])

  const onRenameSubmit = (values: UpdateOrganizationFormValues) => {
    updateOrganization.mutate(values)
  }

  const onAddSubmit = (values: AddOrganizationMemberFormValues) => {
    addMember.mutate(values, {
      onSuccess: () => {
        addForm.reset({ email: "", role: "member" })
      },
    })
  }

  const handleRemoveConfirm = () => {
    if (!removeTarget) return
    removeMember.mutate(
      { userID: removeTarget.user_id },
      {
        onSuccess: () => {
          setRemoveTarget(null)
        },
      }
    )
  }

  const openRoleDialog = (member: OrganizationMember) => {
    setRoleTarget(member)
    setPendingRole(member.role === "owner" ? "admin" : member.role)
  }

  const handleRoleConfirm = () => {
    if (!roleTarget) return
    updateMemberRole.mutate(
      { userID: roleTarget.user_id, body: { role: pendingRole } },
      {
        onSuccess: () => {
          setRoleTarget(null)
        },
      }
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Manage organization</SheetTitle>
            <SheetDescription>
              {organization?.name
                ? `Settings and team for ${organization.name}.`
                : "Select an organization to manage."}
            </SheetDescription>
          </SheetHeader>

          {!organization ? (
            <p className="px-4 text-sm text-muted-foreground">No organization selected.</p>
          ) : (
            <div className="space-y-8 px-4 pb-6">
              <section className="space-y-4">
                <h3 className="text-lg font-medium tracking-tight">Organization name</h3>
                {canManage ? (
                  <Form {...renameForm}>
                    <form
                      onSubmit={renameForm.handleSubmit(onRenameSubmit)}
                      className="space-y-4"
                    >
                      {updateOrganization.isError && (
                        <p
                          className={cn(
                            "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                          )}
                          role="alert"
                        >
                          {updateOrganization.error instanceof Error
                            ? updateOrganization.error.message
                            : "Failed to update organization"}
                        </p>
                      )}
                      {updateOrganization.isSuccess && (
                        <p className="text-sm text-green-700 dark:text-green-300" role="status">
                          Organization updated.
                        </p>
                      )}
                      <FormField
                        control={renameForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input autoComplete="off" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={updateOrganization.isPending}>
                        {updateOrganization.isPending ? "Saving…" : "Save name"}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <p className="text-sm text-muted-foreground">{organization.name}</p>
                )}
              </section>

              {canManage && (
                <section className="space-y-4">
                  <h3 className="text-lg font-medium tracking-tight">Add member</h3>
                  <Form {...addForm}>
                    <form
                      onSubmit={addForm.handleSubmit(onAddSubmit)}
                      className="space-y-4"
                    >
                      {addMember.isError && (
                        <p
                          className={cn(
                            "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                          )}
                          role="alert"
                        >
                          {addMember.error instanceof Error
                            ? addMember.error.message
                            : "Failed to add member"}
                        </p>
                      )}
                      <FormField
                        control={addForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="colleague@example.com"
                                autoComplete="off"
                                disabled={addMember.isPending}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={addMember.isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ASSIGNABLE_ROLES.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={addMember.isPending}>
                        {addMember.isPending ? "Adding…" : "Add member"}
                      </Button>
                    </form>
                  </Form>
                </section>
              )}

              <section className="space-y-4">
                <h3 className="text-lg font-medium tracking-tight">Members</h3>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : isError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-sm text-destructive">Failed to load members.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => refetch()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-10 px-4 text-left font-medium">Name</th>
                          <th className="h-10 px-4 text-left font-medium">Email</th>
                          <th className="h-10 px-4 text-left font-medium">Role</th>
                          {(canManage || canChangeRoles) && (
                            <th className="h-10 px-4 text-right font-medium">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {members.length === 0 ? (
                          <tr>
                            <td
                              colSpan={canManage || canChangeRoles ? 4 : 3}
                              className="px-4 py-8 text-center text-muted-foreground"
                            >
                              No members found.
                            </td>
                          </tr>
                        ) : (
                          members.map((member) => (
                            <tr key={member.user_id} className="border-b last:border-0">
                              <td className="px-4 py-3">
                                {[member.name, member.last_name].filter(Boolean).join(" ") ||
                                  "—"}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {member.email ?? "—"}
                              </td>
                              <td className="px-4 py-3 capitalize">
                                {ROLE_LABELS[member.role] ?? member.role}
                              </td>
                              {(canManage || canChangeRoles) && (
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {canChangeRoles && member.role !== "owner" && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openRoleDialog(member)}
                                      >
                                        Change role
                                      </Button>
                                    )}
                                    {canManage && member.role !== "owner" && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Remove member"
                                        onClick={() => setRemoveTarget(member)}
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        <Trash2 className="size-4" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={!!removeTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setRemoveTarget(null)
            removeMember.reset()
          }
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              This will remove this user from the organization. They will lose access to organization events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {removeMember.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {removeMember.error instanceof Error
                  ? removeMember.error.message
                  : "Failed to remove member"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRemoveTarget(null)}
                disabled={removeMember.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemoveConfirm}
                disabled={removeMember.isPending}
              >
                {removeMember.isPending ? "Removing…" : "Remove"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!roleTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setRoleTarget(null)
            updateMemberRole.reset()
          }
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Change member role</DialogTitle>
            <DialogDescription>
              Update the role for {roleTarget?.email ?? "this member"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={pendingRole}
              onValueChange={(value) => setPendingRole(value as OrganizationRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {updateMemberRole.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {updateMemberRole.error instanceof Error
                  ? updateMemberRole.error.message
                  : "Failed to update role"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoleTarget(null)}
                disabled={updateMemberRole.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRoleConfirm}
                disabled={updateMemberRole.isPending}
              >
                {updateMemberRole.isPending ? "Saving…" : "Save role"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
