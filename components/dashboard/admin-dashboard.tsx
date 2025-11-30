"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  BarChart3,
  ClipboardList,
  FileCheck2,
  FileText,
  FolderOpen,
  ListOrdered,
  Loader2,
  Lock,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

import { authService, type AdminTeamSummary } from "@/lib/auth-service"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AdminDashboardProps {
  user: Record<string, any> | null
}

interface NavigationLink {
  href: string
  label: string
  description: string
  icon: LucideIcon
}

const adminNavigationLinks: NavigationLink[] = [
  {
    href: "/dashboard/teams",
    label: "Teams",
    description: "",
    icon: Users,
  },
  {
    href: "/dashboard#all-requests",
    label: "All Requests",
    description: "",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/requests-tracking",
    label: "Requests Tracking",
    description: "",
    icon: BarChart3,
  },
  {
    href: "/dashboard/documents-verification",
    label: "Documents Verification",
    description: "",
    icon: FileCheck2,
  },
  {
    href: "/queue",
    label: "Global Queue",
    description: "",
    icon: ListOrdered,
  },
  {
    href: "/view-documents",
    label: "Detailed Doc Review",
    description: "",
    icon: FolderOpen,
  },
]

interface AdminConsoleLink {
  href: string
  label: string
  description: string
  icon: LucideIcon
}

const adminConsoleLinks: AdminConsoleLink[] = [
  {
    href: "/adminin-auth/",
    label: "Auth Console",
    description: "Requires Special Access",
    icon: Lock,
  },
  {
    href: "/admin-ops/",
    label: "Operations Console",
    description: "Requires Special Access",
    icon: Settings,
  },
  {
    href: "/admin-docs/",
    label: "Documents Console",
    description: "Requires Special Access",
    icon: FileText,
  },
]

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [teams, setTeams] = useState<AdminTeamSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await authService.getAdminTeams()
      setTeams(data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load teams right now."
      setError(message)
      setTeams([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const totalTeams = teams.length
  const totalMembers = useMemo(
    () => teams.reduce((acc, team) => acc + (team.members?.length || 0), 0),
    [teams],
  )
  const uniqueInstitutions = useMemo(() => {
    const institutions = new Set<string>()
    teams.forEach((team) => {
      if (team.institution) {
        institutions.add(team.institution)
      }
    })
    return institutions.size
  }, [teams])

  const pageTitle = useMemo(() => {
    const name = user?.name?.split(" ")[0] || "Admin"
    return `Welcome, ${name}`
  }, [user?.name])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "#002449" }}>
            <ShieldCheck className="h-6 w-6 text-[#002449]" /> {pageTitle}
          </h1>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={fetchTeams} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Refresh
        </Button>
      </header>

      {error && (
        <Card className="flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-4" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Teams</p>
              <p className="text-2xl font-bold" style={{ color: "#002449" }}>{loading ? "—" : totalTeams}</p>
            </div>
            <Users className="h-8 w-8 text-[#002449]" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {loading ? "Fetching teams…" : `${totalMembers} participants across all registered squads.`}
          </p>
        </Card>
        <Card className="p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Participants</p>
              <p className="text-2xl font-bold" style={{ color: "#002449" }}>{loading ? "—" : totalMembers}</p>
            </div>
            <ShieldCheck className="h-8 w-8 text-[#002449]" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {loading ? "Standing by…" : "Includes leaders, members, and verified mentors."}
          </p>
        </Card>
        <Card className="p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Institutions</p>
              <p className="text-2xl font-bold" style={{ color: "#002449" }}>{loading ? "—" : uniqueInstitutions}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-[#002449]" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {loading ? "Checking diversity…" : "Distinct campuses contributing to this cohort."}
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold" style={{ color: "#002449" }}>Super admin shortcuts</h2>
          <p className="text-xs text-muted-foreground">Open the server-side consoles in a new tab for deeper management.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {adminConsoleLinks.map((link) => {
            const Icon = link.icon
            return (
              <Button
                key={link.href}
                asChild
                variant="outline"
                className="border border-[#002449]/40 bg-white text-[#002449] shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 hover:shadow-md"
              >
                <Link href={link.href} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold">{link.label}</span>
                    <span className="text-[10px] text-muted-foreground">{link.description}</span>
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "#002449" }}>Quick navigation</h2>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-[#002449]" />}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminNavigationLinks.map((link) => {
            const Icon = link.icon
            return (
              <Card
                key={link.href}
                className="group h-full border border-gray-200 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: "#002449" }}>
                      {link.label}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>
                  </div>
                  <Icon className="h-8 w-8 text-[#002449] transition-colors group-hover:text-orange-500" />
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="mt-6 w-fit border border-[#002449]/40 bg-white px-3 text-[#002449] font-semibold shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:border-orange-400 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:shadow-md"
                >
                  <Link href={link.href}>Open</Link>
                </Button>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
