"use client"
import { usePathname } from "next/navigation"
import React from "react"

export function PageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/login"
  const isLanding = pathname === "/"
  // Add top padding only when we are on dashboard-like views
  const containerClass = isLogin || isLanding ? "flex-1" : "flex-1 pt-4"
  return <div className={containerClass}>{children}</div>
}
