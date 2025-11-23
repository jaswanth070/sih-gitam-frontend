/**
 * Auth Service API Client
 * Handles all authentication-related API calls with secure token management
 */

const ACCESS_TOKEN_KEY = "sih_access_token"
const REFRESH_TOKEN_KEY = "sih_refresh_token"
const BASE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://127.0.0.1:8000/api"

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

export interface TeamDetails {
  id: string
  name: string
  institution: string
  poc: any
  faculty_mentor: {
    id: string
    name: string
  }
  problem_statement: {
    id: string
    title: string
  }
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      email: string
      name: string
    }
  }>
}

export interface POCTeam {
  id: string
  name: string
  institution: string
  [key: string]: any
}

export interface CurrentUser {
  id?: string
  email?: string
  name?: string
  team_ids?: string[]
  role?: string
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
    const endpoint = preview ? "/leader/team/?preview=1" : "/leader/team/"
    return this.request(endpoint)
  }

  async confirmTeamDetails(): Promise<{ detail: string; next: string }> {
    return this.request("/leader/team/confirm/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
  }

  async getPOCTeams(): Promise<POCTeam[]> {
    return this.request("/poc/teams/")
  }

  async getPOCTeamDetail(teamId: string): Promise<TeamDetails> {
    return this.request(`/poc/teams/${teamId}/`)
  }

  async logout(): Promise<{ detail: string }> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      this.clearTokens()
      return { detail: "Logged out" }
    }

    try {
      const response = await this.request<{ detail: string }>("/auth/logout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      this.clearTokens()
      return response
    } catch (error) {
      this.clearTokens()
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
      return response
    } catch (error) {
      this.clearTokens()
      return { detail: "Logged out from all devices" }
    }
  }
}

export const authService = new AuthService()
