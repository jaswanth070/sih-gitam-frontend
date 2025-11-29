"use client"

import { Suspense, useEffect, useMemo, useState, Fragment } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Printer } from "lucide-react"
import { getCachedPOCTeams } from "@/lib/dashboard-cache"
import { authService, type TeamDetails, type POCTeam } from "@/lib/auth-service"

const EMPTY_FIELD = "\u00A0"

const POSITION_OPTIONS = ["Leader", "Member", "Mentor"] as const

const REQUIRED_POSITIONS: (typeof POSITION_OPTIONS)[number][] = [
  "Leader",
  "Member",
  "Member",
  "Member",
  "Member",
  "Member",
  "Mentor",
]

type TravelLeg = {
  fromDate: string
  fromTime: string
  fromPlace: string
  toDate: string
  toTime: string
  toPlace: string
  travelMode: string
  totalFare: string
  admissibleFare: string
  signature: string
}

type TravelMember = {
  id: string
  name: string
  position: (typeof POSITION_OPTIONS)[number]
  onward: TravelLeg
  returnTrip: TravelLeg
}

type TAInfoState = {
  teamLeaderName: string
  teamName: string
  teamId: string
  instituteName: string
}

function createBlankLeg(): TravelLeg {
  return {
    fromDate: "",
    fromTime: "",
    fromPlace: "",
    toDate: "",
    toTime: "",
    toPlace: "",
    travelMode: "",
    totalFare: "",
    admissibleFare: "",
    signature: "",
  }
}

function createInitialTAInfo(): TAInfoState {
  return {
    teamLeaderName: "",
    teamName: "",
    teamId: "",
    instituteName: "",
  }
}

function normalizeRole(role: string | undefined): (typeof POSITION_OPTIONS)[number] {
  const value = role?.toLowerCase() || ""
  if (value.includes("leader")) return "Leader"
  if (value.includes("mentor")) return "Mentor"
  return "Member"
}

function createTravelMembers(details: TeamDetails | null): TravelMember[] {
  const makeEntry = (position: (typeof POSITION_OPTIONS)[number], name: string, id: string): TravelMember => ({
    id,
    name,
    position,
    onward: createBlankLeg(),
    returnTrip: createBlankLeg(),
  })

  if (!details) {
    return REQUIRED_POSITIONS.map((position, index) => makeEntry(position, "", `placeholder-${index}`))
  }

  const members = details.members || []
  const leaderMember = members.find((member) => member.role?.toLowerCase().includes("leader"))
  const mentorMembers = members.filter((member) => member.role?.toLowerCase().includes("mentor"))
  const generalMembers = members.filter((member) => {
    const role = member.role?.toLowerCase() || ""
    return !role.includes("leader") && !role.includes("mentor")
  })

  const result: TravelMember[] = []

  REQUIRED_POSITIONS.forEach((position, index) => {
    if (position === "Leader") {
      if (leaderMember) {
        result.push(
          makeEntry(
            "Leader",
            leaderMember.user?.name || leaderMember.user?.email || "",
            leaderMember.id || `leader-${index}`,
          ),
        )
      } else {
        const fallback = members[0]
        result.push(
          makeEntry(
            "Leader",
            fallback?.user?.name || fallback?.user?.email || "",
            fallback?.id || `leader-${index}`,
          ),
        )
      }
      return
    }

    if (position === "Mentor") {
      if (mentorMembers.length) {
        const mentor = mentorMembers.shift()!
        result.push(
          makeEntry(
            "Mentor",
            mentor.user?.name || mentor.user?.email || "",
            mentor.id || `mentor-${index}`,
          ),
        )
      } else if (details.faculty_mentor?.name) {
        result.push(
          makeEntry(
            "Mentor",
            details.faculty_mentor.name,
            details.faculty_mentor.id || `faculty-mentor-${index}`,
          ),
        )
      } else {
        result.push(makeEntry("Mentor", "", `mentor-placeholder-${index}`))
      }
      return
    }

    if (generalMembers.length) {
      const member = generalMembers.shift()!
      result.push(
        makeEntry(
          "Member",
          member.user?.name || member.user?.email || "",
          member.id || `member-${index}`,
        ),
      )
    } else {
      result.push(makeEntry("Member", "", `member-placeholder-${index}`))
    }
  })

  return result
}

function display(value: string): string {
  return value && value.trim().length > 0 ? value : EMPTY_FIELD
}

function parseAmount(value: string): number {
  if (!value) return 0
  const normalized = value.replace(/[^0-9.-]/g, "")
  const amount = parseFloat(normalized)
  return Number.isFinite(amount) ? amount : 0
}

function formatAmount(amount: number): string {
  if (!amount) return ""
  const formatted = amount.toFixed(2)
  return formatted.endsWith(".00") ? formatted.slice(0, -3) : formatted
}

function syncAllMembersToPrimary(members: TravelMember[]): TravelMember[] {
  if (members.length <= 1) return members
  const primary = members[0]
  return members.map((member, index) =>
    index === 0
      ? member
      : {
          ...member,
          onward: { ...primary.onward },
          returnTrip: { ...primary.returnTrip },
        },
  )
}

export default function TravelAllowanceFormPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell>
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading travel allowance form...
          </div>
        </DashboardShell>
      }
    >
      <TravelAllowanceFormContent />
    </Suspense>
  )
}

function TravelAllowanceFormContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTeamId = searchParams.get("teamId") || ""

  const [teams, setTeams] = useState<POCTeam[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId)
  const [teamLoading, setTeamLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [taInfo, setTaInfo] = useState<TAInfoState>(() => createInitialTAInfo())
  const [travelMembers, setTravelMembers] = useState<TravelMember[]>(() => createTravelMembers(null))
  const [syncAll, setSyncAll] = useState(true)

  const fieldLabelClass = "text-xs font-semibold uppercase tracking-wide text-[#002449]"
  const inputAccentClass = "bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"

  useEffect(() => {
    let mounted = true
    const loadTeams = async () => {
      try {
        const pocTeams = await getCachedPOCTeams()
        if (mounted) {
          setTeams(pocTeams)
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Unable to fetch teams")
        }
      } finally {
        if (mounted) setTeamsLoading(false)
      }
    }
    loadTeams()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedTeamId) {
      setTaInfo(createInitialTAInfo())
      setTravelMembers(createTravelMembers(null))
      return
    }
    let active = true
    const fetchDetails = async () => {
      setTeamLoading(true)
      setError(null)
      try {
        const details = await authService.getPOCTeamDetail(selectedTeamId)
        if (!active) return
        const leaderMember = details.members?.find((member) => member.role?.toLowerCase().includes("leader"))
        const populatedMembers = createTravelMembers(details)
        setTaInfo({
          teamLeaderName: leaderMember?.user?.name || leaderMember?.user?.email || "",
          teamName: details.name || "",
          teamId: "",
          instituteName: details.institution || "",
        })
        setTravelMembers(syncAll ? syncAllMembersToPrimary(populatedMembers) : populatedMembers)
      } catch (err: any) {
        if (active) {
          setError(err?.message || "Unable to fetch team details")
          setTaInfo(createInitialTAInfo())
          setTravelMembers(createTravelMembers(null))
        }
      } finally {
        if (active) setTeamLoading(false)
      }
    }
    fetchDetails()
    return () => {
      active = false
    }
  }, [selectedTeamId])

  useEffect(() => {
    if (initialTeamId && teams.some((team) => team.id === initialTeamId)) {
      setSelectedTeamId(initialTeamId)
    }
  }, [initialTeamId, teams])

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value)
    if (value) {
      router.replace(`/poc/travel-allowance?teamId=${value}`)
    } else {
      router.replace("/poc/travel-allowance")
      setTaInfo(createInitialTAInfo())
      setTravelMembers(createTravelMembers(null))
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleTaInfoField = (field: keyof TAInfoState, value: string) => {
    setTaInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleMemberField = (index: number, field: "name" | "position", value: string) => {
    setTravelMembers((prev) =>
      prev.map((member, idx) => {
        if (idx !== index) return member
        if (field === "position" && !POSITION_OPTIONS.includes(value as any)) {
          return member
        }
        return {
          ...member,
          [field]: value,
        }
      }),
    )
  }

  const handleLegField = (
    index: number,
    leg: "onward" | "returnTrip",
    field: keyof TravelLeg,
    value: string,
  ) => {
    setTravelMembers((prev) => {
      const updated = prev.map((member, idx) => {
        if (idx !== index) return member
        return {
          ...member,
          [leg]: {
            ...member[leg],
            [field]: value,
          },
        }
      })

      if (!syncAll || index !== 0) {
        return updated
      }

      const primaryLeg = updated[0][leg]
      return updated.map((member, idx) =>
        idx === 0
          ? member
          : {
              ...member,
              [leg]: { ...primaryLeg },
            },
      )
    })
  }

  const totalFare = useMemo(() => {
    return travelMembers.reduce((sum, member) => {
      return sum + parseAmount(member.onward.totalFare) + parseAmount(member.returnTrip.totalFare)
    }, 0)
  }, [travelMembers])

  const admissibleFare = useMemo(() => {
    return travelMembers.reduce((sum, member) => {
      return sum + parseAmount(member.onward.admissibleFare) + parseAmount(member.returnTrip.admissibleFare)
    }, 0)
  }, [travelMembers])

  const totalFareDisplay = formatAmount(totalFare)
  const admissibleFareDisplay = formatAmount(admissibleFare)

  useEffect(() => {
    if (syncAll) {
      setTravelMembers((prev) => syncAllMembersToPrimary(prev))
    }
  }, [syncAll])

  return (
    <DashboardShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#002449" }}>
              Travel Allowance Form
            </h1>
            <p className="text-sm text-muted-foreground">
              Fill travel particulars for each team member and print the TA bill when all entries are verified.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
            {selectedTeamId && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/poc/teams/${selectedTeamId}`}>View Team Details</Link>
              </Button>
            )}
            <Button onClick={handlePrint} size="sm" className="bg-[#002449] hover:bg-[#001a33] text-white">
              <Printer className="w-4 h-4" /> Print TA Form
            </Button>
          </div>
        </header>

        <Card className="p-6 space-y-6 rounded-xl border border-[#d9e2f2] bg-[#f9fbff] shadow-md print:hidden">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Select Team</label>
            {teamsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading teams...
              </div>
            ) : teams.length ? (
              <Select value={selectedTeamId || undefined} onValueChange={handleTeamChange}>
                <SelectTrigger className="w-full justify-between">
                  <SelectValue placeholder="Choose a team" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-red-600">No teams assigned yet.</p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {teamLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Fetching team details...
            </div>
          )}

          {selectedTeamId && !teamLoading && (
            <div className="space-y-8">
              <section className="grid gap-4 md:grid-cols-2">
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>Name of Team Leader</label>
                  <Input
                    value={taInfo.teamLeaderName}
                    onChange={(event) => handleTaInfoField("teamLeaderName", event.target.value)}
                    placeholder="Team leader name"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>Name of Team</label>
                  <Input
                    value={taInfo.teamName}
                    onChange={(event) => handleTaInfoField("teamName", event.target.value)}
                    placeholder="Team name"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>Team ID</label>
                  <Input
                    value={taInfo.teamId}
                    onChange={(event) => handleTaInfoField("teamId", event.target.value)}
                    placeholder="Team identifier"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>Team Institute Detail</label>
                  <Input
                    value={taInfo.instituteName}
                    onChange={(event) => handleTaInfoField("instituteName", event.target.value)}
                    placeholder="Institute name"
                    className={inputAccentClass}
                  />
                </fieldset>
              </section>

              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[#002449]">
                    Travel Particulars
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground print:hidden">
                    <Switch id="sync-all" className="border-black" checked={syncAll} onCheckedChange={setSyncAll} />
                    <label htmlFor="sync-all" className="cursor-pointer">
                      Mirror travel details from the first entry to the rest (turn off to edit individually)
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  {travelMembers.map((member, index) => (
                    <div
                      key={member.id || `travel-member-${index}`}
                      className="rounded-lg border border-[#d9e2f2] bg-white/80 p-4 space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="text-xs font-semibold uppercase tracking-wide text-[#007367]">
                          Entry {index + 1}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 w-full md:w-auto">
                          <fieldset className="space-y-2">
                            <label className={fieldLabelClass}>Name</label>
                            <Input
                              value={member.name}
                              onChange={(event) => handleMemberField(index, "name", event.target.value)}
                              placeholder="Member name"
                              className={inputAccentClass}
                            />
                          </fieldset>
                          <fieldset className="space-y-2">
                            <label className={fieldLabelClass}>Position</label>
                            <Select
                              value={member.position}
                              onValueChange={(value) => handleMemberField(index, "position", value)}
                            >
                              <SelectTrigger className={`w-full justify-between ${inputAccentClass}`}>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {POSITION_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </fieldset>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#002449]">
                            Onward Journey
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Date</label>
                              <Input
                                type="date"
                                value={member.onward.fromDate}
                                onChange={(event) => handleLegField(index, "onward", "fromDate", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Time</label>
                              <Input
                                type="time"
                                value={member.onward.fromTime}
                                onChange={(event) => handleLegField(index, "onward", "fromTime", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Place</label>
                              <Input
                                value={member.onward.fromPlace}
                                onChange={(event) => handleLegField(index, "onward", "fromPlace", event.target.value)}
                                placeholder="City / Station"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Date</label>
                              <Input
                                type="date"
                                value={member.onward.toDate}
                                onChange={(event) => handleLegField(index, "onward", "toDate", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Time</label>
                              <Input
                                type="time"
                                value={member.onward.toTime}
                                onChange={(event) => handleLegField(index, "onward", "toTime", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Place</label>
                              <Input
                                value={member.onward.toPlace}
                                onChange={(event) => handleLegField(index, "onward", "toPlace", event.target.value)}
                                placeholder="City / Station"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Travel Mode Used</label>
                              <Input
                                value={member.onward.travelMode}
                                onChange={(event) => handleLegField(index, "onward", "travelMode", event.target.value)}
                                placeholder="Train / Bus / Flight"
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Total Fare (to &amp; fro)*</label>
                              <Input
                                value={member.onward.totalFare}
                                onChange={(event) => handleLegField(index, "onward", "totalFare", event.target.value)}
                                placeholder="Amount"
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Admissible TA (Sleeper)</label>
                              <Input
                                value={member.onward.admissibleFare}
                                onChange={(event) => handleLegField(index, "onward", "admissibleFare", event.target.value)}
                                placeholder="Amount"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                          <fieldset className="hidden space-y-2">
                            <label className={fieldLabelClass}>Signature / Acknowledgement</label>
                            <Input
                              value={member.onward.signature}
                              onChange={(event) => handleLegField(index, "onward", "signature", event.target.value)}
                              placeholder="Name / Sign"
                              className={inputAccentClass}
                            />
                          </fieldset>
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#002449]">
                            Return Journey
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Date</label>
                              <Input
                                type="date"
                                value={member.returnTrip.fromDate}
                                onChange={(event) => handleLegField(index, "returnTrip", "fromDate", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Time</label>
                              <Input
                                type="time"
                                value={member.returnTrip.fromTime}
                                onChange={(event) => handleLegField(index, "returnTrip", "fromTime", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Place</label>
                              <Input
                                value={member.returnTrip.fromPlace}
                                onChange={(event) => handleLegField(index, "returnTrip", "fromPlace", event.target.value)}
                                placeholder="City / Station"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Date</label>
                              <Input
                                type="date"
                                value={member.returnTrip.toDate}
                                onChange={(event) => handleLegField(index, "returnTrip", "toDate", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Time</label>
                              <Input
                                type="time"
                                value={member.returnTrip.toTime}
                                onChange={(event) => handleLegField(index, "returnTrip", "toTime", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Place</label>
                              <Input
                                value={member.returnTrip.toPlace}
                                onChange={(event) => handleLegField(index, "returnTrip", "toPlace", event.target.value)}
                                placeholder="City / Station"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Travel Mode Used</label>
                              <Input
                                value={member.returnTrip.travelMode}
                                onChange={(event) => handleLegField(index, "returnTrip", "travelMode", event.target.value)}
                                placeholder="Train / Bus / Flight"
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Total Fare (to &amp; fro)*</label>
                              <Input
                                value={member.returnTrip.totalFare}
                                onChange={(event) => handleLegField(index, "returnTrip", "totalFare", event.target.value)}
                                placeholder="Amount"
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Admissible TA (Sleeper)</label>
                              <Input
                                value={member.returnTrip.admissibleFare}
                                onChange={(event) => handleLegField(index, "returnTrip", "admissibleFare", event.target.value)}
                                placeholder="Amount"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                          <fieldset className="hidden space-y-2">
                            <label className={fieldLabelClass}>Signature / Acknowledgement</label>
                            <Input
                              value={member.returnTrip.signature}
                              onChange={(event) => handleLegField(index, "returnTrip", "signature", event.target.value)}
                              placeholder="Name / Sign"
                              className={inputAccentClass}
                            />
                          </fieldset>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </Card>

        <div className="space-y-4 print:space-y-2">
          <Card className="ta-print-container p-6 border border-gray-300 shadow-sm bg-white print:border print:border-black print:p-4 print:shadow-none">
            <div className="hidden print:block print:mb-4">
              <img
                src="/sih_banner.png"
                alt="Smart India Hackathon banner"
                className="mx-auto h-auto max-h-32 w-full max-w-[780px] object-contain"
              />
            </div>
            <div className="text-center space-y-1.5 print:space-y-1 mb-4 print:mb-3 font-serif text-gray-900">
              <p className="text-base font-semibold uppercase">All India Council for Technical Education</p>
              <p className="text-sm font-semibold">Smart India Hackathon 2025</p>
              <p className="text-sm font-semibold uppercase">TA - Bill (Team wise)</p>
            </div>

            <div className="space-y-1 print:space-y-0.5 text-sm print:text-[12px] font-serif text-gray-900 mb-4 print:mb-3">
              <p>Name of Team Leader : {display(taInfo.teamLeaderName)}</p>
              <p>Name of Team : {display(taInfo.teamName)}</p>
              <p>Team ID: {display(taInfo.teamId)}</p>
              <p>Team Institute detail: {display(taInfo.instituteName)}</p>
            </div>

            <div className="border border-black">
              <table className="ta-print-table w-full table-fixed border-collapse text-[11px] leading-[1.5] text-black font-serif">
                <colgroup>
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-2 text-center font-semibold" rowSpan={2}>
                      Sl. No.
                    </th>
                    <th className="border border-black px-2 py-2 text-center font-semibold" rowSpan={2}>
                      Name of the team members
                    </th>
                    <th className="border border-black px-2 py-2 text-center font-semibold" rowSpan={2}>
                      Position
                    </th>
                    <th className="border border-black px-2 py-2 text-center font-semibold" rowSpan={2}>
                      Trip
                    </th>
                    <th className="border border-black px-2 py-2 text-center font-semibold" colSpan={3}>
                      From
                    </th>
                    <th className="border border-black px-2 py-2 text-center font-semibold" colSpan={3}>
                      To
                    </th>
                    <th className="border border-black px-2 py-2 text-center font-semibold" rowSpan={2}>
                      Travel mode used
                    </th>
                    <th className="border border-black px-2 py-2 text-center font-semibold" rowSpan={2}>
                      Total fare (to &amp; fro)*
                    </th>
                    <th className="border border-black px-2 py-2 text-center font-semibold" rowSpan={2}>
                      Admissible TA - to &amp; fro in sleeper class
                    </th>
                    <th className="border border-black px-2 py-2 text-center font-semibold" rowSpan={2}>
                      Sign
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-black px-2 py-1 text-center font-semibold">Date</th>
                    <th className="border border-black px-2 py-1 text-center font-semibold">Time</th>
                    <th className="border border-black px-2 py-1 text-center font-semibold">Place</th>
                    <th className="border border-black px-2 py-1 text-center font-semibold">Date</th>
                    <th className="border border-black px-2 py-1 text-center font-semibold">Time</th>
                    <th className="border border-black px-2 py-1 text-center font-semibold">Place</th>
                  </tr>
                </thead>
                <tbody>
                  {travelMembers.map((member, index) => (
                    <Fragment key={member.id || `travel-row-${index}`}>
                      <tr>
                        <td className="border border-black px-2 py-2 text-center align-top font-semibold" rowSpan={2}>
                          {index + 1}
                        </td>
                        <td className="border border-black px-2 py-2 align-top" rowSpan={2}>
                          {display(member.name)}
                        </td>
                        <td className="border border-black px-2 py-2 text-center align-top" rowSpan={2}>
                          {display(member.position)}
                        </td>
                        <td className="border border-black px-2 py-2 text-center font-semibold">Onward</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.onward.fromDate)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.onward.fromTime)}</td>
                        <td className="border border-black px-2 py-2">{display(member.onward.fromPlace)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.onward.toDate)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.onward.toTime)}</td>
                        <td className="border border-black px-2 py-2">{display(member.onward.toPlace)}</td>
                        <td className="border border-black px-2 py-2">{display(member.onward.travelMode)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.onward.totalFare)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.onward.admissibleFare)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.onward.signature)}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-2 py-2 text-center font-semibold">Return</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.returnTrip.fromDate)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.returnTrip.fromTime)}</td>
                        <td className="border border-black px-2 py-2">{display(member.returnTrip.fromPlace)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.returnTrip.toDate)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.returnTrip.toTime)}</td>
                        <td className="border border-black px-2 py-2">{display(member.returnTrip.toPlace)}</td>
                        <td className="border border-black px-2 py-2">{display(member.returnTrip.travelMode)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.returnTrip.totalFare)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.returnTrip.admissibleFare)}</td>
                        <td className="border border-black px-2 py-2 text-center">{display(member.returnTrip.signature)}</td>
                      </tr>
                    </Fragment>
                  ))}
                  <tr>
                    <td className="border border-black px-2 py-2 text-right font-semibold" colSpan={11}>
                      Grand Total
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      {display(totalFareDisplay)}
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      {display(admissibleFareDisplay)}
                    </td>
                    <td className="border border-black px-2 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-1.5 print:space-y-1 text-[11px] print:text-[10px] font-serif text-gray-900">
              <p>Bank details of the Team Leader enclosed in Mandate form for RTGS</p>
              <p>*Copy of tickets enclosed with the form for verification</p>
            </div>

            <div className="mt-8 flex flex-col md:flex-row md:justify-between gap-4 text-sm font-semibold text-gray-900">
              <span>Signature of Team Leader</span>
              <span>Signature of College SPOC</span>
            </div>
            <div className="hidden print:block print:mt-6">
              <img
                src="/partners_banner.png"
                alt="Partners banner"
                className="mx-auto h-auto max-h-32 w-full max-w-[760px] object-contain"
              />
            </div>
          </Card>
        </div>
      </div>
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 15mm;
        }
        @media print {
          body {
            background: #ffffff !important;
            color: #000 !important;
          }
          #__next {
            background: #ffffff !important;
          }
          nav,
          footer,
          aside,
          .print\:hidden,
          [data-slot="sidebar"],
          [data-slot="sidebar-trigger"],
          [data-slot="sidebar-gap"],
          [data-slot="sidebar-container"],
          [data-slot="sidebar-rail"],
          [data-slot="sidebar-header"],
          [data-slot="sidebar-footer"],
          [data-slot="sidebar-content"],
          [data-slot="sidebar-group"] {
            display: none !important;
          }
          [data-slot="sidebar-wrapper"] {
            display: block !important;
            min-height: auto !important;
          }
          [data-slot="sidebar-inset"] {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          [data-slot="sidebar-inset"] > div:first-child {
            display: none !important;
          }
          [data-slot="sidebar-inset"] > div:last-child {
            padding: 0 !important;
            margin: 0 !important;
          }
          .ta-print-container {
            box-shadow: none !important;
            border-color: #000 !important;
            padding: 10mm !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .ta-print-container,
          .ta-print-container * {
            font-family: "Times New Roman", Times, serif !important;
            color: #000 !important;
          }
          .ta-print-container img {
            display: block !important;
            max-width: 100% !important;
            height: auto !important;
          }
          .ta-print-table {
            width: 100% !important;
          }
          .ta-print-table thead {
            display: table-header-group !important;
          }
          .ta-print-table tbody {
            display: table-row-group !important;
          }
          .ta-print-table tr {
            page-break-inside: avoid !important;
          }
          .ta-print-table th,
          .ta-print-table td {
            border-color: #000 !important;
          }
        }
      `}</style>
    </DashboardShell>
  )
}
