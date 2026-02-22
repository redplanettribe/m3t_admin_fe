import { Navigate } from "react-router-dom"
import { useUserStore } from "@/store/userStore"

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps): React.ReactElement {
  const user = useUserStore((s) => s.user)
  if (user == null) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
