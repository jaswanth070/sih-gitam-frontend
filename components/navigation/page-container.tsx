"use client"
import { usePathname } from "next/navigation"
import React from "react"

export function PageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/login"
  // Add top padding only when not on login (no banner on dashboards)
  return (
    <div className={isLogin ? "flex-1" : "flex-1 pt-4"}>{children}</div>
  )
}
