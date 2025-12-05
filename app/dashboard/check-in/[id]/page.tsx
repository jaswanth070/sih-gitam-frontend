"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  User2,
  Users,
} from "lucide-react"

import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { authService, type CheckInUpdatePayload, type TeamContact, type TeamDetails } from "@/lib/auth-service"

function CheckInStatusBadge({
  checkedIn,
  checkedOut,
}: {
  checkedIn?: boolean
  checkedOut?: boolean
}) {
  if (checkedOut) {
    return (
      <Badge variant="outline" className="gap-1 border-slate-200 bg-slate-100 text-slate-700">
        <LogOut className="h-3.5 w-3.5" /> Checked out
      </Badge>
    )
  }

  if (checkedIn) {
    return (
      <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Checked in
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700">
      <Clock3 className="h-3.5 w-3.5" /> Pending arrival
    </Badge>
  )
}

function formatTimestamp(value: string | null | undefined, formatter: Intl.DateTimeFormat): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return formatter.format(date)
}

function StatusDetailRow({
  label,
  timestamp,
  recordedBy,
  formatter,
}: {
  label: string
  timestamp?: string | null
  recordedBy?: TeamContact | null
  formatter: Intl.DateTimeFormat
}) {
  const formatted = formatTimestamp(timestamp, formatter)
  const recordedName = recordedBy?.name || recordedBy?.email || "—"

  return (
    <div className="rounded-md border border-border/50 bg-white p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#002449]">{formatted ?? "Not recorded"}</p>
      <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
        <User2 className="h-3.5 w-3.5" /> {recordedName}
      </p>
    </div>
  )
}

const CHECK_OUT_UNLOCK_DATE = new Date(Date.UTC(2025, 11, 12))

export default function TeamCheckInPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string
  const { toast } = useToast()

  const [team, setTeam] = useState<TeamDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<"check-in" | "check-out" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<CheckInUpdatePayload>({
    members_checked_in: false,
    members_checked_out: false,
    check_in_remarks: "",
    room_allocation: "",
  })
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [],
  )
  const checkoutUnlockLabel = useMemo(() => dateFormatter.format(CHECK_OUT_UNLOCK_DATE), [dateFormatter])

  const currentUser = authService.getCurrentUser()
  const userRole = currentUser?.is_admin
    ? "admin"
    : currentUser?.is_volunteer
      ? "volunteer"
      : currentUser?.is_poc
        ? "poc"
        : null

  const loadTeam = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    setError(null)
    try {
      let detail: TeamDetails
      if (userRole === "poc") {
        detail = await authService.getPOCTeamDetail(teamId)
      } else {
        detail = await authService.getVolunteerTeamDetail(teamId)
      }
      setTeam(detail)
      setFormState({
        members_checked_in: Boolean(detail.members_checked_in),
        members_checked_out: Boolean(detail.members_checked_out),
        check_in_remarks: detail.check_in_remarks ?? "",
        room_allocation: detail.room_allocation ?? "",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load team details"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [teamId, userRole])

  useEffect(() => {
    void loadTeam()
  }, [loadTeam])

  const totalMembers = useMemo(() => team?.members?.length ?? 0, [team?.members])

  const handleSubmit = useCallback(async () => {
    if (!teamId) return
    setSaving(true)
    setActionLoading(null)
    setError(null)
    try {
      const payload: CheckInUpdatePayload = {
        members_checked_in: Boolean(formState.members_checked_in),
        members_checked_out: Boolean(formState.members_checked_out),
        check_in_remarks: formState.check_in_remarks ?? "",
        room_allocation: formState.room_allocation ?? "",
      }
      const updated = await authService.updateTeamCheckIn(teamId, payload, "PATCH")
      setTeam(updated)
      setFormState({
        members_checked_in: Boolean(updated.members_checked_in),
        members_checked_out: Boolean(updated.members_checked_out),
        check_in_remarks: updated.check_in_remarks ?? "",
        room_allocation: updated.room_allocation ?? "",
      })
      toast({ title: "Check-in updated", description: `Saved details for ${updated.name}.` })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update check-in"
      setError(message)
      toast({ variant: "destructive", title: "Update failed", description: message })
    } finally {
      setSaving(false)
    }
  }, [formState, teamId, toast])

  const handleReset = useCallback(async () => {
    if (!teamId) return
    setSaving(true)
    setActionLoading(null)
    setError(null)
    try {
      const resetPayload: CheckInUpdatePayload = {
        members_checked_in: false,
        members_checked_out: false,
        check_in_remarks: "",
        room_allocation: "",
      }
      const updated = await authService.updateTeamCheckIn(teamId, resetPayload, "PUT")
      setTeam(updated)
      setFormState({
        members_checked_in: Boolean(updated.members_checked_in),
        members_checked_out: Boolean(updated.members_checked_out),
        check_in_remarks: updated.check_in_remarks ?? "",
        room_allocation: updated.room_allocation ?? "",
      })
      toast({ title: "Check-in reset", description: "Cleared check-in information." })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reset check-in"
      setError(message)
      toast({ variant: "destructive", title: "Reset failed", description: message })
    } finally {
      setSaving(false)
    }
  }, [teamId, toast])

  const handleQuickAction = useCallback(
    async (action: "check-in" | "check-out") => {
      if (!teamId) return
      const isCheckout = action === "check-out"
      const now = Date.now()
      const checkoutWindowOpen = now >= CHECK_OUT_UNLOCK_DATE.getTime()
      const hasCheckedIn = Boolean(formState.members_checked_in || team?.members_checked_in)

      if (isCheckout && !hasCheckedIn) {
        toast({
          variant: "destructive",
          title: "Checkout blocked",
          description: "Complete check-in before marking a team as checked out.",
        })
        return
      }

      if (isCheckout && !checkoutWindowOpen) {
        toast({
          variant: "destructive",
          title: "Checkout not yet available",
          description: `Checkout opens on ${checkoutUnlockLabel}.`,
        })
        return
      }

      setSaving(true)
      setActionLoading(action)
      setError(null)
      try {
        const payload: CheckInUpdatePayload = {
          members_checked_in: action === "check-in",
          members_checked_out: action === "check-out",
          check_in_remarks: formState.check_in_remarks ?? "",
          room_allocation: formState.room_allocation ?? "",
        }
        const updated = await authService.updateTeamCheckIn(teamId, payload, "PATCH")
        setTeam(updated)
        setFormState({
          members_checked_in: Boolean(updated.members_checked_in),
          members_checked_out: Boolean(updated.members_checked_out),
          check_in_remarks: updated.check_in_remarks ?? "",
          room_allocation: updated.room_allocation ?? "",
        })
        toast({
          title: action === "check-in" ? "Team checked in" : "Team checked out",
          description: `Recorded ${action === "check-in" ? "arrival" : "departure"} for ${updated.name}.`,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update team status"
        setError(message)
        toast({ variant: "destructive", title: "Update failed", description: message })
      } finally {
        setSaving(false)
        setActionLoading(null)
      }
    },
    [checkoutUnlockLabel, formState.check_in_remarks, formState.members_checked_in, formState.room_allocation, team?.members_checked_in, teamId, toast],
  )

  const isDirty = useMemo(() => {
    if (!team) return false
    const baseline = {
      members_checked_in: Boolean(team.members_checked_in),
      members_checked_out: Boolean(team.members_checked_out),
      check_in_remarks: (team.check_in_remarks ?? "").trim(),
      room_allocation: (team.room_allocation ?? "").trim(),
    }
    const current = {
      members_checked_in: Boolean(formState.members_checked_in),
      members_checked_out: Boolean(formState.members_checked_out),
      check_in_remarks: (formState.check_in_remarks ?? "").trim(),
      room_allocation: (formState.room_allocation ?? "").trim(),
    }
    return (
      baseline.members_checked_in !== current.members_checked_in ||
      baseline.members_checked_out !== current.members_checked_out ||
      baseline.check_in_remarks !== current.check_in_remarks ||
      baseline.room_allocation !== current.room_allocation
    )
  }, [formState, team])

  const hasCheckedIn = Boolean(formState.members_checked_in)
  const hasCheckedOut = Boolean(formState.members_checked_out)
  const isCheckoutWindowOpen = Date.now() >= CHECK_OUT_UNLOCK_DATE.getTime()
  const teamCheckedIn = Boolean(team?.members_checked_in)
  const teamCheckedOut = Boolean(team?.members_checked_out)
  const statusHelper = teamCheckedOut
    ? "Team has departed"
    : teamCheckedIn
      ? "Arrival confirmed"
      : "Awaiting arrival"

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#002449" }}>
              {team?.name || "Loading team"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {team?.team_id && <Badge variant="outline">Code • {team.team_id}</Badge>}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Check-in status</span>
                <CheckInStatusBadge checkedIn={team?.members_checked_in} checkedOut={team?.members_checked_out} />
              </div>
              {team?.room_allocation && (
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                  Room • {team.room_allocation}
                </Badge>
              )}
            </div>
          </div>
          
        </header>

        {error && (
          <Card className="border border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="h-4 w-4" /> {error}
              </CardTitle>
              <CardDescription className="text-xs text-destructive/80">
                Ensure you have access to this team or try refreshing.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {loading && !team ? (
          <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : team ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex flex-col gap-1 text-lg font-semibold" style={{ color: "#002449" }}>
                  {team.name}
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{team.institution}</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> {team.problem_statement?.title || "Problem statement not assigned"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-muted/40 bg-muted/10 p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Check-in status</p>
                    <div className="mt-1 flex items-center gap-2">
                      <CheckInStatusBadge checkedIn={team.members_checked_in} checkedOut={team.members_checked_out} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{statusHelper}</p>
                  </div>
                  <div className="rounded-lg border border-muted/40 bg-muted/10 p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Room allocation</p>
                    <p className="mt-1 font-semibold" style={{ color: "#002449" }}>
                      {team.room_allocation || "Not assigned"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-muted/40 bg-muted/10 p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Members</p>
                    <p className="mt-1 font-semibold" style={{ color: "#002449" }}>
                      {totalMembers}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Point of contact</p>
                  <p className="text-sm font-semibold text-[#002449]">
                    {team.poc?.name || team.poc?.email || "Not shared"}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {team.poc?.email || "—"}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {team.poc?.phone || "—"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Members</p>
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
                    <ul className="divide-y divide-border">
                      {team.members?.length ? (
                        team.members.map((member) => (
                          <li key={member.id} className="flex flex-col gap-0.5 px-4 py-3 text-sm">
                            <span className="font-medium text-[#002449]">{member.user?.name || member.user?.email}</span>
                            <span className="text-xs text-muted-foreground">{member.user?.email}</span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" /> {member.phone || "Phone not shared"}
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#f75700]">{member.role || "Member"}</span>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-3 text-sm text-muted-foreground">Member list not available.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold" style={{ color: "#002449" }}>
                  <ClipboardCheck className="h-5 w-5 text-[#002449]" /> Check-in status
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Record arrivals, departures, allocations, and notes for this team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Check-in status</p>
                      <CheckInStatusBadge checkedIn={team.members_checked_in} checkedOut={team.members_checked_out} />
                      <p className="mt-1 text-[11px] text-muted-foreground">{statusHelper}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p className="uppercase tracking-wide text-[11px]">Room allocation</p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#002449]">
                        <MapPin className="h-3.5 w-3.5" />
                        {team.room_allocation || "Not assigned"}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 text-xs sm:grid-cols-2">
                    <StatusDetailRow
                      label="Checked in"
                      timestamp={team.check_in_timestamp}
                      recordedBy={team.check_in_recorded_by}
                      formatter={dateFormatter}
                    />
                    <StatusDetailRow
                      label="Checked out"
                      timestamp={team.check_out_timestamp}
                      recordedBy={team.check_out_recorded_by}
                      formatter={dateFormatter}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="gap-2"
                      onClick={() => void handleQuickAction("check-in")}
                      disabled={hasCheckedIn || saving || Boolean(actionLoading)}
                    >
                      {actionLoading === "check-in" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" /> Mark as checked in
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => void handleQuickAction("check-out")}
                      disabled={
                        hasCheckedOut ||
                        !hasCheckedIn ||
                        !isCheckoutWindowOpen ||
                        saving ||
                        Boolean(actionLoading)
                      }
                    >
                      {actionLoading === "check-out" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <LogOut className="h-4 w-4" /> Mark as checked out
                        </>
                      )}
                    </Button>
                  </div>
                  {!hasCheckedIn && !hasCheckedOut && (
                    <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <AlertCircle className="h-3 w-3" /> Complete check-in before recording checkout.
                    </p>
                  )}
                  {!isCheckoutWindowOpen && (
                    <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <CalendarClock className="h-3 w-3" /> Checkout opens on {checkoutUnlockLabel}.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room-allocation" className="text-sm font-semibold text-[#002449]">
                    Room allocation
                  </Label>
                  <Input
                    id="room-allocation"
                    placeholder="RBS Rooms 204/205"
                    value={formState.room_allocation ?? ""}
                    onChange={(event) => setFormState((prev) => ({ ...prev, room_allocation: event.target.value }))}
                    disabled={saving || Boolean(actionLoading)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="check-in-remarks" className="text-sm font-semibold text-[#002449]">
                    Remarks
                  </Label>
                  <Textarea
                    id="check-in-remarks"
                    placeholder="Any Remarks?"
                    value={formState.check_in_remarks ?? ""}
                    onChange={(event) => setFormState((prev) => ({ ...prev, check_in_remarks: event.target.value }))}
                    disabled={saving || Boolean(actionLoading)}
                    rows={5}
                  />
                </div>
              </CardContent>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {totalMembers} member{totalMembers === 1 ? "" : "s"}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!isDirty || saving || Boolean(actionLoading)}
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!isDirty || saving || Boolean(actionLoading)}
                    onClick={handleSubmit}
                  >
                    {saving && !actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border border-dashed border-muted/50">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="flex flex-col items-center gap-2 text-base font-semibold" style={{ color: "#002449" }}>
                <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
                Team not found
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                This team could not be located or you do not have permission to view it.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
