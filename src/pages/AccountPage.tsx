import * as React from "react"
import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useUserStore } from "@/store/userStore"

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function AccountPage(): React.ReactElement {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const clearAuth = useUserStore((s) => s.clearAuth)

  const handleLogout = () => {
    clearAuth()
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
            <Avatar className="size-12">
              <AvatarFallback className="text-lg">
                {user ? getInitials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user?.name ?? "User"}</CardTitle>
              <CardDescription>{user?.email ?? "—"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{user?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user?.email ?? "—"}</dd>
            </div>
            {user?.role != null && (
              <div>
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-medium">{user.role}</dd>
              </div>
            )}
          </dl>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="size-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
