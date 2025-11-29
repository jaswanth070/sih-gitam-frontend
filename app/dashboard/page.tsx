"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { authService } from "@/lib/auth-service"
import { getCachedPOCTeams } from "@/lib/dashboard-cache"
import { TeamLeaderDashboard } from "./team-leader"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { Users, FileText, AlertCircle, ExternalLink, Layers, Building2, User2 } from "lucide-react"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<"leader" | "poc" | "admin" | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const accessToken = authService.getAccessToken()
    if (!accessToken) {
      router.push("/login")
      return
    }
    try {
      const parts = accessToken.split(".")
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]))
        if (decoded.is_admin) setUserRole("admin")
        else if (decoded.is_poc) setUserRole("poc")
        else setUserRole("leader")
        setCurrentUser(decoded)
      }
    } catch (err) {
      console.error("Error decoding token:", err)
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <DashboardShell>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Loading dashboard...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
    {userRole === "admin" && <AdminDashboard user={currentUser} />}
      {userRole === "leader" && <TeamLeaderDashboard user={currentUser} />}
      {userRole === "poc" && <POCDashboard user={currentUser} />}
      {!userRole && (
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">Unable to determine user role</p>
        </Card>
      )}
    </DashboardShell>
  )
}
// TeamLeaderDashboard now modularized in components/dashboard/team-leader-dashboard.tsx

function POCDashboard({ user }: { user: any }) {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: "error"; title: string; message: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await getCachedPOCTeams()
        setTeams(teamsData)
      } catch (err: any) {
        setFeedback({ type: "error", title: "Error", message: err.message || "Failed to load teams" })
      } finally {
        setLoading(false)
      }
    }
    fetchTeams()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-12 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6" aria-label="POC dashboard overview">
      <header className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2" style={{color:'#002449'}}>
          <Users className="w-6 h-6 text-[#002449]" /> Welcome, {user?.name?.split(' ')[0] || 'POC'}
        </h2>
        <p className="text-sm text-muted-foreground">Focused view of assigned teams.</p>
      </header>

      {feedback && (
        <Card className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg" role="alert" aria-live="polite">
          <p className="text-destructive font-medium flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" /> {feedback.message}
          </p>
        </Card>
      )}

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" aria-label="Assigned teams list">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} onView={() => router.push(`/poc/teams/${team.id}`)} />
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center rounded-xl">
          <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">No teams assigned yet</p>
          <p className="text-xs text-muted-foreground mt-1">Check back later for team assignments</p>
        </Card>
      )}
    </div>
  )
}

// Reusable compact team card
function TeamCard({ team, onView }: { team: any; onView: () => void }) {
  // Attempt to derive leader name from members if provided
  const leaderName = Array.isArray(team.members)
    ? (team.members.find((m: any) => m.role?.toLowerCase() === 'leader')?.user?.name || '-')
    : (team.leader_name || '-')
  const problemId = team.problem_statement?.id
  return (
    <Card
      role="group"
      aria-label={`Team ${team.name}`}
      className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-base leading-snug line-clamp-2" style={{color:'#002449'}}>{team.name}</h3>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
        <User2 className="w-3 h-3" /> Leader: <span className="font-medium">{leaderName}</span>
      </p>
      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
        <Building2 className="w-3 h-3" /> {team.institution}
      </p>
      {problemId && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold tracking-wide bg-[#f75700]/10 text-[#f75700] border border-[#f75700]/30 w-fit">
          <Layers className="w-3 h-3" /> PS ID: {problemId}
        </span>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          onClick={onView}
          size="sm"
          variant="outline"
          className="shrink-0 gap-1 text-xs"
          aria-label={`View details for team ${team.name}`}
        >
          View <ExternalLink className="w-3 h-3" />
        </Button>
        <Button asChild size="sm" className="shrink-0 gap-1 text-xs bg-[#002449] hover:bg-[#001a33] text-white">
          <Link href={`/poc/document-submission?teamId=${team.id}`} aria-label={`Document submission for team ${team.name}`}>
            Documents
          </Link>
        </Button>
      </div>
    </Card>
  )
}

// (MetaBadge removed as per requirements: no extra counts/docs shown)
