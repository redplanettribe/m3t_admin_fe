import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useUpdateUser } from "@/hooks/useUser"
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from "@/lib/schemas/account"
import { cn } from "@/lib/utils"
import { useEventStore } from "@/store/eventStore"
import { useUserStore } from "@/store/userStore"

export function AccountPage(): React.ReactElement {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useUserStore((s) => s.user)
  const clearAuth = useUserStore((s) => s.clearAuth)
  const clearEventState = useEventStore((s) => s.clearAll)
  const updateUser = useUpdateUser()

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name ?? "",
      last_name: user?.last_name ?? "",
    },
  })

  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? "",
        last_name: user.last_name ?? "",
      })
    }
  }, [user?.id, user?.name, user?.last_name, form])

  const onSubmit = (values: UpdateProfileFormValues) => {
    updateUser.mutate(
      {
        name: values.name || undefined,
        last_name: values.last_name || undefined,
      },
      { onSuccess: () => updateUser.reset() }
    )
  }

  const handleLogout = () => {
    clearAuth()
    clearEventState()
    queryClient.clear()
    navigate("/login", { replace: true })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Account</h2>
      <p className="text-muted-foreground">
        Your profile and account details.
      </p>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>{user?.email ?? "—"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {updateUser.isError && (
                <p
                  className={cn(
                    "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  )}
                  role="alert"
                >
                  {updateUser.error instanceof Error
                    ? updateUser.error.message
                    : "Failed to update profile"}
                </p>
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? "Saving…" : "Update profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="size-4" />
                  Logout
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
