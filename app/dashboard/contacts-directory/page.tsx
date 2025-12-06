"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { AlertCircle, BadgeCheck, Building2, ChevronDown, Mail, Phone, Users, Search } from "lucide-react"

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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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

interface VolunteerContact {
  name: string
  idNumber: string
  duration: string
  phone: string
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
    name: "Mahesh",
    email: "",
    phone: "",
    undertaking: "",
  },
  {
    name: "Vemulapalli Vivek",
    email: "vvemulap2@gitam.in",
    phone: "9030134444",
    undertaking: "Logistics",
  },
  {
    name: "Wukkalam Abhitej",
    email: "wabhitej@gitam.in",
    phone: "6300306069",
    undertaking: "Operations",
  },
  {
    name: "Jaswanth Madiya",
    email: "jmadiya@gitam.in",
    phone: "8011810081",
    undertaking: "IT and Web",
  },
]

const POC_CONTACTS: DirectoryContact[] = [
  {
    name: "Allamse Abhinav",
    email: "aallamse@student.gitam.edu",
    phone: "6304408339",
    undertaking: "POC for SIH25214",
  },
  {
    name: "Arafath Sheik",
    email: "asheik1@gitam.in",
    phone: "9347520660",
    undertaking: "POC for SIH25211",
  },
  {
    name: "Abbaiah Rithika",
    email: "sabbaiah@gitam.in",
    phone: "6301699403",
    undertaking: "POC for SIH25212",
  },
  {
    name: "Ch Sai Yatin",
    email: "schittin@student.gitam.edu",
    phone: "6301699403",
    undertaking: "POC for SIH25213",
  },
  {
    name: "G S Surya Varma",
    email: "sgottumu3@student.gitam.edu",
    phone: " 9000133334",
    undertaking: "POC for SIH25256",
  },
]

const CO_POC_CONTACTS: DirectoryContact[] = [
  { name: "Srikar", email: "", phone: "9550399584", undertaking: "Co-POC for SIH25211" },
  { name: "Rohan", email: "", phone: "7569377646", undertaking: "Co-POC for SIH25256" },
  { name: "Koushik", email: "", phone: "9248674444", undertaking: "Co-POC for SIH25213" },
  { name: "W Taruntej", email: "", phone: "6305815354", undertaking: "Co-POC for SIH25212" },
  { name: "Madiya Charan Teja", email: "", phone: "9515462671", undertaking: "Co-POC for SIH25214" },
]

const VOLUNTEER_CONTACTS: VolunteerContact[] = [
  { name: "Sukumar Mahanthy", idNumber: "2025064058", duration: "3 Days", phone: "6281413953" },
  { name: "Manideep", idNumber: "2025193572", duration: "3 Days", phone: "7981207474" },
  { name: "T. Sasi Kiran Reddy", idNumber: "2025004479", duration: "3 Days", phone: "7702732277" },
  { name: "T. Akshaya", idNumber: "2025003080", duration: "3 Days", phone: "7995457799" },
  { name: "P.V.S.L. Nihal", idNumber: "2025146343", duration: "5 Days", phone: "8341703798" },
  { name: "Bora Mourya Kumar Reddy", idNumber: "2025090253", duration: "5 Days", phone: "9550946158" },
  { name: "Harshini", idNumber: "2025012248", duration: "3 Days", phone: "8309497243" },
  { name: "Hasini", idNumber: "2025151429", duration: "3 Days", phone: "7842596732" },
  { name: "Anoohya", idNumber: "2025016302", duration: "3 Days", phone: "8074304540" },
  { name: "Lokesh", idNumber: "2025012760", duration: "3 Days", phone: "7794035537" },
  { name: "Ruchitha Krishna", idNumber: "2025060061", duration: "5 Days - Full", phone: "8897252033" },
  { name: "Yashwanth", idNumber: "2025014187", duration: "5 Days", phone: "6300460429" },
  { name: "Tej", idNumber: "2025006574", duration: "5 Days", phone: "9654256963" },
  { name: "Lohitha", idNumber: "2024059570", duration: "3 Days Night + 5th Day", phone: "9573385103" },
  { name: "B. Harshit", idNumber: "2025120769", duration: "5 Days", phone: "9550450335" },
  { name: "Stuthi", idNumber: "2025256100", duration: "3 Days - Mrng", phone: "9573919377" },
  { name: "Varnika", idNumber: "2025019148", duration: "3 Days Mrng", phone: "7093996491" },
  { name: "Satya", idNumber: "2025142284", duration: "3 Days Mrng", phone: "8019333049" },
  { name: "K Shrujal Joy", idNumber: "2024007289", duration: "5 Days", phone: "7989508638" },
  { name: "Amith", idNumber: "2024056760", duration: "5 Days", phone: "9182149162" },
  { name: "Rushi", idNumber: "2024075866", duration: "5 Days", phone: "879032210" },
  { name: "Koushik", idNumber: "2025054176", duration: "5 Days", phone: "9248674444" },
  { name: "M K S Hasini", idNumber: "2024066601", duration: "3 Night", phone: "8143434747" },
  { name: "Sasi Kanth", idNumber: "2025713501", duration: "5 Days", phone: "8977415798" },
  { name: "Konathala Abhiram Kumar", idNumber: "2025098070", duration: "5 Days", phone: "9390760978" },
  { name: "Kolla Nitesh", idNumber: "2025448176", duration: "5 Days", phone: "7396738413" },
  { name: "Yeshwanth Reddy .J", idNumber: "2025014187", duration: "3 Days", phone: "6300460429" },
  { name: "Vijay", idNumber: "2025147862", duration: "3 Days", phone: "9494604577" },
  { name: "Shashank Yadhav", idNumber: "2025100782", duration: "5 Days", phone: "9390649753" },
  { name: "Nikhil.k", idNumber: "2025039050", duration: "3 Days", phone: "6304675463" },
  { name: "Thirupathi Kaushik", idNumber: "2025016355", duration: "5 Days", phone: "9493779288" },
  { name: "P. Ajay Bharadwaj Sastry", idNumber: "Missing", duration: "3 Days", phone: "8121485064" },
  { name: "Bommineni Sivaram Moham", idNumber: "2025102533", duration: "3 Days", phone: "6300524331" },
  { name: "Vasu", idNumber: "2025078176", duration: "Missing", phone: "7993161664" },
  { name: "Saadiah", idNumber: "2023", duration: "5 Days", phone: "Missing" },
]

export default function ContactsDirectoryPage() {
  const [role, setRole] = useState<"admin" | "poc" | "leader" | null>(null)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<DirectoryMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [teamSearchTerm, setTeamSearchTerm] = useState("")

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
    if (role === "admin") return "Central registry of administrators, POCs, and participating members."
    if (role === "poc") return "Find admins, fellow POCs, and contacts from your assigned teams."
    return "This directory is only available to admin and POC users."
  }, [role])

  const showDirectory = role === "admin" || role === "poc"
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const normalizedTeamSearch = teamSearchTerm.trim().toLowerCase()

  const filteredAdminContacts = useMemo(() => {
    if (!normalizedSearch) return ADMIN_CONTACTS
    return ADMIN_CONTACTS.filter((contact) => contactMatches(contact, normalizedSearch))
  }, [normalizedSearch])

  const filteredPocContacts = useMemo(() => {
    if (!normalizedSearch) return POC_CONTACTS
    return POC_CONTACTS.filter((contact) => contactMatches(contact, normalizedSearch))
  }, [normalizedSearch])

  const filteredCoPocContacts = useMemo(() => {
    if (!normalizedSearch) return CO_POC_CONTACTS
    return CO_POC_CONTACTS.filter((contact) => contactMatches(contact, normalizedSearch))
  }, [normalizedSearch])

  const filteredVolunteerContacts = useMemo(() => {
    if (!normalizedSearch) return VOLUNTEER_CONTACTS
    return VOLUNTEER_CONTACTS.filter((volunteer) => {
      const haystack = [volunteer.name, volunteer.idNumber, volunteer.duration, volunteer.phone]
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [normalizedSearch])

  const filteredTeamMembers = useMemo(() => {
    const base = normalizedSearch
      ? teamMembers.filter((member) => {
          const haystack = [member.name, member.email, member.phone, member.teamName]
            .join(" ")
            .toLowerCase()
          return haystack.includes(normalizedSearch)
        })
      : teamMembers

    if (!normalizedTeamSearch) {
      return []
    }

    return base.filter((member) => {
      const haystack = [member.name, member.email, member.phone, member.teamName]
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalizedTeamSearch)
    })
  }, [teamMembers, normalizedSearch, normalizedTeamSearch])

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
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: "#002449" }}>
                Quick search
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Filter by name, email, phone number, problem statement, or team name.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search directory…"
                  className="pl-10"
                  aria-label="Search contacts"
                />
              </div>
            </CardContent>
          </Card>
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
              contacts={filteredAdminContacts}
              isSearching={Boolean(normalizedSearch)}
            />
            <DirectorySection
              title="Points of Contact"
              contacts={filteredPocContacts}
              isSearching={Boolean(normalizedSearch)}
            />
            <DirectorySection
              title="Co-POCs"
              contacts={filteredCoPocContacts}
              isSearching={Boolean(normalizedSearch)}
            />
            <VolunteerSection
              title="Volunteer roster"
              contacts={filteredVolunteerContacts}
              isSearching={Boolean(normalizedSearch)}
            />

            <CollapsibleCard
              title="Team members"
              description={
                role === "admin"
                  ? "Search across every registered team."
                  : "Quickly find contacts from your assigned teams."
              }
              icon={<Users className="h-5 w-5 text-[#002449]" />}
            >
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={teamSearchTerm}
                    onChange={(event) => setTeamSearchTerm(event.target.value)}
                    placeholder="Search team members by name, email, or phone…"
                    className="pl-10"
                    aria-label="Search team members"
                    disabled={loadingMembers}
                  />
                </div>
              </div>

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
              ) : !normalizedTeamSearch ? (
                <p className="text-sm text-muted-foreground">
                  Enter a name, email, or phone number to find a team member.
                </p>
              ) : filteredTeamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members match your search right now.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTeamMembers.map((member) => (
                    <div key={member.id} className="rounded-lg border border-border/60 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold" style={{ color: "#002449" }}>
                        {member.name}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {member.email && member.email !== "—" ? (
                          <a
                            href={`mailto:${member.email}`}
                            className="flex items-center gap-2 break-all hover:text-[#007367]"
                          >
                            <Mail className="h-3.5 w-3.5" /> {member.email}
                          </a>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" /> Email not shared
                          </span>
                        )}
                        {member.phone ? (
                          <a
                            href={`tel:${member.phone.replace(/\s+/g, "")}`}
                            className="group flex items-center gap-2 text-[#007367] font-medium transition-colors hover:text-[#005a52]"
                          >
                            <Phone className="h-3.5 w-3.5 text-[#007367] transition-colors group-hover:text-[#005a52]" /> {member.phone}
                          </a>
                        ) : (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone not shared
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className="mt-3 w-fit text-[11px] uppercase tracking-wide">
                        <Building2 className="mr-1 h-3.5 w-3.5" /> {member.teamName}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleCard>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function DirectorySection({
  title,
  contacts,
  isSearching,
}: {
  title: string
  contacts: DirectoryContact[]
  isSearching: boolean
}) {
  return (
    <CollapsibleCard title={title}>
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isSearching ? "No contacts match your search." : "No contacts available at this time."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <div
              key={`${contact.name}-${contact.email || contact.phone}`}
              className="rounded-lg border border-border/60 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#007367]" />
                <p className="text-sm font-semibold" style={{ color: "#002449" }}>
                  {contact.name}
                </p>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 break-all hover:text-[#007367]"
                  >
                    <Mail className="h-3.5 w-3.5" /> {contact.email}
                  </a>
                ) : (
                  <span className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" /> Email not shared
                  </span>
                )}
                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                    className="group flex items-center gap-2 text-[#007367] font-medium transition-colors hover:text-[#005a52]"
                  >
                    <Phone className="h-3.5 w-3.5 text-[#007367] transition-colors group-hover:text-[#005a52]" /> {contact.phone.trim()}
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone not shared
                  </span>
                )}
                {contact.undertaking ? (
                  <Badge variant="outline" className="mt-1 w-fit text-[10px] uppercase tracking-wide">
                    {contact.undertaking}
                  </Badge>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </CollapsibleCard>
  )
}

function VolunteerSection({
  title,
  contacts,
  isSearching,
}: {
  title: string
  contacts: VolunteerContact[]
  isSearching: boolean
}) {
  return (
    <CollapsibleCard title={title}>
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isSearching ? "No volunteers match your search." : "No volunteer data available."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((volunteer) => (
            <div
              key={`${volunteer.name}-${volunteer.idNumber}`}
              className="rounded-lg border border-border/60 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-semibold" style={{ color: "#002449" }}>
                {volunteer.name}
              </p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <span className="block">ID: {volunteer.idNumber}</span>
                <span className="block">Duration: {volunteer.duration}</span>
                {volunteer.phone && volunteer.phone.toLowerCase() !== "missing" ? (
                  <a
                    href={`tel:${volunteer.phone.replace(/\s+/g, "")}`}
                    className="group flex items-center gap-2 text-[#007367] font-medium transition-colors hover:text-[#005a52]"
                  >
                    <Phone className="h-3.5 w-3.5 text-[#007367] transition-colors group-hover:text-[#005a52]" /> {volunteer.phone}
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone not shared
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </CollapsibleCard>
  )
}

function CollapsibleCard({
  title,
  description,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string
  description?: ReactNode
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-0">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-md px-0 py-2 text-left transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007367] focus-visible:ring-offset-2"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  {icon}
                  <CardTitle className="text-lg font-semibold" style={{ color: "#002449" }}>
                    {title}
                  </CardTitle>
                </div>
                {description ? (
                  <CardDescription className="text-sm text-muted-foreground">
                    {description}
                  </CardDescription>
                ) : null}
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="border-t border-gray-100 pt-4">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
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
