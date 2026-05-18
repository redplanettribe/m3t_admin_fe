import * as React from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { ArrowLeft, LayoutDashboard, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getDisplayName, getInitials } from "@/lib/user"
import { useUserStore } from "@/store/userStore"

type SystemNavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

const systemNavMain: SystemNavItem[] = [
  {
    title: "Overview",
    url: "/system",
    icon: LayoutDashboard,
    end: true,
  },
]

function SystemAdminLayoutInner(): React.ReactElement {
  const location = useLocation()
  const user = useUserStore((s) => s.user)
  const { state, isMobile } = useSidebar()

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center">
            <Shield className="size-5 shrink-0 text-primary" aria-hidden />
            <span className="font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Platform
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemNavMain.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={
                        item.end
                          ? location.pathname === item.url
                          : location.pathname.startsWith(item.url)
                      }
                    >
                      <NavLink to={item.url} end={item.end}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Event admin">
                    <NavLink to="/">
                      <ArrowLeft />
                      <span>Event admin</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
                        {user?.email ?? "System admin"}
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
        <header className="flex items-center gap-3 border-b border-border bg-background px-6 py-3 sticky top-0 z-10">
          <SidebarTrigger />
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <img
              src="/icon_foreground.png"
              alt="M3T"
              className="h-8 w-auto shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Platform administration
              </p>
            </div>
          </div>
        </header>
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </>
  )
}

export function SystemAdminLayout(): React.ReactElement {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <SystemAdminLayoutInner />
      </SidebarProvider>
    </TooltipProvider>
  )
}
