import * as React from "react"
import { Link } from "react-router-dom"
import { CalendarDays, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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

      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="font-medium">Platform tools</h3>
        <p className="text-sm text-muted-foreground">
          Browse and filter all events across the platform.
        </p>
        <Button variant="outline" asChild>
          <Link to="/system/events">
            <CalendarDays className="size-4" />
            Explore events
          </Link>
        </Button>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="font-medium">UGC social networks</h3>
        <p className="text-sm text-muted-foreground">
          Manage which social networks are available for user-generated content
          on events.
        </p>
        <Button variant="outline" asChild>
          <Link to="/system/ugc/social-networks">
            <Share2 className="size-4" />
            Manage UGC networks
          </Link>
        </Button>
      </section>
    </div>
  )
}
