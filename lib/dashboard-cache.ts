import { authService, type TeamDetails, type POCTeam } from "./auth-service"

// Simple in-memory caches with TTL
const TEAM_TTL_MS = 2 * 60 * 1000 // 2 minutes
const POC_TEAMS_TTL_MS = 60 * 1000 // 1 minute
const VOLUNTEER_TEAMS_TTL_MS = 60 * 1000 // 1 minute

let teamCache: { data: TeamDetails | null; ts: number } = { data: null, ts: 0 }
let pocTeamsCache: { data: POCTeam[]; ts: number } = { data: [], ts: 0 }
let volunteerTeamsCache: { data: TeamDetails[]; ts: number } = { data: [], ts: 0 }
const volunteerTeamDetailsCache: Record<string, { data: TeamDetails; ts: number }> = {}

export async function getCachedTeamDetails(force = false): Promise<TeamDetails> {
  const now = Date.now()
  if (!force && teamCache.data && now - teamCache.ts < TEAM_TTL_MS) {
    return teamCache.data
  }
  const data = await authService.getTeamDetails()
  teamCache = { data, ts: now }
  return data
}

export async function getCachedPOCTeams(force = false): Promise<POCTeam[]> {
  const now = Date.now()
  if (!force && pocTeamsCache.data.length && now - pocTeamsCache.ts < POC_TEAMS_TTL_MS) {
    return pocTeamsCache.data
  }
  const data = await authService.getPOCTeams()
  pocTeamsCache = { data, ts: now }
  return data
}

export async function getCachedVolunteerTeams(force = false): Promise<TeamDetails[]> {
  const now = Date.now()
  if (!force && volunteerTeamsCache.data.length && now - volunteerTeamsCache.ts < VOLUNTEER_TEAMS_TTL_MS) {
    return volunteerTeamsCache.data
  }
  const data = await authService.getVolunteerTeams()
  volunteerTeamsCache = { data, ts: now }
  return data
}

export async function getCachedVolunteerTeamDetail(teamId: string, force = false): Promise<TeamDetails> {
  const now = Date.now()
  const cacheEntry = volunteerTeamDetailsCache[teamId]
  if (!force && cacheEntry && now - cacheEntry.ts < TEAM_TTL_MS) {
    return cacheEntry.data
  }
  const detail = await authService.getVolunteerTeamDetail(teamId)
  volunteerTeamDetailsCache[teamId] = { data: detail, ts: now }
  return detail
}

export function clearDashboardCaches() {
  teamCache = { data: null, ts: 0 }
  pocTeamsCache = { data: [], ts: 0 }
  volunteerTeamsCache = { data: [], ts: 0 }
  Object.keys(volunteerTeamDetailsCache).forEach((key) => delete volunteerTeamDetailsCache[key])
}
