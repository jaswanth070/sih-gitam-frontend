"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
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
  RefreshCcw,
  User2,
  Users,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getCachedVolunteerTeams, getCachedVolunteerTeamDetail } from "@/lib/dashboard-cache"
import {
  authService,
  type CheckInUpdatePayload,
  type TeamContact,
  type TeamDetails,
} from "@/lib/auth-service"

interface VolunteerDashboardProps {
  user: any
}

interface TeamStateMap {
  [teamId: string]: TeamDetails
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

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

const CHECK_OUT_UNLOCK_DATE = new Date(Date.UTC(2025, 5, 12))

export function VolunteerDashboard({ user }: VolunteerDashboardProps) {
  const [teams, setTeams] = useState<TeamDetails[]>([])
  const [teamMap, setTeamMap] = useState<TeamStateMap>({})
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingTeamDetail, setLoadingTeamDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<"check-in" | "check-out" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<CheckInUpdatePayload>({
    members_checked_in: false,
    members_checked_out: false,
    check_in_remarks: "",
    room_allocation: "",
  })
  const { toast } = useToast()
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [],
  )
  const checkoutUnlockLabel = useMemo(() => dateFormatter.format(CHECK_OUT_UNLOCK_DATE), [dateFormatter])

  useEffect(() => {
    let cancelled = false
    const fetchTeams = async () => {
      setLoadingTeams(true)
      setError(null)
      try {
        const data = await getCachedVolunteerTeams()
        if (cancelled) return
        setTeams(data)
        setTeamMap((prev) => {
          const next = { ...prev }
          data.forEach((team) => {
            next[team.id] = team
          })
          return next
        })
        setSelectedTeamId((prev) => (prev && data.some((team) => team.id === prev) ? prev : ""))
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "Failed to load volunteer teams"
        setError(message)
      } finally {
        if (!cancelled) {
          setLoadingTeams(false)
        }
      }
    }

    void fetchTeams()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedTeam = useMemo(() => {
    if (!selectedTeamId) return null
    return teamMap[selectedTeamId] ?? null
  }, [selectedTeamId, teamMap])

  useEffect(() => {
    if (!selectedTeamId) return

    const team = teamMap[selectedTeamId]
    if (team && team.members && team.members.length) {
      setFormState({
        members_checked_in: Boolean(team.members_checked_in),
        members_checked_out: Boolean(team.members_checked_out),
        check_in_remarks: team.check_in_remarks ?? "",
        room_allocation: team.room_allocation ?? "",
      })
      return
    }

    let cancelled = false
    setLoadingTeamDetail(true)
    const loadDetail = async () => {
      try {
        const detail = await getCachedVolunteerTeamDetail(selectedTeamId)
        if (cancelled) return
        setTeamMap((prev) => ({ ...prev, [selectedTeamId]: detail }))
        setFormState({
          members_checked_in: Boolean(detail.members_checked_in),
          members_checked_out: Boolean(detail.members_checked_out),
          check_in_remarks: detail.check_in_remarks ?? "",
          room_allocation: detail.room_allocation ?? "",
        })
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "Failed to load team details"
        setError(message)
      } finally {
        if (!cancelled) {
          setLoadingTeamDetail(false)
        }
      }
    }

    void loadDetail()
    return () => {
      cancelled = true
    }
  }, [selectedTeamId, teamMap])

  const handleRefreshTeam = useCallback(async () => {
    if (!selectedTeamId) return
    setLoadingTeamDetail(true)
    try {
      const detail = await getCachedVolunteerTeamDetail(selectedTeamId, true)
      setTeamMap((prev) => ({ ...prev, [selectedTeamId]: detail }))
      setFormState({
        members_checked_in: Boolean(detail.members_checked_in),
        members_checked_out: Boolean(detail.members_checked_out),
        check_in_remarks: detail.check_in_remarks ?? "",
        room_allocation: detail.room_allocation ?? "",
      })
      toast({ title: "Team refreshed", description: "Latest team details retrieved." })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh team"
      setError(message)
      toast({ variant: "destructive", title: "Refresh failed", description: message })
    } finally {
      setLoadingTeamDetail(false)
    }
  }, [selectedTeamId, toast])

  const handleSubmit = useCallback(async () => {
    if (!selectedTeamId) return
    setSaving(true)
    setActionLoading(null)
    setError(null)
    try {
      const membersCheckedOut = Boolean(formState.members_checked_out)
      const membersCheckedIn = membersCheckedOut ? false : Boolean(formState.members_checked_in)
      const payload: CheckInUpdatePayload = {
        members_checked_in: membersCheckedIn,
        members_checked_out: membersCheckedOut,
        check_in_remarks: formState.check_in_remarks ?? "",
        room_allocation: formState.room_allocation ?? "",
      }
      const updated = await authService.updateTeamCheckIn(selectedTeamId, payload, "PATCH")
      setTeamMap((prev) => ({ ...prev, [selectedTeamId]: updated }))
      setTeams((prev) => prev.map((team) => (team.id === updated.id ? { ...team, ...updated } : team)))
      setFormState({
        members_checked_in: Boolean(updated.members_checked_in),
        members_checked_out: Boolean(updated.members_checked_out),
        check_in_remarks: updated.check_in_remarks ?? "",
        room_allocation: updated.room_allocation ?? "",
      })
      toast({ title: "Check-in updated", description: `Saved check-in details for ${updated.name}.` })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update check-in"
      setError(message)
      toast({ variant: "destructive", title: "Update failed", description: message })
    } finally {
      setSaving(false)
    }
  }, [formState, selectedTeamId, toast])

  const handleQuickAction = useCallback(
    async (action: "check-in" | "check-out") => {
      if (!selectedTeamId) return
      const isCheckout = action === "check-out"
      const now = Date.now()
      const checkoutWindowOpen = now >= CHECK_OUT_UNLOCK_DATE.getTime()
      const hasCheckedIn = Boolean(formState.members_checked_in || selectedTeam?.members_checked_in)

      if (isCheckout && !hasCheckedIn) {
        toast({ variant: "destructive", title: "Checkout blocked", description: "Complete check-in before marking a team as checked out." })
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
        const updated = await authService.updateTeamCheckIn(selectedTeamId, payload, "PATCH")
        setTeamMap((prev) => ({ ...prev, [selectedTeamId]: updated }))
        setTeams((prev) => prev.map((team) => (team.id === updated.id ? { ...team, ...updated } : team)))
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
    [checkoutUnlockLabel, formState.check_in_remarks, formState.members_checked_in, formState.room_allocation, selectedTeam?.members_checked_in, selectedTeamId, setTeamMap, setTeams, toast],
  )

  const handleReset = useCallback(async () => {
    if (!selectedTeamId) return
    setSaving(true)
    setError(null)
    try {
      const resetPayload: CheckInUpdatePayload = {
        members_checked_in: false,
        members_checked_out: false,
        check_in_remarks: "",
        room_allocation: "",
      }
      const updated = await authService.updateTeamCheckIn(selectedTeamId, resetPayload, "PUT")
      setTeamMap((prev) => ({ ...prev, [selectedTeamId]: updated }))
      setTeams((prev) => prev.map((team) => (team.id === updated.id ? { ...team, ...updated } : team)))
      setFormState({
        members_checked_in: Boolean(updated.members_checked_in),
        members_checked_out: Boolean(updated.members_checked_out),
        check_in_remarks: updated.check_in_remarks ?? "",
        room_allocation: updated.room_allocation ?? "",
      })
      toast({ title: "Check-in reset", description: "Team check-in status cleared." })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset check-in"
      setError(message)
      toast({ variant: "destructive", title: "Reset failed", description: message })
    } finally {
      setSaving(false)
    }
  }, [selectedTeamId, toast])

  const handleTeamChange = useCallback((value: string) => {
    setSelectedTeamId(value)
  }, [])

  const checkInComparison = useMemo(() => {
    if (!selectedTeam) return { isDirty: false }
    const current = {
      members_checked_in: Boolean(formState.members_checked_in),
      members_checked_out: Boolean(formState.members_checked_out),
      check_in_remarks: normalizeText(formState.check_in_remarks),
      room_allocation: normalizeText(formState.room_allocation),
    }
    const baseline = {
      members_checked_in: Boolean(selectedTeam.members_checked_in),
      members_checked_out: Boolean(selectedTeam.members_checked_out),
      check_in_remarks: normalizeText(selectedTeam.check_in_remarks),
      room_allocation: normalizeText(selectedTeam.room_allocation),
    }
    const isDirty =
      current.members_checked_in !== baseline.members_checked_in ||
      current.members_checked_out !== baseline.members_checked_out ||
      current.check_in_remarks !== baseline.check_in_remarks ||
      current.room_allocation !== baseline.room_allocation
    return { isDirty }
  }, [formState, selectedTeam])

  const hasCheckedIn = Boolean(formState.members_checked_in)
  const hasCheckedOut = Boolean(formState.members_checked_out)
  const isCheckoutWindowOpen = Date.now() >= CHECK_OUT_UNLOCK_DATE.getTime()

  const volunteerFirstName = useMemo(() => user?.name?.split(" ")[0] || "Volunteer", [user?.name])

  return (
    <div className="space-y-6" aria-label="Volunteer dashboard">
      <header className="space-y-1">
        <h2
          className="flex items-center gap-2 text-2xl font-bold tracking-tight"
          style={{ color: "#002449" }}
        >
          <ClipboardCheck className="h-6 w-6 text-[#002449]" /> Welcome, {volunteerFirstName}
        </h2>
        <p className="text-sm text-muted-foreground">
          Review assigned teams and capture on-site check-in details.
        </p>
      </header>

      {error && (
        <Card className="border border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertCircle className="h-4 w-4" /> {error}
            </CardTitle>
            <CardDescription className="text-xs text-destructive/80">
              Try refreshing the page or contact the admin team if the issue persists.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {loadingTeams ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading volunteer workspace…
          </div>
        </div>
      ) : teams.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">No teams assigned yet.</p>
          <p className="text-xs text-muted-foreground">You will see your assignments here once the coordinators publish them.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: "#002449" }}>
                Assigned teams
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pick a team to review participant roster and update their arrival status.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="w-full md:max-w-sm">
                <Label htmlFor="volunteer-team" className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Select team
                </Label>
                <Select value={selectedTeamId || undefined} onValueChange={handleTeamChange}>
                  <SelectTrigger id="volunteer-team">
                    <SelectValue placeholder="Choose a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <span className="text-sm font-semibold" style={{ color: "#002449" }}>
                          {team.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                {selectedTeam ? (
                  <>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Check-in status</p>
                    <CheckInStatusBadge
                      checkedIn={selectedTeam.members_checked_in}
                      checkedOut={selectedTeam.members_checked_out}
                    />
                    <p className="text-xs text-muted-foreground">
                      Room allocation: {normalizeText(selectedTeam.room_allocation) || "Not assigned"}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Select a team to view its current status.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshTeam}
                  className="gap-2"
                  disabled={!selectedTeamId || loadingTeamDetail || saving}
                >
                  {loadingTeamDetail ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedTeam ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
              <Card className="h-full border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-col gap-2 text-lg font-semibold" style={{ color: "#002449" }}>
                    <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {selectedTeam.team_id || "Team"}
                    </span>
                    {selectedTeam.name}
                  </CardTitle>
                  {selectedTeam.institution && (
                    <CardDescription className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-4 w-4" /> {selectedTeam.institution}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTeam.problem_statement?.title && (
                    <div className="rounded-lg border border-[#f75700]/30 bg-[#f75700]/10 p-3 text-sm text-[#5b2a00]">
                      <p className="font-semibold uppercase tracking-wide text-[11px] text-[#a04900]">Problem statement</p>
                      <p>{selectedTeam.problem_statement.title}</p>
                    </div>
                  )}

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Point of contact</p>
                    <p className="text-sm font-semibold text-[#002449]">
                      {selectedTeam.poc?.name || selectedTeam.poc?.email || "Not shared"}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> {selectedTeam.poc?.email || "—"}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {selectedTeam.poc?.phone || "—"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Members</p>
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                      <ul className="divide-y divide-border">
                        {selectedTeam.members?.length ? (
                          selectedTeam.members.map((member) => (
                            <li key={member.id} className="flex flex-col gap-0.5 px-4 py-3 text-sm">
                              <span className="font-medium text-[#002449]">{member.user?.name || member.user?.email}</span>
                              <span className="text-xs text-muted-foreground">{member.user?.email}</span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" /> {member.phone || "Phone not shared"}
                              </span>
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#f75700]">
                                {member.role || "Member"}
                              </span>
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

              <Card className="h-full border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold" style={{ color: "#002449" }}>
                    <ClipboardCheck className="h-5 w-5 text-[#002449]" /> Check-in status
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Update the arrival state and share any notes for the coordination team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Check-in status</p>
                        <CheckInStatusBadge
                          checkedIn={selectedTeam.members_checked_in}
                          checkedOut={selectedTeam.members_checked_out}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p className="uppercase tracking-wide text-[11px]">Room allocation</p>
                        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#002449]">
                          <MapPin className="h-3.5 w-3.5" />
                          {normalizeText(selectedTeam.room_allocation) || "Not assigned"}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 text-xs sm:grid-cols-2">
                      <StatusDetailRow
                        label="Checked in"
                        timestamp={selectedTeam.check_in_timestamp}
                        recordedBy={selectedTeam.check_in_recorded_by}
                        formatter={dateFormatter}
                      />
                      <StatusDetailRow
                        label="Checked out"
                        timestamp={selectedTeam.check_out_timestamp}
                        recordedBy={selectedTeam.check_out_recorded_by}
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
                        disabled={hasCheckedIn || saving || loadingTeamDetail}
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
                          loadingTeamDetail
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
                      placeholder="RBS - Rooms 204/205"
                      value={formState.room_allocation ?? ""}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, room_allocation: event.target.value }))
                      }
                      disabled={saving || loadingTeamDetail}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="check-in-remarks" className="text-sm font-semibold text-[#002449]">
                      Remarks
                    </Label>
                    <Textarea
                      id="check-in-remarks"
                      placeholder="Specify remarks if any"
                      value={formState.check_in_remarks ?? ""}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, check_in_remarks: event.target.value }))
                      }
                      disabled={saving || loadingTeamDetail}
                      rows={4}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User2 className="h-3.5 w-3.5" />
                    {selectedTeam.members?.length ?? 0} member
                    {selectedTeam.members && selectedTeam.members.length === 1 ? "" : "s"}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={!checkInComparison.isDirty || saving || loadingTeamDetail}
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!checkInComparison.isDirty || saving || loadingTeamDetail}
                    >
                      {saving && !actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card className="border border-dashed border-muted/60">
              <CardHeader className="pb-3 text-center">
                <CardTitle className="flex flex-col items-center gap-2 text-base font-semibold" style={{ color: "#002449" }}>
                  <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
                  Select a team to continue
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Choose one of your assigned teams to review their roster and update check-in details.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
