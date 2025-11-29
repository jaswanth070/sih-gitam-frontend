"use client"

import React, { useMemo, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DashboardNavbar } from "@/components/navigation/dashboard-navbar"
import {
  Users,
  FileText,
  PlusCircle,
  LayoutDashboard,
  ListTodo,
  Eye,
  LogOut,
  Boxes,
  Network,
  FileSignature,
  Plane,
} from "lucide-react"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  // Retrieve current user client-side; returns null on server.
  const user = authService.getCurrentUser()
  const pathname = usePathname()
  const router = useRouter()

  const role: "leader" | "poc" | "admin" | null = user?.is_admin
    ? "admin"
    : user?.is_poc
      ? "poc"
      : user
        ? "leader"
        : null

  const navItems = useMemo(() => {
    if (role === "admin") {
      return [
        { href: "/dashboard", label: "Admin Dashboard", icon: <LayoutDashboard /> },
        { href: "/queue", label: "Global Queue", icon: <Network /> },
        { href: "/requests", label: "All Requests", icon: <Boxes /> },
        { href: "/view-documents", label: "View Documents", icon: <Eye /> },
      ]
    }
    if (role === "poc") {
      return [
        { href: "/dashboard", label: "POC Dashboard", icon: <LayoutDashboard /> },
        { href: "/queue", label: "Virtual Queue", icon: <ListTodo /> },
        { href: "/poc/document-submission", label: "Document Submission", icon: <FileText /> },
        { href: "/view-documents", label: "View Documents", icon: <Eye /> },
        { href: "/poc/mandate-form", label: "Mandate Form", icon: <FileSignature /> },
        { href: "/poc/travel-allowance", label: "Travel Allowance", icon: <Plane /> },
      ]
    }
    // leader default
    return [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
      { href: "/requests", label: "My Requests", icon: <FileText /> },
      { href: "/requests/new", label: "New Request", icon: <PlusCircle /> },
    ]
  }, [role])

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") return pathname === href
      if (href === "/requests") return pathname === "/requests"
      return pathname.startsWith(href)
    },
    [pathname],
  )

  const handleLogout = async () => {
    await authService.logout()
    router.push("/login")
  }

  return (
    <SidebarProvider className="bg-white">
      <DashboardNavbar />
      <Sidebar collapsible="offcanvas" className="border-r border-gray-200 mt-20">
        <SidebarHeader>
          <div className="px-3 py-3">
            <h1 className="text-base font-bold tracking-tight" style={{ color: "#002449" }}>
              SIH Portal
            </h1>
            <p className="text-[11px] font-medium" style={{ color: "#007367" }} suppressHydrationWarning>
              {role === "admin"
                ? "Administrator"
                : role === "poc"
                  ? "POC"
                  : role === "leader"
                    ? "Team Leader"
                    : "Guest"}
            </p>
            <p className="text-[11px] mt-1 text-muted-foreground" suppressHydrationWarning>
              {user?.email || "guest@example.com"}
            </p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <span className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                  </SidebarMenuButton>
                </Link>
                {item.href === "/queue" && role !== "leader" }
              </SidebarMenuItem>
            ))}
            {/* Inline Logout for visibility (remove nested button) */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={false}
                className="justify-between"
                aria-label="Logout"
                onClick={handleLogout}
              >
                <span className="flex items-center gap-2">
                  <LogOut className="text-[#002449]" />
                  <span className="font-semibold text-[#002449]">Logout</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator />
          <SidebarMenu>
            {role === "leader" && (
              <SidebarMenuItem>
                <Link href="/dashboard">
                  <SidebarMenuButton asChild isActive={isActive("/dashboard")}>Team Overview</SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}
            {role === "poc" && (
              <SidebarMenuItem>
                <Link href="/dashboard">
                  <SidebarMenuButton asChild isActive={isActive("/dashboard")}>Assigned Teams</SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={false}
                aria-label="Logout"
                onClick={handleLogout}
              >
                <span className="flex items-center gap-2">
                  <LogOut /> <span>Logout</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="mt-20">
        <div className="flex items-center gap-4 p-2 bg-white">
          <SidebarTrigger />
          <h2 className="text-xs font-semibold whitespace-nowrap" style={{ color: "#002449" }} suppressHydrationWarning>
            {role === "leader" && "Team"}
            {role === "poc" && "POC"}
            {role === "admin" && "Admin"}
            {!role && "Guest"}
            &nbsp;Dashboard
          </h2>
          <div className="ml-auto flex items-center gap-3 pr-2">
            {user?.email && (
              <span className="text-xs text-gray-500 truncate max-w-[160px]" title={user.email}>
                {user.email}
              </span>
            )}
          </div>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
