"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { FileText, TrendingUp, AlertCircle, BadgeCheck, Mail, Phone } from "lucide-react"
import { getCachedTeamDetails } from "@/lib/dashboard-cache"

interface LeaderDashboardProps {
  user: any
}

export function TeamLeaderDashboard({ user }: LeaderDashboardProps) {
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: "error"; title: string; message: string } | null>(null)

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const teamData = await getCachedTeamDetails()
        setTeam(teamData)
      } catch (err: any) {
        setFeedback({ type: "error", title: "Error", message: err.message || "Failed to load team" })
      } finally {
        setLoading(false)
      }
    }
    fetchTeam()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-12 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    )
  }

  const leaderFirst = user?.name?.split(" ")[0] || "Leader"

  return (
    <div className="space-y-10">
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight" style={{color:'#002449'}}>Hello {leaderFirst},</h2>
        <p className="text-sm md:text-base text-muted-foreground">Here is an overview of your team and its members.</p>
      </div>

      {feedback && (
        <Card className="p-4 bg-destructive/5 border border-destructive/20">
          <p className="text-destructive font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {feedback.message}
          </p>
        </Card>
      )}

      {team ? (
        <>
          {/* Highlight Section */}
          <Card className="p-6 border-border shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight" style={{color:'#002449'}}>{team.name}</h3>
                {team.problem_statement?.title && (
                  <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3">{team.problem_statement.title}</p>
                )}
              </div>
              {team.problem_statement?.id && (
                <div className="flex items-start gap-2 md:pl-4">
                  <span className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold tracking-wide bg-[#f75700]/10 text-[#f75700] border border-[#f75700]/30 shadow-sm">
                    PS ID: {team.problem_statement.id}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
              <h3 className="text-base font-semibold mb-2" style={{ color: '#002449' }}>Team</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Institution</p>
                  <p className="font-medium text-sm truncate">{team.institution}</p>
                </div>
                {team.problem_statement?.title && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Problem Statement</p>
                    <p className="font-medium text-sm line-clamp-3">{team.problem_statement.title}</p>
                  </div>
                )}
              </div>
            </Card>
            <Card className="p-4 border border-[#007367]/40 shadow-sm hover:shadow-md transition bg-[#007367]/5">
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2" style={{ color: '#007367' }}>
                POC Details {team.poc?.is_verified_poc && <BadgeCheck className="w-4 h-4 text-green-600" />}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 text-muted-foreground"><BadgeCheck className="w-3 h-3 opacity-0" /></div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                    <p className="font-medium text-sm truncate">{team.poc?.name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="font-medium text-sm break-all">{team.poc?.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                    <p className="font-medium text-sm">{team.poc?.phone || '-'}</p>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
              <h3 className="text-base font-semibold mb-2" style={{ color: '#002449' }}>Mentor Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                  <p className="font-medium text-sm truncate">{team.faculty_mentor?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="font-medium text-sm break-all">{team.faculty_mentor?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                  <p className="font-medium text-sm">{team.faculty_mentor?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Designation</p>
                  <p className="font-medium text-sm truncate">{team.faculty_mentor?.designation || '-'}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
              <h3 className="text-base font-semibold mb-2" style={{ color: '#002449' }}>Members</h3>
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {team.members?.map((m: any, i: number) => (
                  <div key={i} className="flex flex-col border-b last:border-b-0 border-border pb-2">
                    <p className="text-sm font-medium truncate">{m.user.name}</p>
                    <p className="text-xs text-muted-foreground break-all">{m.user.email}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {m.phone || "Phone not shared"}
                    </p>
                    <span className="text-[10px] font-semibold mt-0.5 tracking-wide uppercase" style={{ color: '#f75700' }}>{m.role}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No team data available</p>
        </Card>
      )}
    </div>
  )
}
