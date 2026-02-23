import * as React from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { CalendarDays, ChevronRight, Home, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
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
import { useEventsMe } from "@/hooks/useEvents"
import { useEventStore } from "@/store/eventStore"
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
    title: "Schedule",
    url: "/schedule",
    icon: CalendarDays,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function AppLayoutInner(): React.ReactElement {
  const location = useLocation()
  const user = useUserStore((s) => s.user)
  const activeEventId = useEventStore((s) => s.activeEventId)
  const setActiveEventId = useEventStore((s) => s.setActiveEventId)
  const { data: events = [], isLoading, isError } = useEventsMe()
  const { state, isMobile } = useSidebar()

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="group-data-[collapsible=icon]:hidden">
            <Select
              value={activeEventId ?? ""}
              onValueChange={(id) => setActiveEventId(id || null)}
              disabled={isLoading || isError}
            >
              <SelectTrigger className="w-full" size="sm">
                <SelectValue
                  placeholder={
                    isLoading ? "Loading…" : isError ? "Error loading events" : "Select event"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navMain.map((item) => {
                    const subItems = "items" in item ? item.items : undefined
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
                    `flex items-center gap-2 rounded-md p-1 -m-1 no-underline transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`
                  }
                >
                  <Avatar>
                    <AvatarFallback>
                      {user ? (
                        getInitials(user.name)
                      ) : (
                        <User className="size-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-sm min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="font-medium truncate">
                      {user?.name ?? "Admin"}
                    </span>
                    <span className="text-muted-foreground text-xs truncate">
                      {user?.email ?? user?.role ?? "User"}
                    </span>
                  </div>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                align="center"
                hidden={state !== "collapsed" || isMobile}
              >
                {user?.name ?? "Account"}
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center gap-2 border-b border-border bg-background px-6 py-2 sticky top-0 z-10">
          <SidebarTrigger />
        </div>
        <main className="flex-1 p-6 min-w-0 max-w-full overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </SidebarInset>
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
