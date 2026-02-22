import * as React from "react"
import { Outlet } from "react-router-dom"

export function AppLayout(): React.ReactElement {
  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b bg-muted/30 px-6 py-4">
        <h1 className="text-lg font-semibold">M3T Admin</h1>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
