import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LogOut, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useUpdateUser, useUpdateUserAvatar } from "@/hooks/useUser"
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from "@/lib/schemas/account"
import { cn } from "@/lib/utils"
import { useEventStore } from "@/store/eventStore"
import { useUserStore } from "@/store/userStore"
import type { User } from "@/types/auth"

function userInitials(user: User | null): string {
  if (!user) return "?"
  const parts = [user.name, user.last_name]
    .filter((p): p is string => Boolean(p))
    .map((p) => p.trim())
  if (parts.length > 0) {
    return parts
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase()
  }
  return "?"
}

export function AccountPage(): React.ReactElement {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useUserStore((s) => s.user)
  const clearAuth = useUserStore((s) => s.clearAuth)
  const clearEventState = useEventStore((s) => s.clearAll)
  const updateUser = useUpdateUser()
  const updateAvatar = useUpdateUserAvatar()
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

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

  const handleAvatarFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    updateAvatar.mutate({ file })
  }

  const handleChooseAvatarFile = () => {
    fileInputRef.current?.click()
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
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              {user?.profile_picture_url ? (
                <AvatarImage
                  src={user.profile_picture_url}
                  alt={user?.name || user?.email || "Profile picture"}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback>{userInitials(user)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle>Your profile</CardTitle>
              <CardDescription>{user?.email ?? "—"}</CardDescription>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleChooseAvatarFile}
                  disabled={updateAvatar.isPending}
                >
                  <Upload className="size-4" />
                  {updateAvatar.isPending ? "Uploading…" : "Change picture"}
                </Button>
                {updateAvatar.isError && (
                  <p className="text-xs text-destructive">
                    {updateAvatar.error instanceof Error
                      ? updateAvatar.error.message
                      : "Failed to update profile picture"}
                  </p>
                )}
              </div>
            </div>
          </div>
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
