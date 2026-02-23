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
import { SignUpPage } from "@/pages/SignUpPage"
import { SchedulePage } from "@/pages/SchedulePage"
import { TeamMembersPage } from "@/pages/TeamMembersPage"

const routes: RouteObject[] = [
  {
    path: "/signup",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <SignUpPage />,
      },
    ],
  },
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
        path: "team-members",
        element: <TeamMembersPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
