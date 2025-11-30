"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { authService } from "@/lib/auth-service"

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<"leader" | "poc" | "admin" | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const token = authService.getAccessToken()
    if (!token) {
      router.push("/login")
      return
    }

    try {
      const parts = token.split(".")
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]))
        if (decoded.is_admin) {
          setUserRole("admin")
        } else if (decoded.is_poc) {
          setUserRole("poc")
        } else {
          setUserRole("leader")
        }
      }
    } catch (err) {
      console.error("Error decoding token:", err)
    }
  }, [router])

  const navItems =
    userRole === "admin"
      ? [
          { href: "/dashboard", label: "Dashboard", icon: "🛡️" },
          { href: "/dashboard/teams", label: "Teams", icon: "👥" },
          { href: "/dashboard#all-requests", label: "All Requests", icon: "📦" },
          { href: "/dashboard/requests-tracking", label: "Requests Tracking", icon: "📈" },
          { href: "/queue", label: "Global Queue", icon: "📋" },
          { href: "/dashboard/documents-verification", label: "Documents Verification", icon: "📂" },
          { href: "/view-documents", label: "Detailed Doc Review", icon: "🗂️" },
        ]
      : userRole === "poc"
        ? [
            { href: "/dashboard", label: "Dashboard", icon: "📊" },
            { href: "/queue", label: "Virtual Queue", icon: "📋" },
            { href: "/poc/document-submission", label: "Document Submission", icon: "📂" },
            { href: "/poc/mandate-form", label: "Mandate Form", icon: "🖨️" },
            { href: "/poc/travel-allowance", label: "Travel Allowance", icon: "✈️" },
          ]
        : [
            { href: "/dashboard", label: "Dashboard", icon: "🏠" },
            { href: "/my-requests", label: "My Requests", icon: "📝" },
            { href: "/my-requests/new", label: "New Request", icon: "➕" },
          ]

  const isActive = (href: string) => {
    const baseHref = href.split("#")[0]
    if (baseHref === "/my-requests") {
      if (pathname === "/my-requests") return true
      return pathname.startsWith("/my-requests/") && !pathname.startsWith("/my-requests/new")
    }
    if (baseHref === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname === baseHref || pathname.startsWith(`${baseHref}/`)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg border border-gray-200 bg-white"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-40 transition-transform md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold" style={{ color: "#002449" }}>
            SIH | GITAM
          </h2>
          <p className="text-xs mt-1" style={{ color: "#007367" }}>
            {userRole === "admin"
              ? "Admin Control Center"
              : userRole === "poc"
                ? "POC Dashboard"
                : "Team Leader Dashboard"}
          </p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive(item.href) ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={async () => {
              await authService.logout()
              router.push("/login")
            }}
            className="w-full px-4 py-2 text-white font-medium rounded-lg transition-opacity"
            style={{ backgroundColor: "#f75700" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
