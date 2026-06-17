import { createBrowserRouter, type RouteObject } from "react-router-dom"
import { AppLayout } from "@/components/AppLayout"
import { SystemAdminLayout } from "@/components/SystemAdminLayout"
import { AuthLayout } from "@/components/AuthLayout"
import { RequireAuth } from "@/components/RequireAuth"
import { RequireSystemAdmin } from "@/components/RequireSystemAdmin"
import { AccountPage } from "@/pages/AccountPage"
import { HomePage } from "@/pages/HomePage"
import { EventsPage } from "@/pages/EventsPage"
import { EventNewPage } from "@/pages/EventNewPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { LoginPage } from "@/pages/LoginPage"
import { SchedulePage } from "@/pages/SchedulePage"
import { SessionsPage } from "@/pages/SessionsPage"
import { TeamMembersPage } from "@/pages/TeamMembersPage"
import { AttendeesPage } from "@/pages/AttendeesPage"
import { RoomsPage } from "@/pages/RoomsPage"
import { RoomDetailPage } from "@/pages/RoomDetailPage"
import { SessionDetailPage } from "@/pages/SessionDetailPage"
import { SpeakerDetailPage } from "@/pages/SpeakerDetailPage"
import { SpeakersPage } from "@/pages/SpeakersPage"
import { TiersPage } from "@/pages/TiersPage"
import { DeliverablesPage } from "@/pages/DeliverablesPage"
import { AnnouncementsPage } from "@/pages/AnnouncementsPage"
import { LiveDashboardPage } from "@/pages/LiveDashboardPage"
import { LiveRedirectPage } from "@/pages/LiveRedirectPage"
import { EventChatPage } from "@/pages/EventChatPage"
import { EventAttendeeProfilePage } from "@/pages/EventAttendeeProfilePage"
import { ChatRedirectPage } from "@/pages/ChatRedirectPage"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { SystemAdminPage } from "@/pages/SystemAdminPage"
import { SystemEventsPage } from "@/pages/SystemEventsPage"
import { SystemUgcSocialNetworksPage } from "@/pages/SystemUgcSocialNetworksPage"
import { RequireEventNotEnded } from "@/components/RequireEventNotEnded"

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
        path: "sessions",
        element: <SessionsPage />,
      },
      {
        path: "events/:eventId/sessions/:sessionId",
        element: <SessionDetailPage />,
      },
      {
        path: "events/:eventId/speakers/:speakerId",
        element: <SpeakerDetailPage />,
      },
      {
        path: "speakers",
        element: <SpeakersPage />,
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
        path: "announcements",
        element: <AnnouncementsPage />,
      },
      {
        path: "tiers",
        element: <TiersPage />,
      },
      {
        path: "deliverables",
        element: <DeliverablesPage />,
      },
      {
        path: "live",
        element: <LiveRedirectPage />,
      },
      {
        path: "chat",
        element: <ChatRedirectPage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
      {
        path: "events/:eventId/live",
        element: (
          <RequireEventNotEnded>
            <LiveDashboardPage />
          </RequireEventNotEnded>
        ),
      },
      {
        path: "events/:eventId/chat",
        element: (
          <RequireEventNotEnded>
            <EventChatPage />
          </RequireEventNotEnded>
        ),
      },
      {
        path: "events/:eventId/attendees/:userId",
        element: (
          <RequireEventNotEnded>
            <EventAttendeeProfilePage />
          </RequireEventNotEnded>
        ),
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: "/system",
    element: (
      <RequireAuth>
        <RequireSystemAdmin>
          <SystemAdminLayout />
        </RequireSystemAdmin>
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <SystemAdminPage />,
      },
      {
        path: "events",
        element: <SystemEventsPage />,
      },
      {
        path: "ugc/social-networks",
        element: <SystemUgcSocialNetworksPage />,
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
