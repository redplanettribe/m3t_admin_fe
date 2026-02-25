import { createBrowserRouter, type RouteObject } from "react-router-dom"
import { AppLayout } from "@/components/AppLayout"
import { AuthLayout } from "@/components/AuthLayout"
import { RequireAuth } from "@/components/RequireAuth"
import { AccountPage } from "@/pages/AccountPage"
import { HomePage } from "@/pages/HomePage"
import { EventsPage } from "@/pages/EventsPage"
import { EventNewPage } from "@/pages/EventNewPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { LoginPage } from "@/pages/LoginPage"
import { SchedulePage } from "@/pages/SchedulePage"
import { TeamMembersPage } from "@/pages/TeamMembersPage"
import { AttendeesPage } from "@/pages/AttendeesPage"
import { RoomsPage } from "@/pages/RoomsPage"
import { RoomDetailPage } from "@/pages/RoomDetailPage"

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "account",
        element: <AccountPage />,
      },
      {
        path: "events",
        element: <EventsPage />,
      },
      {
        path: "events/new",
        element: <EventNewPage />,
      },
      {
        path: "schedule",
        element: <SchedulePage/>,
      },
      {
        path: "rooms",
        element: <RoomsPage />,
      },
      {
        path: "rooms/:roomId",
        element: <RoomDetailPage />,
      },
      {
        path: "team-members",
        element: <TeamMembersPage />,
      },
      {
        path: "attendees",
        element: <AttendeesPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
