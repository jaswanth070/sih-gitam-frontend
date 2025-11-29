/**
 * Auth Service API Client
 * Handles all authentication-related API calls with secure token management
 */

import {
  clearSessionCache,
  getStoredAdminTeams,
  getStoredLeaderTeam,
  getStoredPOCTeamDetail,
  getStoredPOCTeams,
  storeAdminTeams,
  storeCurrentUser,
  storeLeaderTeam,
  storePOCTeamDetail,
  storePOCTeams,
} from "./session-store"

const ACCESS_TOKEN_KEY = "sih_access_token"
const REFRESH_TOKEN_KEY = "sih_refresh_token"
const FALLBACK_AUTH_BASE_URL = "http://127.0.0.1:8000/auth/api"

function normalizeAuthPath(pathname: string): string {
  let normalized = pathname.replace(/\/+$/, "")
  if (!normalized) return "/auth/api"
  if (!normalized.startsWith("/")) normalized = `/${normalized}`
  if (normalized.endsWith("/auth/api")) return normalized
  if (normalized.endsWith("/auth")) return `${normalized}/api`
  if (normalized.endsWith("/api")) return normalized
  return `${normalized}/auth/api`
}

export function buildAuthBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL
  if (!raw) return FALLBACK_AUTH_BASE_URL

  if (raw.startsWith("/")) {
    return normalizeAuthPath(raw)
  }

  try {
    const url = new URL(raw)
    url.pathname = normalizeAuthPath(url.pathname)
    return `${url.origin}${url.pathname}`
  } catch (err) {
    console.warn("[auth-service] invalid NEXT_PUBLIC_AUTH_SERVICE_URL, using default", err)
    return FALLBACK_AUTH_BASE_URL
  }
}

const BASE_URL = buildAuthBaseUrl()

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
}

export interface OTPRequest {
  email: string
  purpose: string
}

export interface OTPVerifyRequest {
  email: string
  otp: string
  new_password: string
}

export interface RefreshTokenRequest {
  refresh: string
}

export interface RefreshTokenResponse {
  access: string
}

export interface LogoutRequest {
  refresh: string
}

export interface TeamContact {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
  designation?: string | null
  role?: string | null
  gender?: string | null
  first_login?: boolean
  is_verified_poc?: boolean
}

export interface TeamMemberSummary {
  id: string
  role: string
  phone?: string | null
  gender?: string | null
  user: {
    id: string
    email: string
    name: string
  }
}

export interface ProblemStatementSummary {
  id: string
  title?: string | null
  description?: string | null
}

export interface TeamDetails {
  id: string
  team_id: string
  name: string
  institution: string
  poc: TeamContact | null
  faculty_mentor?: TeamContact | null
  faculty_mentor_1?: TeamContact | null
  faculty_mentor_2?: TeamContact | null
  mentors?: TeamContact[]
  problem_statement?: ProblemStatementSummary | null
  members: TeamMemberSummary[]
  [key: string]: any
}

export interface POCTeam {
  id: string
  name: string
  institution: string
  [key: string]: any
}

export interface AdminTeamSummary extends TeamDetails {
  status?: string
}

export interface CurrentUser {
  id?: string
  email?: string
  name?: string
  team_ids?: string[]
  role?: string
  is_admin?: boolean
  is_poc?: boolean
  is_leader?: boolean
  [key: string]: any
}

class AuthService {
  private accessTokenKey = ACCESS_TOKEN_KEY
  private refreshTokenKey = REFRESH_TOKEN_KEY

  private setTokens(access: string, refresh: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.accessTokenKey, access)
      localStorage.setItem(this.refreshTokenKey, refresh)
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.accessTokenKey)
    }
    return null
  }

  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.refreshTokenKey)
    }
    return null
  }

  clearTokens() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.accessTokenKey)
      localStorage.removeItem(this.refreshTokenKey)
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const url = `${BASE_URL}${endpoint}`
    const headers = new Headers(options.headers || {})

    const accessToken = this.getAccessToken()
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`)
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (response.status === 401 && retryCount === 0) {
      const refreshToken = this.getRefreshToken()
      if (refreshToken) {
        try {
          const newAccessToken = await this.refreshAccessToken(refreshToken)
          return this.request<T>(endpoint, options, 1)
        } catch (error) {
          this.clearTokens()
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
          throw new Error("Session expired. Please login again.")
        }
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || error.message || `API Error: ${response.status}`)
    }

    return response.json()
  }

  getCurrentUser(): CurrentUser | null {
    if (typeof window === "undefined") return null
    const token = this.getAccessToken()
    if (!token) return null

    try {
      const [, payload] = token.split(".")
      if (!payload) return null
      const json = JSON.parse(this.base64UrlDecode(payload))
      return json as CurrentUser
    } catch (e) {
      return null
    }
  }

  private base64UrlDecode(input: string): string {
    // Convert from base64url to base64
    let base64 = input.replace(/-/g, "+").replace(/_/g, "/")
    // Pad with '=' to make length a multiple of 4
    const pad = base64.length % 4
    if (pad) base64 += "=".repeat(4 - pad)
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      return decodeURIComponent(
        Array.prototype.map
          .call(window.atob(base64), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    }
    // Fallback for non-browser environments
    return Buffer.from(base64, "base64").toString("utf-8")
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>("/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })

    this.setTokens(response.access, response.refresh)
    if (typeof window !== "undefined") {
      this.initializeUserContext().catch((error: unknown) => {
        console.warn("[auth-service] Failed to initialize session context", error)
      })
    }
    return response
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await this.request<RefreshTokenResponse>("/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    const accessToken = response.access
    localStorage.setItem(this.accessTokenKey, accessToken)
    return accessToken
  }

  async requestOTP(email: string): Promise<{ detail: string }> {
    return this.request("/auth/send-otp/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "first_login" }),
    })
  }

  async verifyOTPAndSetPassword(request: OTPVerifyRequest): Promise<{ detail: string; next: string }> {
    return this.request("/auth/verify-otp/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
  }

  async autoLogin(email: string, password: string): Promise<LoginResponse> {
    return this.login({ email, password })
  }

  async getTeamDetails(preview = false): Promise<TeamDetails> {
    if (!preview) {
      const cached = getStoredLeaderTeam()
      if (cached) return cached
    }
    const endpoint = preview ? "/leader/team/?preview=1" : "/leader/team/"
    const data = await this.request<TeamDetails>(endpoint)
    if (!preview) {
      storeLeaderTeam(data)
    }
    return data
  }

  async confirmTeamDetails(): Promise<{ detail: string; next: string }> {
    return this.request("/leader/team/confirm/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
  }

  async getPOCTeams(): Promise<POCTeam[]> {
    const cached = getStoredPOCTeams()
    if (cached.length) return cached
    const data = await this.request<POCTeam[]>("/poc/teams/")
    storePOCTeams(data)
    return data
  }

  async getPOCTeamDetail(teamId: string): Promise<TeamDetails> {
    const cached = getStoredPOCTeamDetail(teamId)
    if (cached) return cached
    const data = await this.request<TeamDetails>(`/poc/teams/${teamId}/`)
    storePOCTeamDetail(data)
    return data
  }

  async getAdminTeams(): Promise<AdminTeamSummary[]> {
    const cached = getStoredAdminTeams()
    if (cached.length) return cached
    const data = await this.request<AdminTeamSummary[]>("/admin/teams/")
    storeAdminTeams(data)
    return data
    // return this.request("/poc/teams/")
  }

  async logout(): Promise<{ detail: string }> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      this.clearTokens()
      clearSessionCache()
      return { detail: "Logged out" }
    }

    try {
      const response = await this.request<{ detail: string }>("/auth/logout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      this.clearTokens()
      clearSessionCache()
      return response
    } catch (error) {
      this.clearTokens()
      clearSessionCache()
      return { detail: "Logged out" }
    }
  }

  async logoutAll(): Promise<{ detail: string }> {
    try {
      const response = await this.request<{ detail: string }>("/auth/logout_all/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      this.clearTokens()
      clearSessionCache()
      return response
    } catch (error) {
      this.clearTokens()
      clearSessionCache()
      return { detail: "Logged out from all devices" }
    }
  }

  async initializeUserContext(force = false): Promise<void> {
    if (typeof window === "undefined") return
    const user = this.getCurrentUser()
    if (!user) return

    storeCurrentUser(user)

    if (user.is_admin) {
      if (!force && getStoredAdminTeams().length) return
      try {
        const teams = await this.request<AdminTeamSummary[]>("/admin/teams/")
        storeAdminTeams(teams)
      } catch (error: unknown) {
        console.warn("[auth-service] unable to cache admin teams", error)
      }
      return
    }

    if (user.is_poc) {
      if (!force && getStoredPOCTeams().length) return
      try {
        const teams = await this.request<POCTeam[]>("/poc/teams/")
        storePOCTeams(teams)
        await Promise.all(
          teams.map(async (team) => {
            const teamKey = String(team.id)
            if (getStoredPOCTeamDetail(teamKey)) return
            try {
              const detail = await this.request<TeamDetails>(`/poc/teams/${teamKey}/`)
              storePOCTeamDetail(detail)
            } catch (error: unknown) {
              console.warn(`[auth-service] unable to cache POC team detail for ${teamKey}`, error)
            }
          }),
        )
      } catch (error: unknown) {
        console.warn("[auth-service] unable to cache POC teams", error)
      }
      return
    }

    if (!force && getStoredLeaderTeam()) return
    try {
      const team = await this.request<TeamDetails>("/leader/team/")
      storeLeaderTeam(team)
    } catch (error: unknown) {
      console.warn("[auth-service] unable to cache leader team", error)
    }
  }
}

export const authService = new AuthService()
