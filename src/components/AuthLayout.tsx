import * as React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useUserStore } from "@/store/userStore"

export function AuthLayout(): React.ReactElement {
  const user = useUserStore((s) => s.user)
  if (user != null) {
    return <Navigate to="/" replace />
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <img
        src="/icon_foreground.png"
        alt="M3T Admin"
        className="mb-6 h-12 w-auto"
      />
      <Outlet />
    </div>
  )
}
