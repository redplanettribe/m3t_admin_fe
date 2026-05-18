import * as React from "react"

export function SystemAdminPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">
        System administration
      </h2>
      <p className="text-muted-foreground">
        Platform tools for system administrators. Access is verified on each
        visit by the server.
      </p>

      <section className="space-y-2 rounded-lg border p-4">
        <h3 className="font-medium">Platform tools</h3>
        <p className="text-sm text-muted-foreground">
          Additional system administration features will appear here.
        </p>
      </section>
    </div>
  )
}
