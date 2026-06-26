import * as React from "react"
import { useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Clapperboard,
  Home,
  Handshake,
  Layers,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Mic2,
  Package,
  Settings,
  Shield,
  Star,
  UserPlus,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreateEventModal } from "@/components/CreateEventModal"
import { CreateOrganizationModal } from "@/components/CreateOrganizationModal"
import { ManageOrganizationSheet } from "@/components/ManageOrganizationSheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useQueryClient } from "@tanstack/react-query"
import { useAdminPing } from "@/hooks/useAdminPing"
import { useEventSettings } from "@/hooks/useEventSettings"
import { useEventsMe } from "@/hooks/useEvents"
import { useOrganizations } from "@/hooks/useOrganizations"
import { isEventEnded } from "@/lib/adminEventFilters"
import { queryKeys } from "@/lib/queryKeys"
import { getDisplayName, getInitials } from "@/lib/user"
import { useEventStore } from "@/store/eventStore"
import { useOrganizationStore } from "@/store/organizationStore"
import { useUserStore } from "@/store/userStore"

type NavSubItem = { title: string; url: string }

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  items?: NavSubItem[]
}

const navMain: NavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Live",
    url: "/live",
    icon: Activity,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Schedule",
    url: "/schedule",
    icon: CalendarDays,
  },
  {
    title: "Sessions",
    url: "/sessions",
    icon: Clapperboard,
  },
  {
    title: "Rooms",
    url: "/rooms",
    icon: LayoutGrid,
  },
  {
    title: "Speakers",
    url: "/speakers",
    icon: Mic2,
  },
  {
    title: "Team Members",
    url: "/team-members",
    icon: Users,
  },
  {
    title: "Attendees",
    url: "/attendees",
    icon: UserPlus,
  },
  {
    title: "Reviews",
    url: "/reviews",
    icon: Star,
  },
  {
    title: "Announcements",
    url: "/announcements",
    icon: Megaphone,
  },
  {
    title: "Tiers",
    url: "/tiers",
    icon: Layers,
  },
  {
    title: "Deliverables",
    url: "/deliverables",
    icon: Package,
  },
  {
    title: "Sponsors",
    url: "/sponsors",
    icon: Handshake,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

const CREATE_NEW_EVENT_VALUE = "__create_new__"
const CREATE_NEW_ORG_VALUE = "__create_new_org__"
const MANAGE_ORG_VALUE = "__manage_org__"

function AppLayoutInner(): React.ReactElement {
  const location = useLocation()
  const user = useUserStore((s) => s.user)
  const activeEventId = useEventStore((s) => s.activeEventId)
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)
  const activeOrganizationId = useOrganizationStore((s) => s.activeOrganizationId)
  const setActiveOrganizationId = useOrganizationStore((s) => s.setActiveOrganizationId)
  const queryClient = useQueryClient()
  const {
    data: organizations = [],
    isLoading: isOrganizationsLoading,
    isError: isOrganizationsError,
  } = useOrganizations()
  const { data: events = [], isLoading: isEventsLoading, isError: isEventsError } = useEventsMe()
  const { data: adminPing, isSuccess: isAdminPingSuccess } = useAdminPing()
  const { data: eventSettings } = useEventSettings(activeEventId)
  const sponsorsEnabled = eventSettings?.features?.sponsors?.enabled ?? false
  const { state, isMobile } = useSidebar()
  const [createEventOpen, setCreateEventOpen] = useState(false)
  const [createOrganizationOpen, setCreateOrganizationOpen] = useState(false)
  const [manageOrganizationOpen, setManageOrganizationOpen] = useState(false)

  const activeOrganization = React.useMemo(
    () => organizations.find((org) => org.id === activeOrganizationId) ?? null,
    [activeOrganizationId, organizations]
  )

  const filteredEvents = React.useMemo(() => {
    if (organizations.length === 0 || !activeOrganizationId) {
      return events
    }
    return events.filter((event) => event.organization_id === activeOrganizationId)
  }, [activeOrganizationId, events, organizations.length])

  React.useEffect(() => {
    if (isOrganizationsLoading || isOrganizationsError) return

    if (organizations.length === 0) {
      if (activeOrganizationId) {
        setActiveOrganizationId(null)
      }
      return
    }

    const persistedOrgValid = organizations.some((org) => org.id === activeOrganizationId)
    if (!persistedOrgValid) {
      setActiveOrganizationId(organizations[0]?.id ?? null)
    }
  }, [
    activeOrganizationId,
    isOrganizationsError,
    isOrganizationsLoading,
    organizations,
    setActiveOrganizationId,
  ])

  React.useEffect(() => {
    if (isEventsLoading) return

    if (filteredEvents.length === 0) {
      if (activeEventId) {
        setActiveEventId(null)
      }
      return
    }

    const activeEventValid = filteredEvents.some((event) => event.id === activeEventId)
    if (!activeEventValid) {
      setActiveEventId(filteredEvents[0]?.id ?? null)
    }
  }, [activeEventId, filteredEvents, isEventsLoading, setActiveEventId])

  const navItems = React.useMemo((): NavItem[] => {
    const activeEvent = activeEventId ? events.find((e) => e.id === activeEventId) : undefined
    const ended = activeEvent ? isEventEnded(activeEvent) : false

    const baseNav = (ended
      ? navMain.filter((item) => item.url !== "/live" && item.url !== "/chat")
      : navMain.filter((item) => item.url !== "/analytics")
    ).filter((item) => item.url !== "/sponsors" || sponsorsEnabled)

    if (isAdminPingSuccess && adminPing?.ok) {
      return [
        ...baseNav,
        { title: "System", url: "/system", icon: Shield },
      ]
    }
    return baseNav
  }, [activeEventId, adminPing?.ok, events, isAdminPingSuccess, sponsorsEnabled])

  const handleOrganizationSelect = (value: string) => {
    if (value === CREATE_NEW_ORG_VALUE) {
      setCreateOrganizationOpen(true)
      return
    }
    if (value === MANAGE_ORG_VALUE) {
      setManageOrganizationOpen(true)
      return
    }
    setActiveOrganizationId(value || null)
  }

  const handleEventSelect = (value: string) => {
    if (value === CREATE_NEW_EVENT_VALUE) {
      setCreateEventOpen(true)
    } else {
      const previousEventId = activeEventId
      setActiveEventId(value || null)
      if (previousEventId) {
        queryClient.removeQueries({ queryKey: queryKeys.events.detail(previousEventId) })
      }
      if (value) {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(value) })
      }
    }
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                    const subItems = "items" in item ? item.items : undefined
                    const isDisabled =
                      !activeEventId &&
                      item.url !== "/" &&
                      item.url !== "/system"
                    return subItems ? (
                      <Collapsible
                        key={item.title}
                        defaultOpen={subItems.some((sub) =>
                          location.pathname.startsWith(sub.url)
                        )}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild className="group">
                            <SidebarMenuButton
                              tooltip={item.title}
                              isActive={subItems.some(
                                (sub) => sub.url === location.pathname
                              )}
                            >
                              <item.icon />
                              <span>{item.title}</span>
                              <ChevronRight className="ml-auto transition-transform group-data-[state=open]:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {subItems.map((sub) => (
                                <SidebarMenuSubItem key={sub.url}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={location.pathname === sub.url}
                                  >
                                    <NavLink to={sub.url}>
                                      <span>{sub.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : isDisabled ? (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          tooltip="Select an event first"
                          className="opacity-50 pointer-events-none cursor-not-allowed text-muted-foreground"
                        >
                          <span>
                            <item.icon />
                            <span>{item.title}</span>
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          isActive={location.pathname === item.url}
                        >
                          <NavLink to={item.url!}>
                            <item.icon />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex flex-col gap-2 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/account"
                  className={({ isActive }) =>
                    `flex items-center rounded-md p-1 -m-1 no-underline transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`
                  }
                >
                  <span className="flex flex-row flex-nowrap items-center gap-3 min-w-0 w-full">
                    <Avatar size="sm">
                      {user?.profile_picture_url ? (
                        <AvatarImage
                          src={user.profile_picture_url}
                          alt={getDisplayName(user) || user?.email || "Profile picture"}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(getDisplayName(user) || user?.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex flex-col text-sm min-w-0 shrink text-left group-data-[collapsible=icon]:hidden">
                      <span className="font-medium truncate">
                        {getDisplayName(user) || "Admin"}
                      </span>
                      <span className="text-muted-foreground text-xs truncate">
                        {user?.email ?? user?.role ?? "User"}
                      </span>
                    </span>
                  </span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                align="center"
                hidden={state !== "collapsed" || isMobile}
              >
                {getDisplayName(user) || "Account"}
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center border-b border-border bg-background px-6 py-2 sticky top-0 z-10">
          <div className="flex flex-1 items-center">
            <SidebarTrigger />
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <img
              src="/icon_foreground.png"
              alt="M3T Admin"
              className="h-8 w-auto shrink-0 object-contain"
            />
            <Select
              value={activeOrganizationId ?? ""}
              onValueChange={handleOrganizationSelect}
              disabled={isOrganizationsLoading || isOrganizationsError}
            >
              <SelectTrigger className="w-[200px]" size="sm">
                <SelectValue
                  placeholder={
                    isOrganizationsLoading
                      ? "Loading…"
                      : isOrganizationsError
                        ? "Error loading orgs"
                        : organizations.length === 0
                          ? "No organization"
                          : "Select organization"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={CREATE_NEW_ORG_VALUE}>Create organization</SelectItem>
                <SelectItem value={MANAGE_ORG_VALUE} disabled={!activeOrganizationId}>
                  Manage organization…
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={activeEventId ?? ""}
              onValueChange={handleEventSelect}
              disabled={isEventsLoading || isEventsError}
            >
              <SelectTrigger className="w-[200px]" size="sm">
                <SelectValue
                  placeholder={
                    isEventsLoading
                      ? "Loading…"
                      : isEventsError
                        ? "Error loading events"
                        : filteredEvents.length === 0
                          ? "No events"
                          : "Select event"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
                <SelectItem value={CREATE_NEW_EVENT_VALUE}>
                  Create new event
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1" />
        </div>
        <main className="flex-1 p-6 min-w-0 max-w-full overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </SidebarInset>
      <CreateEventModal open={createEventOpen} onOpenChange={setCreateEventOpen} />
      <CreateOrganizationModal
        open={createOrganizationOpen}
        onOpenChange={setCreateOrganizationOpen}
      />
      <ManageOrganizationSheet
        open={manageOrganizationOpen}
        onOpenChange={setManageOrganizationOpen}
        organization={activeOrganization}
      />
    </>
  )
}

export function AppLayout(): React.ReactElement {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppLayoutInner />
      </SidebarProvider>
    </TooltipProvider>
  )
}
