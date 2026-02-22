import { createBrowserRouter, type RouteObject } from "react-router-dom"
import { AppLayout } from "@/components/AppLayout"
import { HomePage } from "@/pages/HomePage"

const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
