import type { AdminTeamSummary, CurrentUser, POCTeam, TeamDetails } from "./auth-service"

const SESSION_KEY = "sih_session_cache_v1"

type SessionPayload = {
  currentUser?: CurrentUser | null
  leaderTeam?: TeamDetails | null
  pocTeams?: POCTeam[]
  pocTeamDetails?: Record<string, TeamDetails>
  adminTeams?: AdminTeamSummary[]
  volunteerTeams?: TeamDetails[]
  volunteerTeamDetails?: Record<string, TeamDetails>
  updatedAt?: number
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function readSession(): SessionPayload {
  if (!isBrowser()) return {}
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as SessionPayload
    return parsed ?? {}
  } catch (error) {
    console.warn("[session-store] Failed to parse session payload", error)
    return {}
  }
}

function writeSession(payload: SessionPayload): void {
  if (!isBrowser()) return
  try {
    const serialized = JSON.stringify({ ...payload, updatedAt: Date.now() })
    window.localStorage.setItem(SESSION_KEY, serialized)
  } catch (error) {
    console.warn("[session-store] Failed to persist session payload", error)
  }
}

function mergeSession(partial: Partial<SessionPayload>): SessionPayload {
  const existing = readSession()
  const next: SessionPayload = {
    ...existing,
    ...partial,
  }
  writeSession(next)
  return next
}

export function clearSessionCache(): void {
  if (!isBrowser()) return
  window.localStorage.removeItem(SESSION_KEY)
}

export function storeCurrentUser(user: CurrentUser | null): void {
  mergeSession({ currentUser: user })
}

export function getStoredCurrentUser(): CurrentUser | null {
  const session = readSession()
  return session.currentUser ?? null
}

export function storeLeaderTeam(team: TeamDetails | null): void {
  mergeSession({ leaderTeam: team })
}

export function getStoredLeaderTeam(): TeamDetails | null {
  const session = readSession()
  return session.leaderTeam ?? null
}

export function storePOCTeams(teams: POCTeam[]): void {
  mergeSession({ pocTeams: teams })
}

export function getStoredPOCTeams(): POCTeam[] {
  const session = readSession()
  return Array.isArray(session.pocTeams) ? session.pocTeams : []
}

export function storePOCTeamDetail(team: TeamDetails): void {
  if (!team?.id) return
  const session = readSession()
  const nextDetails = { ...(session.pocTeamDetails ?? {}), [team.id]: team }
  mergeSession({ pocTeamDetails: nextDetails })
}

export function getStoredPOCTeamDetail(teamId: string | null | undefined): TeamDetails | null {
  if (!teamId) return null
  const session = readSession()
  const lookup = session.pocTeamDetails ?? {}
  return lookup[teamId] ?? null
}

export function storeAdminTeams(teams: AdminTeamSummary[]): void {
  mergeSession({ adminTeams: teams })
}

export function getStoredAdminTeams(): AdminTeamSummary[] {
  const session = readSession()
  return Array.isArray(session.adminTeams) ? session.adminTeams : []
}

export function storeVolunteerTeams(teams: TeamDetails[]): void {
  mergeSession({ volunteerTeams: teams })
}

export function getStoredVolunteerTeams(): TeamDetails[] {
  const session = readSession()
  return Array.isArray(session.volunteerTeams) ? session.volunteerTeams : []
}

export function storeVolunteerTeamDetail(team: TeamDetails): void {
  if (!team?.id) return
  const session = readSession()
  const nextDetails = { ...(session.volunteerTeamDetails ?? {}), [team.id]: team }
  mergeSession({ volunteerTeamDetails: nextDetails })
}

export function getStoredVolunteerTeamDetail(teamId: string | null | undefined): TeamDetails | null {
  if (!teamId) return null
  const session = readSession()
  const lookup = session.volunteerTeamDetails ?? {}
  return lookup[teamId] ?? null
}

export function getSessionSnapshot(): SessionPayload {
  return readSession()
}
