import * as React from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import {
  useEventSettings,
  useEventUgcSocialNetworks,
  usePatchEventSettings,
} from "@/hooks/useEventSettings"
import { cn } from "@/lib/utils"

const CATALOG_PARAMS = { page: 1, page_size: 100 } as const

type EventUgcSettingsSectionProps = {
  eventId: string
}

export function EventUgcSettingsSection({
  eventId,
}: EventUgcSettingsSectionProps): React.ReactElement {
  const settings = useEventSettings(eventId)
  const catalog = useEventUgcSocialNetworks(eventId, CATALOG_PARAMS)
  const patchSettings = usePatchEventSettings(eventId)

  const isLoading = settings.isLoading || catalog.isLoading
  const isError = settings.isError || catalog.isError
  const errorMessage =
    (settings.error instanceof Error ? settings.error.message : null) ??
    (catalog.error instanceof Error ? catalog.error.message : null) ??
    "Failed to load UGC settings"

  const enabled =
    settings.data?.features?.ugc?.enabled ?? settings.data?.ugc?.enabled ?? false
  const selectedCodes = (settings.data?.ugc?.social_networks ?? []).map((n) => n.code)
  const catalogItems = catalog.data?.items ?? []

  const handleEnabledChange = (checked: boolean) => {
    patchSettings.mutate({ features: { ugc: { enabled: checked } } })
  }

  const handleNetworkChange = (code: string, checked: boolean) => {
    const nextCodes = checked
      ? selectedCodes.includes(code)
        ? selectedCodes
        : [...selectedCodes, code]
      : selectedCodes.filter((c) => c !== code)
    patchSettings.mutate({ ugc: { social_network_codes: nextCodes } })
  }

  const handleRetry = () => {
    void settings.refetch()
    void catalog.refetch()
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-medium">User-generated content</h3>
        <p className="text-sm text-muted-foreground">
          Let attendees share content from selected social networks during this
          event.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleRetry}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border divide-y">
            <div className="flex flex-row items-center justify-between p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Enable UGC</Label>
                <p className="text-sm text-muted-foreground">
                  Turn on user-generated content for this event.
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={handleEnabledChange}
                disabled={patchSettings.isPending}
              />
            </div>

            <div className="p-4 space-y-3">
              <p className="text-sm font-medium">Social networks</p>
              {catalogItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No social networks available. Contact platform admin.
                </p>
              ) : (
                <ul className="divide-y">
                  {catalogItems.map((network) => {
                    const isSelected = selectedCodes.includes(network.code)
                    return (
                      <li
                        key={network.id}
                        className={cn(
                          "flex flex-row items-center justify-between px-4 py-3",
                          !enabled && "opacity-60"
                        )}
                      >
                        <div className="space-y-0.5">
                          <p className="text-base font-medium">{network.display_name}</p>
                          <p className="text-sm text-muted-foreground">
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                              {network.code}
                            </code>
                          </p>
                        </div>
                        <Switch
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleNetworkChange(network.code, checked)
                          }
                          disabled={!enabled || patchSettings.isPending}
                          aria-label={`Enable ${network.display_name}`}
                        />
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {patchSettings.isError && (
            <p
              className={cn(
                "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              )}
              role="alert"
            >
              {patchSettings.error instanceof Error
                ? patchSettings.error.message
                : "Failed to save UGC settings"}
            </p>
          )}
        </>
      )}
    </section>
  )
}
