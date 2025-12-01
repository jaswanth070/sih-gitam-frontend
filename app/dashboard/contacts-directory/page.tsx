"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Users,
  Search,
} from "lucide-react"

import { DashboardShell } from "@/components/navigation/dashboard-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  authService,
  type AdminTeamSummary,
  type TeamDetails,
  type TeamMemberSummary,
} from "@/lib/auth-service"
import { getCachedPOCTeams } from "@/lib/dashboard-cache"

interface DirectoryContact {
  name: string
  email: string
  phone: string
  undertaking: string
}

interface DirectoryMember {
  id: string
  name: string
  email: string
  phone: string
  teamName: string
}

const ADMIN_CONTACTS: DirectoryContact[] = [
  {
    name: "Bollem Raja Kumar",
    email: "rbollem@gitam.edu",
    phone: "9704645434",
    undertaking: "",
  },
  
]

const POC_CONTACTS: DirectoryContact[] = [
  
]

const JURY_CONTACTS: DirectoryContact[] = [
  
]

export default function ContactsDirectoryPage() {
  const [role, setRole] = useState<"admin" | "poc" | "leader" | null>(null)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<DirectoryMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const current = authService.getCurrentUser()
    if (current?.is_admin) {
      setRole("admin")
    } else if (current?.is_poc) {
      setRole("poc")
    } else {
      setRole("leader")
    }
  }, [])

  useEffect(() => {
    if (role === null) return
    if (role === "leader") {
      setLoadingMembers(false)
      return
    }

    let cancelled = false

    const loadMembersForAdmin = async () => {
      setLoadingMembers(true)
      setMemberError(null)
      try {
        const teams = await authService.getAdminTeams()
        if (cancelled) return
        const flattened = collectTeamMembers(teams)
        setTeamMembers(flattened)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : "Unable to load team contacts."
        setMemberError(message)
        setTeamMembers([])
      } finally {
        if (!cancelled) {
          setLoadingMembers(false)
        }
      }
    }

    const loadMembersForPOC = async () => {
      setLoadingMembers(true)
      setMemberError(null)
      try {
        const teams = await getCachedPOCTeams()
        const detailed = await Promise.all(
          teams.map(async (team) => {
            try {
              return await authService.getPOCTeamDetail(team.id)
            } catch (error) {
              console.warn("[contacts-directory] failed to fetch POC team detail", error)
              return null
            }
          }),
        )
        if (cancelled) return
        const filtered = detailed.filter((team): team is TeamDetails => Boolean(team))
        const flattened = collectTeamMembers(filtered)
        setTeamMembers(flattened)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : "Unable to load assigned team contacts."
        setMemberError(message)
        setTeamMembers([])
      } finally {
        if (!cancelled) {
          setLoadingMembers(false)
        }
      }
    }

    if (role === "admin") {
      void loadMembersForAdmin()
    } else if (role === "poc") {
      void loadMembersForPOC()
    }

    return () => {
      cancelled = true
    }
  }, [role])

  const headingCopy = useMemo(() => {
    if (role === "admin") return "Central contact registry for every stakeholder."
    if (role === "poc") return "Directory of all assigned teams and escalation points."
    return "This directory is only available to admin and POC users."
  }, [role])

  const showDirectory = role === "admin" || role === "poc"
  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredAdminContacts = useMemo(() => {
    if (!normalizedSearch) return ADMIN_CONTACTS
    return ADMIN_CONTACTS.filter((contact) => contactMatches(contact, normalizedSearch))
  }, [normalizedSearch])

  const filteredPocContacts = useMemo(() => {
    if (!normalizedSearch) return POC_CONTACTS
    return POC_CONTACTS.filter((contact) => contactMatches(contact, normalizedSearch))
  }, [normalizedSearch])

  const filteredJuryContacts = useMemo(() => {
    if (!normalizedSearch) return JURY_CONTACTS
    return JURY_CONTACTS.filter((contact) => contactMatches(contact, normalizedSearch))
  }, [normalizedSearch])

  const filteredTeamMembers = useMemo(() => {
    if (!normalizedSearch) return teamMembers
    return teamMembers.filter((member) => {
      const haystack = [member.name, member.email, member.phone, member.teamName]
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [teamMembers, normalizedSearch])

  return (
    <DashboardShell>
      <div className="space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#002449" }}>
            Contacts Directory
          </h1>
          <p className="text-sm text-muted-foreground">{headingCopy}</p>
        </header>

        {showDirectory && (
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: "#002449" }}>
                Search contacts
              </p>
              <p className="text-xs text-muted-foreground">
                Filter by name, email, phone, or team information across all sections.
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search directory…"
                className="pl-10"
                aria-label="Search contacts"
              />
            </div>
          </div>
        )}

        {!showDirectory ? (
          <Card className="border border-destructive/30 bg-destructive/5 text-destructive">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4" /> Restricted access
              </CardTitle>
              <CardDescription className="text-xs text-destructive/90">
                Only admin and POC users can view the contacts directory.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            <DirectorySection
              title="Admin team"
              description="Core admin stakeholders responsible for programme oversight."
              contacts={filteredAdminContacts}
              isSearching={Boolean(normalizedSearch)}
            />
            <DirectorySection
              title="Jury"
              description="Evaluation panel designated to specific problem statements."
              contacts={filteredJuryContacts}
              isSearching={Boolean(normalizedSearch)}
            />
            <DirectorySection
              title="Points of Contact"
              description="Primary points of contact mapped to problem statements."
              contacts={filteredPocContacts}
              isSearching={Boolean(normalizedSearch)}
            />

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg" style={{ color: "#002449" }}>
                  <Users className="h-5 w-5 text-[#002449]" /> Team members
                </CardTitle>
                <CardDescription>
                  Every member pulled from {role === "admin" ? "all registered teams." : "your assigned teams."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="h-32 animate-pulse rounded-lg border border-dashed border-border/60 bg-muted/20" />
                    ))}
                  </div>
                ) : memberError ? (
                  <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {memberError}
                  </div>
                ) : filteredTeamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {normalizedSearch
                      ? "No team members match your search right now."
                      : "No team members available to display right now."}
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTeamMembers.map((member) => (
                      <div key={member.id} className="rounded-lg border border-border/60 bg-white p-4 shadow-sm">
                        <p className="text-sm font-semibold" style={{ color: "#002449" }}>
                          {member.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground break-all">{member.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{member.phone || "Phone not shared"}</p>
                        <Badge variant="outline" className="mt-2 w-fit text-[11px] uppercase tracking-wide">
                          <Building2 className="mr-1 h-3.5 w-3.5" /> {member.teamName}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function DirectorySection({
  title,
  description,
  contacts,
  isSearching,
}: {
  title: string
  description: string
  contacts: DirectoryContact[]
  isSearching: boolean
}) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg" style={{ color: "#002449" }}>
          <ShieldCheck className="h-5 w-5 text-[#002449]" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isSearching ? "No contacts match your search." : "No contacts available at this time."}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => (
              <div key={contact.email} className="rounded-lg border border-border/60 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-[#007367]" />
                  <p className="text-sm font-semibold" style={{ color: "#002449" }}>
                    {contact.name}
                  </p>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 break-all">
                    <Mail className="h-3.5 w-3.5" /> {contact.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> {contact.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" /> {contact.undertaking}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function contactMatches(contact: DirectoryContact, query: string): boolean {
  const haystack = [contact.name, contact.email, contact.phone, contact.undertaking]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return haystack.includes(query)
}

function collectTeamMembers(teams: Array<AdminTeamSummary | TeamDetails>): DirectoryMember[] {
  const unique = new Map<string, DirectoryMember>()

  teams.forEach((team) => {
    const teamName = team.name || team.team_id || "Team"
    const members: TeamMemberSummary[] = Array.isArray(team.members) ? team.members : []

    members.forEach((member, index) => {
      const key = member.id?.toString() || `${teamName}-${member.user?.email || index}`
      if (unique.has(key)) return

      unique.set(key, {
        id: key,
        name: member.user?.name || member.user?.email || "Member",
        email: member.user?.email || "—",
        phone: member.phone || "",
        teamName,
      })
    })
  })

  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name))
}
