import type React from "react"
import type { Metadata } from "next"
import { DashboardShell } from "@/components/navigation/dashboard-shell"

export const metadata: Metadata = {
  title: "Request Details - SIH Portal",
  description: "View and manage request details",
}

export default function RequestDetailsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
