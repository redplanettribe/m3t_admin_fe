import * as React from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { useEventSettings, usePatchEventSettings } from "@/hooks/useEventSettings"
import { cn } from "@/lib/utils"

type EventFeatureSettingsSectionProps = {
  eventId: string
}

export function EventFeatureSettingsSection({
  eventId,
}: EventFeatureSettingsSectionProps): React.ReactElement {
  const settings = useEventSettings(eventId)
  const patchSettings = usePatchEventSettings(eventId)

  const chatEnabled = settings.data?.features?.chat?.enabled ?? false
  const sponsorsEnabled = settings.data?.features?.sponsors?.enabled ?? false
  const requireInvitation =
    settings.data?.features?.registration?.require_invitation ?? false

  const handleChatChange = (checked: boolean) => {
    patchSettings.mutate({ features: { chat: { enabled: checked } } })
  }

  const handleSponsorsChange = (checked: boolean) => {
    patchSettings.mutate({ features: { sponsors: { enabled: checked } } })
  }

  const handleRequireInvitationChange = (checked: boolean) => {
    patchSettings.mutate({
      features: { registration: { require_invitation: checked } },
    })
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-medium">Features</h3>
        <p className="text-sm text-muted-foreground">
          Control which features are available for this event.
        </p>
      </div>

      {settings.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : settings.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {settings.error instanceof Error
              ? settings.error.message
              : "Failed to load feature settings"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => settings.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border divide-y">
            <div className="flex flex-row items-center justify-between p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Enable chat</Label>
                <p className="text-sm text-muted-foreground">
                  Allow attendees to use general chat and direct messages for this
                  event.
                </p>
              </div>
              <Switch
                checked={chatEnabled}
                onCheckedChange={handleChatChange}
                disabled={patchSettings.isPending}
              />
            </div>

            <div className="flex flex-row items-center justify-between p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Enable sponsors</Label>
                <p className="text-sm text-muted-foreground">
                  Allow sponsor profiles and offerings for attendees at this event.
                </p>
              </div>
              <Switch
                checked={sponsorsEnabled}
                onCheckedChange={handleSponsorsChange}
                disabled={patchSettings.isPending}
              />
            </div>

            <div className="flex flex-row items-center justify-between p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Require invitation to register</Label>
                <p className="text-sm text-muted-foreground">
                  Only attendees with a sent invitation can register for this
                  event.
                </p>
              </div>
              <Switch
                checked={requireInvitation}
                onCheckedChange={handleRequireInvitationChange}
                disabled={patchSettings.isPending}
              />
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
                : "Failed to save feature settings"}
            </p>
          )}
        </>
      )}
    </section>
  )
}
