"use client"

import React, { useMemo, useCallback, useEffect, useState } from "react"
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
  Network,
  FileSignature,
  Plane,
  Phone,
} from "lucide-react"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => Boolean(authService.getAccessToken()))
  // Retrieve current user client-side; returns null on server.
  const user = authService.getCurrentUser()
  const pathname = usePathname()

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
        { href: "/dashboard", label: "Overview", icon: <LayoutDashboard /> },
        { href: "/dashboard/teams", label: "Teams Directory", icon: <Users /> },
        { href: "/dashboard/requests-tracking", label: "Requests Tracking", icon: <ListTodo /> },
        { href: "/queue", label: "Global Queue", icon: <Network /> },
        { href: "/dashboard/documents-verification", label: "Documents Verification", icon: <FileText /> },
        { href: "/view-documents", label: "Detailed Doc Review", icon: <Eye /> },
        { href: "/dashboard/contacts-directory", label: "Contacts Directory", icon: <Phone /> },
      ]
    }
    if (role === "poc") {
      return [
        { href: "/dashboard", label: "POC Dashboard", icon: <LayoutDashboard /> },
        { href: "/queue", label: "Virtual Queue", icon: <ListTodo /> },
        { href: "/poc/document-submission", label: "Document Submission", icon: <FileText /> },
        { href: "/view-documents", label: "View Documents", icon: <Eye /> },
        { href: "/poc/ta-form", label: "TA & Mandate Form", icon: <FileSignature /> },
        { href: "/dashboard/jury-forms", label: "Jury Forms", icon: <Plane /> },
        { href: "/dashboard/contacts-directory", label: "Contacts Directory", icon: <Phone /> },
      ]
    }
    // leader default
    return [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
      { href: "/my-requests", label: "My Requests", icon: <FileText /> },
      { href: "/my-requests/new", label: "New Request", icon: <PlusCircle /> },
    ]
  }, [role])

  const isActive = useCallback(
    (href: string) => {
      const cleanHref = href.split("#")[0]
      if (cleanHref === "/") return pathname === cleanHref
      if (cleanHref === "/my-requests") return pathname.startsWith("/my-requests")
      if (cleanHref === "/dashboard") {
        return pathname === "/dashboard" || pathname === "/dashboard/"
      }
      return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`)
    },
    [pathname],
  )

  const handleLogout = async () => {
    await authService.logout()
    router.push("/login")
  }

  useEffect(() => {
    const ensureAuthorized = () => {
      const token = authService.getAccessToken()
      const currentUser = authService.getCurrentUser()
      if (!token || !currentUser) {
        setIsAuthorized(false)
        router.replace("/login")
      } else {
        setIsAuthorized(true)
      }
    }

    ensureAuthorized()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "sih_access_token") {
        ensureAuthorized()
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  }, [router])

  if (!isAuthorized) {
    return null
  }

  return (
    <SidebarProvider className="bg-white">
      <DashboardNavbar />
      <Sidebar collapsible="offcanvas" className="border-r border-gray-200 mt-[140px] sm:mt-20">
        <SidebarHeader>
          <div className="px-3 py-3">
            <h1 className="text-base font-bold tracking-tight" style={{ color: "#002449" }}>
              SIH | GITAM
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
      <SidebarInset className="mt-[140px] sm:mt-20">
        <div className="flex flex-wrap items-center gap-3 p-2 bg-white">
          <SidebarTrigger />
          <h2 className="text-xs font-semibold text-[#002449] sm:whitespace-nowrap" suppressHydrationWarning>
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
