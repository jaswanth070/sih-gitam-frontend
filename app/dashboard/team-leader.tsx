"use client"

import { useEffect, useMemo, useState } from "react"
import { authService, type TeamContact, type TeamDetails } from "@/lib/auth-service"
import { getStoredLeaderTeam } from "@/lib/session-store"
import { GraduationCap, IdCard, Layers, Mail, Phone, Users } from "lucide-react"

type TeamLeaderDashboardProps = {
  user?: any
}

type PocField = {
  label: string
  value?: string | null
}

type OverviewField = {
  label: string
  value: string
}

export function TeamLeaderDashboard({ user: _user }: TeamLeaderDashboardProps = {}) {
  void _user
  const cachedTeam = getStoredLeaderTeam()
  const [team, setTeam] = useState<TeamDetails | null>(cachedTeam)
  const [loading, setLoading] = useState(!cachedTeam)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const teamData = await authService.getTeamDetails()
        setTeam(teamData)
      } catch (err: any) {
        setError(err.message || "Failed to load team")
      } finally {
        setLoading(false)
      }
    }

    fetchTeam()
  }, [])

  const mentorContacts = useMemo(() => {
    if (!team) return [] as TeamContact[]
    const seen = new Map<string, TeamContact>()
    const addContact = (contact?: TeamContact | null) => {
      if (!contact) return
      const key = contact.id || contact.email || `${contact.name ?? ""}_${contact.phone ?? ""}`
      if (seen.has(key)) return
      seen.set(key, contact)
    }

    addContact(team.faculty_mentor)
    addContact(team.faculty_mentor_1)
    addContact(team.faculty_mentor_2)
    if (Array.isArray(team.mentors)) {
      team.mentors.forEach(addContact)
    }

    return Array.from(seen.values())
  }, [team])

  const teamCode = team?.team_id || ""
  const displayTeamCode = teamCode || "Not assigned"

  const memberCount = team?.members?.length ?? 0

  const pocFields = useMemo<PocField[]>(() => {
    if (!team?.poc) return []
    const contact = team.poc as TeamContact
    return [
      { label: "Email", value: contact.email },
      { label: "Phone", value: contact.phone },
      { label: "Designation", value: contact.designation },
      { label: "Role", value: contact.role },
    ].filter((field) => field.value && String(field.value).trim().length > 0)
  }, [team])

  const problemStatementFields = useMemo<OverviewField[]>(() => {
    if (!team?.problem_statement) return []

    const fields: OverviewField[] = []

    if (team.problem_statement.id) {
      fields.push({ label: "Problem Statement ID", value: `#${team.problem_statement.id}` })
    }

    if (team.problem_statement.title) {
      fields.push({ label: "Title", value: team.problem_statement.title })
    }

    return fields
  }, [team])

  const instituteFields = useMemo<OverviewField[]>(() => {
    if (!team) return []

    const fields: OverviewField[] = []


    if (team.institution) {
      fields.push({ label: "Institution", value: team.institution })
    }

    const department = (team as Record<string, string | undefined>).department
    if (department) {
      fields.push({ label: "Department", value: department })
    }

    const track = (team as Record<string, string | undefined>).track || (team as Record<string, string | undefined>).category
    if (track) {
      fields.push({ label: "Track", value: track })
    }

    const state = (team as Record<string, string | undefined>).state
    const city = (team as Record<string, string | undefined>).city
    if (state || city) {
      const location = [city, state].filter(Boolean).join(", ")
      fields.push({ label: "Location", value: location })
    }

    return fields
  }, [displayTeamCode, team])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-[#002449]/15 bg-gradient-to-br from-[#002449]/10 via-white to-white p-8 shadow-sm md:p-12">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#002449]/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-24 top-10 h-48 w-48 rounded-full bg-[#f75700]/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-10 bottom-[-60px] h-60 w-60 rounded-full bg-[#0b8f6f]/20 blur-3xl" aria-hidden="true" />
        <div className="relative space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#002449] shadow-sm">
            <Users className="h-3.5 w-3.5" />
            Team Leader Dashboard
          </span>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-[#002449] md:text-4xl">
              {team ? `${team.name}` : "Team Leader Workspace"}
            </h2>
          </div>
          {team && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#002449]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 font-semibold shadow-sm">
                <IdCard className="h-4 w-4" />
                Team ID: {displayTeamCode}
              </span>
              {team.problem_statement?.id && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 font-semibold text-[#002449] shadow-sm backdrop-blur">
                  <Layers className="h-4 w-4" />
                  {team.problem_statement.id}
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 font-semibold shadow-sm">
                <GraduationCap className="h-4 w-4" />
                HARDWARE
              </span>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
          {error}
        </div>
      )}

      {team ? (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-[#002449]">Problem Statement Overview</h3>
                </div>
                {problemStatementFields.length > 0 ? (
                  <dl className="mt-6 grid gap-4 text-sm text-gray-700 sm:grid-cols-2">
                    {problemStatementFields.map((field: OverviewField) => (
                      <div key={field.label} className="space-y-1">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{field.label}</dt>
                        <dd className="font-medium text-gray-900">{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-6 text-sm text-gray-600">Problem statement details are not available yet.</p>
                )}
                {team.problem_statement?.description && (
                  <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">Summary</p>
                    <p className="mt-2 text-sm text-gray-600">{team.problem_statement.description}</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-[#002449]">Team Roster</h3>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{memberCount} member{memberCount === 1 ? "" : "s"}</span>
                </div>
                {memberCount > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {team.members.map((member) => {
                      const initials = getInitials(member.user.name)
                      return (
                        <div
                          key={member.id || member.user.email}
                          className="rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#002449] shadow">
                              {initials}
                            </span>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{member.user.name}</p>
                              <p className="text-xs font-semibold uppercase tracking-wide text-[#f75700]">
                                {member.role || "Member"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 space-y-1 text-xs text-gray-600">
                            <p className="flex items-center gap-2 break-all">
                              <Mail className="h-3.5 w-3.5 text-[#002449]" />
                              {member.user.email}
                            </p>
                            {member.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-[#002449]" />
                                {member.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-gray-600">Team roster details are not available yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#002449]">POC Details</h3>
                {team.poc ? (
                  <div className="mt-4 space-y-4 text-sm text-gray-700">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{team.poc.name || "Not provided"}</p>
                        {team.poc.role && (
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#f75700]">{team.poc.role}</p>
                        )}
                      </div>
                      {team.poc.is_verified_poc && (
                        <span className="rounded-full bg-[#078e31]/10 px-3 py-1 text-xs font-semibold text-[#078e31]">
                          Verified
                        </span>
                      )}
                    </div>
                    <dl className="space-y-3">
                      {pocFields.length > 0 ? (
                        pocFields.map((field: PocField) => (
                          <div key={field.label}>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{field.label}</dt>
                            <dd className="font-medium text-gray-900">{field.value}</dd>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">No additional POC details available.</p>
                      )}
                    </dl>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-600">A point of contact has not been assigned yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#002449]">Institute</h3>
                {instituteFields.length > 0 ? (
                  <dl className="mt-4 space-y-3 text-sm text-gray-700">
                    {instituteFields.map((field: OverviewField) => (
                      <div key={field.label}>
                        <dd className="font-medium text-gray-900">{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-4 text-sm text-gray-600">Institute information is not available yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-[#002449]">Faculty Mentors</h3>
                  <GraduationCap className="h-6 w-6 text-[#f75700]" />
                </div>
                {mentorContacts.length > 0 ? (
                  <ul className="mt-6 space-y-4">
                    {mentorContacts.map((mentor) => (
                      <li
                        key={mentor.id || mentor.email || mentor.name}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">{mentor.name || "Unnamed mentor"}</p>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#f75700]">
                              {mentor.role || mentor.designation || "Faculty mentor"}
                            </p>
                            {mentor.designation && (
                              <p className="text-sm text-gray-600">{mentor.designation}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                          {mentor.email && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-medium text-[#002449] shadow">
                              <Mail className="h-3.5 w-3.5" />
                              {mentor.email}
                            </span>
                          )}
                          {mentor.phone && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-medium text-[#002449] shadow">
                              <Phone className="h-3.5 w-3.5" />
                              {mentor.phone}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-6 text-sm text-gray-600">
                    No mentor information found. Ask your faculty coordinators to confirm mentor details in the admin portal.
                  </p>
                )}
              </div>

             
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-[#002449]">No team data available</h3>
          <p className="mt-2 text-sm text-gray-600">Once your profile is linked to a team, its stats and roster will appear here.</p>
        </div>
      )}
    </div>
  )
}

function getInitials(name?: string): string {
  if (!name) return "TL"
  const parts = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
  if (parts.length === 0) return "TL"
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}
