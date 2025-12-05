"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Loader2,
  LogOut,
  MapPin,
  User2,
} from "lucide-react"

import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authService, type AdminTeamSummary, type POCTeam } from "@/lib/auth-service"

interface CheckInTeam extends Partial<AdminTeamSummary>, Partial<POCTeam> {
  id: string
  name: string
  institution?: string
  team_id?: string
  members_checked_in?: boolean
  members_checked_out?: boolean
  room_allocation?: string | null
  check_in_remarks?: string | null
  check_in_timestamp?: string | null
  check_in_recorded_by?: AdminTeamSummary["check_in_recorded_by"]
  check_out_timestamp?: string | null
  check_out_recorded_by?: AdminTeamSummary["check_out_recorded_by"]
}

export default function CheckInOverviewPage() {
  const router = useRouter()
  const currentUser = authService.getCurrentUser()
  const role = currentUser?.is_admin ? "admin" : currentUser?.is_poc ? "poc" : null

  const [teams, setTeams] = useState<CheckInTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTeams = useCallback(async () => {
    if (!role) return
    setLoading(true)
    setError(null)
    try {
      if (role === "admin") {
        const data = await authService.getAdminTeams()
        setTeams(data)
      } else {
        const data = await authService.getPOCTeams()
        setTeams(data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load teams"
      setError(message)
      setTeams([])
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    if (!role) return
    void loadTeams()
  }, [role, loadTeams])

  const checkedInCount = useMemo(() => teams.filter((team) => team.members_checked_in).length, [teams])
  const checkedOutCount = useMemo(() => teams.filter((team) => team.members_checked_out).length, [teams])
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [],
  )
  const formatTimestamp = useCallback(
    (value?: string | null) => {
      if (!value) return null
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return null
      return dateFormatter.format(date)
    },
    [dateFormatter],
  )
  const formatRecordedBy = useCallback(
    (contact?: AdminTeamSummary["check_in_recorded_by"]) => contact?.name || contact?.email || "—",
    [],
  )

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#002449" }}>
            Check-In Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Review assigned teams and jump straight into updating on-site arrivals, room allocations, and remarks.
          </p>
        </header>

        {!role && (
          <Card className="border border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="h-4 w-4" /> Access restricted
              </CardTitle>
              <CardDescription className="text-xs text-destructive/80">
                Only administrators and verified POCs can manage check-in details.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {error && (
          <Card className="border border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="h-4 w-4" /> {error}
              </CardTitle>
              <CardDescription className="text-xs text-destructive/80">
                Try refreshing or contact the operations desk if the problem continues.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {role && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-col gap-2 pb-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base font-semibold" style={{ color: "#002449" }}>
                  Overview
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {teams.length} team{teams.length === 1 ? "" : "s"} assigned · {checkedInCount} checked in · {checkedOutCount} checked out
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        )}

        {role && (
          <div className="min-h-[200px]">
            {loading ? (
              <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : teams.length === 0 ? (
              <Card className="p-10 text-center">
                <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">No teams assigned.</p>
                <p className="text-xs text-muted-foreground">Check back once assignments are published for your role.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {teams.map((team) => {
                  const checkedOut = Boolean(team.members_checked_out)
                  const checkedIn = Boolean(team.members_checked_in)
                  const statusLabel = checkedOut ? "Checked out" : checkedIn ? "Checked in" : "Pending"
                  const statusClass = checkedOut
                    ? "gap-1 border-slate-200 bg-slate-100 text-slate-700"
                    : checkedIn
                      ? "gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "gap-1 border-amber-200 bg-amber-50 text-amber-700"
                  const statusIcon = checkedOut ? <LogOut className="h-3.5 w-3.5" /> : checkedIn ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />
                  const statusHelper = checkedOut
                    ? "Team has departed"
                    : checkedIn
                      ? "Arrival confirmed"
                      : "Awaiting arrival"
                  return (
                    <Card key={team.id} className="flex h-full flex-col justify-between border border-gray-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <CardTitle className="text-base font-semibold leading-tight" style={{ color: "#002449" }}>
                              {team.name}
                            </CardTitle>
                            {team.team_id && (
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">{team.team_id}</p>
                            )}
                            {team.institution && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" /> {team.institution}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={statusClass}
                          >
                            {statusIcon} {statusLabel}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {team.room_allocation || "Room not assigned"}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{statusHelper}</p>
                        <div className="grid grid-cols-1 gap-2 text-[11px] text-muted-foreground">
                          <div className="rounded border border-muted/40 bg-muted/10 p-2">
                            <p className="text-[10px] uppercase tracking-wide">Checked in</p>
                            <p className="mt-0.5 text-sm font-semibold text-[#002449]">
                              {formatTimestamp(team.check_in_timestamp) ?? "Not recorded"}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1">
                              <User2 className="h-3 w-3" /> {formatRecordedBy(team.check_in_recorded_by)}
                            </p>
                          </div>
                          <div className="rounded border border-muted/40 bg-muted/10 p-2">
                            <p className="text-[10px] uppercase tracking-wide">Checked out</p>
                            <p className="mt-0.5 text-sm font-semibold text-[#002449]">
                              {formatTimestamp(team.check_out_timestamp) ?? "Not recorded"}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1">
                              <User2 className="h-3 w-3" /> {formatRecordedBy(team.check_out_recorded_by)}
                            </p>
                          </div>
                        </div>
                        {team.check_in_remarks && (
                          <p className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground line-clamp-3">
                            {team.check_in_remarks}
                          </p>
                        )}
                        <Button size="sm" className="w-full gap-2" onClick={() => router.push(`/dashboard/check-in/${team.id}`)}>
                          Update check-in
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
