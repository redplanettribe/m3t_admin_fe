import { Navigate } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminPing } from "@/hooks/useAdminPing"
import { ApiError } from "@/lib/api"

interface RequireSystemAdminProps {
  children: React.ReactNode
}

export function RequireSystemAdmin({
  children,
}: RequireSystemAdminProps): React.ReactElement {
  const { data, isPending, isFetching, isError, error } = useAdminPing()

  if (isPending || (isFetching && data == null)) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 401) {
      return <Navigate to="/login" replace />
    }
    return <Navigate to="/" replace />
  }

  if (data?.ok !== true) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
