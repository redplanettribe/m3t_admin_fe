import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useEventPublicProfiles } from "@/hooks/useEventPublicProfiles"
import { profileDisplayName } from "@/lib/chatUtils"
import { getInitials } from "@/lib/user"
import type { PublicAttendeeProfile } from "@/types/profile"

type EventDmProfileSearchProps = {
  eventId: string | null
  currentUserId: string | undefined
  disabled?: boolean
  onSelect: (profile: PublicAttendeeProfile) => void
}

export function EventDmProfileSearch({
  eventId,
  currentUserId,
  disabled = false,
  onSelect,
}: EventDmProfileSearchProps): React.ReactElement {
  const [open, setOpen] = React.useState(false)
  const { data, isLoading, isError } = useEventPublicProfiles(eventId, {
    page: 1,
    pageSize: 100,
  })

  const profiles = React.useMemo(
    () =>
      (data?.items ?? []).filter(
        (p) => p.user_id && p.user_id !== currentUserId
      ),
    [data?.items, currentUserId]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="justify-between font-normal"
          disabled={disabled}
        >
          New message
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search attendees…" />
          <CommandList>
            {isLoading && (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Loading profiles…
              </p>
            )}
            {isError && (
              <p className="text-destructive py-6 text-center text-sm">
                Failed to load profiles
              </p>
            )}
            {!isLoading && !isError && (
              <>
                <CommandEmpty>No public profiles found.</CommandEmpty>
                <CommandGroup>
                  {profiles.map((profile) => {
                    const name = profileDisplayName(profile)
                    const searchValue = [
                      name,
                      profile.company,
                      profile.headline,
                      ...(profile.topics_of_interest ?? []),
                    ]
                      .filter(Boolean)
                      .join(" ")

                    return (
                      <CommandItem
                        key={profile.user_id}
                        value={searchValue}
                        onSelect={() => {
                          onSelect(profile)
                          setOpen(false)
                        }}
                      >
                        <Avatar className="mr-2 size-6 shrink-0">
                          {profile.profile_picture_url ? (
                            <AvatarImage
                              src={profile.profile_picture_url}
                              alt={name}
                            />
                          ) : null}
                          <AvatarFallback className="text-[10px]">
                            {getInitials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{name}</span>
                          {profile.headline || profile.company ? (
                            <span className="text-muted-foreground block truncate text-xs">
                              {[profile.headline, profile.company]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          ) : null}
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
