import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function HomePage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Home</h2>
      <p className="text-muted-foreground">
        Welcome to the M3T event admin. Use the layout and navigation to manage events and settings.
      </p>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            This is a simple initial page. Add more routes and TanStack Query hooks as you build.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Example button</Button>
        </CardContent>
      </Card>
    </div>
  )
}
