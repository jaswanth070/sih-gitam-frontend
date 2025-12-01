"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Layers,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  User2,
  Users,
} from "lucide-react"

import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { authService, type AdminTeamSummary, type TeamContact, type TeamMemberSummary } from "@/lib/auth-service"

interface ContactSummaryProps {
  label: string
  contact?: TeamContact | null
  fallback?: string
}

const ContactSummary = ({ label, contact, fallback }: ContactSummaryProps) => {
  if (!contact) {
    return (
      <Card className="border border-dashed border-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold" style={{ color: "#002449" }}>{label}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">{fallback || "No details provided."}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold" style={{ color: "#002449" }}>{label}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">Primary details for coordination.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="font-semibold text-[#002449]">{contact.name || contact.email || "Unnamed contact"}</p>
        {contact.email && (
          <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {contact.email}</p>
        )}
        {contact.phone && (
          <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {contact.phone}</p>
        )}
        {contact.designation && <p className="text-xs text-muted-foreground">{contact.designation}</p>}
        {contact.is_verified_poc && (
          <Badge variant="outline" className="w-fit gap-1 text-xs text-[#007367] border-[#007367]/60">
            <ShieldCheck className="h-3 w-3" /> Verified
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

const AdditionalMentorsCard = ({ mentors }: { mentors: TeamContact[] }) => {
  if (!mentors.length) {
    return (
      <Card className="border border-dashed border-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold" style={{ color: "#002449" }}>Additional Mentors</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">No other mentors are assigned yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold" style={{ color: "#002449" }}>Additional Mentors</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">Other faculty mentors associated with the team.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {mentors.map((mentor, index) => {
          const key = mentor.id ?? mentor.email ?? `${mentor.name ?? "mentor"}-${index}`
          return (
            <Badge key={key} variant="outline" className="gap-1 text-xs">
              <ShieldCheck className="h-3 w-3" /> {mentor.name || mentor.email || "Mentor"}
            </Badge>
          )
        })}
      </CardContent>
    </Card>
  )
}

function MembersList({ members }: { members: TeamMemberSummary[] }) {
  if (!members?.length) {
    return (
      <Card className="border border-dashed border-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold" style={{ color: "#002449" }}>Team Members</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Member roster has not been added yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold" style={{ color: "#002449" }}>Team Members</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">Full roster with designated roles.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-[#002449]">
                  {member.user?.name || member.user?.email || "Unnamed member"}
                </p>
                {member.user?.email && (
                  <p className="text-xs text-muted-foreground break-all">{member.user.email}</p>
                )}
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {member.phone || "Phone not shared"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <User2 className="mr-1 h-3.5 w-3.5" />
                  {member.role || "Member"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function AdminTeamsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<AdminTeamSummary[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true)
      setError(null)
      try {
        const currentUser = authService.getCurrentUser()
        if (!currentUser?.is_admin) {
          setAuthorized(false)
          setTeams([])
          setLoading(false)
          return
        }

        setAuthorized(true)
        const data = await authService.getAdminTeams()
        setTeams(data)
        setSelectedTeamId((prev) => (prev && data.some((team) => team.id === prev) ? prev : ""))
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load teams."
        setError(message)
        toast({ variant: "destructive", title: "Failed to load teams", description: message })
      } finally {
        setLoading(false)
      }
    }

    void loadTeams()
  }, [toast])

  const handleTeamChange = useCallback((value: string) => {
    setSelectedTeamId(value)
  }, [])

  const selectedTeam = useMemo(() => teams.find((team) => team.id === selectedTeamId) || null, [selectedTeamId, teams])

  const leader = useMemo(() => selectedTeam?.members?.find((member) => member.role?.toLowerCase().includes("leader")), [selectedTeam?.members])
  const totalMembers = useMemo(() => selectedTeam?.members?.length ?? 0, [selectedTeam?.members])
  const mentors = useMemo(() => {
    if (!selectedTeam) return [] as TeamContact[]
    const list: TeamContact[] = []
    const candidates = [selectedTeam.faculty_mentor, selectedTeam.faculty_mentor_1, selectedTeam.faculty_mentor_2]
    candidates.forEach((mentor) => {
      if (mentor && !list.find((entry) => entry.id === mentor.id)) {
        list.push(mentor)
      }
    })
    if (Array.isArray(selectedTeam.mentors)) {
      selectedTeam.mentors.forEach((mentor) => {
        if (mentor && !list.find((entry) => entry.id === mentor.id)) {
          list.push(mentor)
        }
      })
    }
    return list
  }, [selectedTeam])

  const teamOptions = useMemo(() => teams.map((team) => ({ id: team.id, label: team.name, subtitle: team.institution })), [teams])

  return (
    <DashboardShell>
      <div className="space-y-8">
        {authorized === false && (
          <Card className="border border-destructive/30 bg-destructive/5 text-destructive">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4" /> Access restricted
              </CardTitle>
              <CardDescription className="text-xs text-destructive/90">Only admin users can view this directory.</CardDescription>
            </CardHeader>
          </Card>
        )}

        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#002449" }}>
              Teams Directory
            </h1>
            <p className="text-sm text-muted-foreground">Browse every team and review contact as well as roster details.</p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <Select value={selectedTeamId || undefined} onValueChange={handleTeamChange} disabled={!teams.length || loading}>
              <SelectTrigger className="w-64 border border-[#002449]/40 bg-white shadow-sm transition-colors focus:border-[#002449] focus:outline-none focus:ring-2 focus:ring-[#002449]/20">
                <SelectValue placeholder={loading ? "Loading teams…" : "Select a team"} />
              </SelectTrigger>
              <SelectContent>
                {teamOptions.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex flex-col text-sm">
                      <span className="font-semibold" style={{ color: "#002449" }}>{team.label}</span>
                      
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{teams.length} team{teams.length === 1 ? "" : "s"} loaded.</p>
          </div>
        </header>

        {error && (
          <Card className="border border-destructive/30 bg-destructive/5 text-destructive">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4" /> Unable to load teams
              </CardTitle>
              <CardDescription className="text-xs text-destructive/90">{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Fetching latest team roster…
            </div>
          </div>
        ) : authorized === false ? null : selectedTeam ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#002449]/15 bg-gradient-to-br from-[#002449] via-[#01335f] to-[#00172f] text-white shadow-lg">
              <div className="px-6 py-8 md:px-10 md:py-10 space-y-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
                      {selectedTeam.team_id && (
                        <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
                          Team Code • {selectedTeam.team_id}
                        </Badge>
                      )}
                      {selectedTeam.problem_statement?.id && (
                        <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
                          Problem Statement • {selectedTeam.problem_statement.id}
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{selectedTeam.name}</h2>
                    <p className="flex items-center gap-2 text-sm text-white/80">
                      <Building2 className="h-4 w-4" /> {selectedTeam.institution}
                    </p>
                    {selectedTeam.problem_statement?.title && (
                      <p className="text-sm text-white/80 flex items-start gap-2">
                        <Layers className="h-4 w-4 mt-0.5 shrink-0" /> {selectedTeam.problem_statement.title}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Badge variant="outline" className="w-fit gap-1 bg-white/10 text-white border-white/30">
                      <Users className="h-3.5 w-3.5" /> {totalMembers} member{totalMembers === 1 ? "" : "s"}
                    </Badge>
                    <Button
                      asChild
                      size="sm"
                      className="border border-[#002449]/20 bg-white text-[#002449] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                    >
                      <Link href={`/view-documents?teamId=${selectedTeam.id}`} className="flex items-center gap-2">
                        Open Documents <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    {leader && (
                      <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-xs text-white/80">
                        <p className="uppercase tracking-wide text-[11px] text-white/60">Team Leader</p>
                        <p className="text-sm font-semibold text-white">{leader.user?.name || leader.user?.email}</p>
                        <p className="text-xs text-white/80 break-all">{leader.user?.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ContactSummary label="Point of Contact" contact={selectedTeam.poc} fallback="POC details not available." />
              <ContactSummary label="Faculty Mentor" contact={mentors[0]} fallback="No mentor recorded." />
              <AdditionalMentorsCard mentors={mentors.slice(1)} />
            </section>

            <MembersList members={selectedTeam.members || []} />
          </div>
        ) : (
          <Card className="border border-dashed border-muted/50">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="flex flex-col items-center gap-2 text-base font-semibold" style={{ color: "#002449" }}>
                <Users className="h-6 w-6 text-muted-foreground" /> Select a team to continue
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Pick a team from the dropdown above to load its full profile.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
