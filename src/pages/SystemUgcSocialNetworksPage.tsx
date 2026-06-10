import * as React from "react"
import { Loader2 } from "lucide-react"
import { AddUgcSocialNetworkModal } from "@/components/AddUgcSocialNetworkModal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAdminUgcSocialNetworks,
  useDeleteAdminUgcSocialNetwork,
} from "@/hooks/useAdminUgcSocialNetworks"
import { ApiError } from "@/lib/api"
import { formatDateTime } from "@/lib/formatDate"
import { cn } from "@/lib/utils"
import type { UGCSocialNetwork } from "@/types/admin"

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export function SystemUgcSocialNetworksPage(): React.ReactElement {
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)
  const [addModalOpen, setAddModalOpen] = React.useState(false)
  const [networkToDelete, setNetworkToDelete] = React.useState<UGCSocialNetwork | null>(
    null
  )

  const { data, isLoading, isError, isFetching, error, refetch } =
    useAdminUgcSocialNetworks({ page, page_size: pageSize })
  const deleteNetwork = useDeleteAdminUgcSocialNetwork()

  const items = data?.items ?? []
  const pagination = data?.pagination
  const total = pagination?.total ?? 0
  const canGoPrev = page > 1
  const canGoNext = pagination ? page < pagination.total_pages : false
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = pagination
    ? Math.min(page * pagination.page_size, total)
    : items.length

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Failed to load social networks"

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setPage(1)
  }

  const handleDeleteConfirm = () => {
    if (!networkToDelete) return
    deleteNetwork.mutate(
      { code: networkToDelete.code },
      {
        onSuccess: () => {
          setNetworkToDelete(null)
        },
      }
    )
  }

  const closeDeleteDialog = () => {
    if (!deleteNetwork.isPending) {
      setNetworkToDelete(null)
      deleteNetwork.reset()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">UGC social networks</h2>
          <p className="text-muted-foreground">
            Manage the platform catalog of social networks available for
            user-generated content on events.
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>Add network</Button>
      </div>

      <section className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">{errorMessage}</p>
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
          <Card className="py-0 gap-0 overflow-hidden">
            {isFetching ? (
              <div className="px-4 py-2 border-b flex items-center justify-end min-h-9">
                <Loader2
                  className="size-4 animate-spin text-muted-foreground shrink-0"
                  aria-hidden
                />
              </div>
            ) : null}

            <div
              className="overflow-x-auto"
              aria-busy={isFetching}
              aria-live="polite"
            >
              <table className="w-full text-sm min-w-[32rem]">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <tr className="border-b">
                    <th scope="col" className="h-9 px-4 text-left font-medium">
                      Display name
                    </th>
                    <th scope="col" className="h-9 px-4 text-left font-medium">
                      Code
                    </th>
                    <th scope="col" className="h-9 px-4 text-left font-medium">
                      Created
                    </th>
                    <th scope="col" className="h-9 w-28 px-4 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={cn(isFetching && "opacity-60 pointer-events-none")}>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No social networks configured yet. Add one to get started.
                      </td>
                    </tr>
                  ) : (
                    items.map((network) => (
                      <tr key={network.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3 font-medium">{network.display_name}</td>
                        <td className="px-4 py-3">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {network.code}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {network.created_at
                            ? formatDateTime(network.created_at)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setNetworkToDelete(network)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                {total > 0
                  ? `Showing ${rangeStart}–${rangeEnd} of ${total}`
                  : "Showing 0 of 0"}
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <div className="flex items-center gap-2">
                  <Label htmlFor="ugc-page-size" className="text-sm text-muted-foreground shrink-0">
                    Per page
                  </Label>
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger id="ugc-page-size" className="w-[5.5rem] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 min-w-[5.5rem]"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!canGoPrev || isFetching}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 min-w-[5.5rem]"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!canGoNext || isFetching}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </section>

      <AddUgcSocialNetworkModal open={addModalOpen} onOpenChange={setAddModalOpen} />

      <Dialog
        open={networkToDelete !== null}
        onOpenChange={(open) => !open && closeDeleteDialog()}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Remove social network</DialogTitle>
            <DialogDescription>
              This will remove
              {networkToDelete?.display_name
                ? ` "${networkToDelete.display_name}"`
                : ""}{" "}
              ({networkToDelete?.code}) from the platform UGC catalog. Events that
              already use this network may need to be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteNetwork.isError && (
              <p
                className={cn(
                  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                )}
                role="alert"
              >
                {deleteNetwork.error instanceof Error
                  ? deleteNetwork.error.message
                  : "Failed to remove social network"}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteDialog}
                disabled={deleteNetwork.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteNetwork.isPending}
              >
                {deleteNetwork.isPending ? "Removing…" : "Remove"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
