/**
 * Generic API Client with automatic token management
 * Used for POC document uploads and other API calls
 */

import { authService, buildAuthBaseUrl } from "./auth-service"

const BASE_URL = buildAuthBaseUrl()
const ACCESS_TOKEN_KEY = "sih_access_token"

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const headers = new Headers(options.headers || {})

  // Add auth token if available
  const accessToken = authService.getAccessToken()
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle 401 - try to refresh token
  if (response.status === 401) {
    const refreshToken = authService.getRefreshToken()
    if (refreshToken) {
      try {
        // Attempt to refresh token
        const refreshResponse = await fetch(`${BASE_URL}/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        })

        if (refreshResponse.ok) {
          const { access } = await refreshResponse.json()
          localStorage.setItem(ACCESS_TOKEN_KEY, access)

          // Retry with new token
          headers.set("Authorization", `Bearer ${access}`)
          const retryResponse = await fetch(url, { ...options, headers })
          if (!retryResponse.ok) {
            throw new Error(`API Error: ${retryResponse.status}`)
          }
          return retryResponse.json()
        }
      } catch (error) {
        authService.clearTokens()
        window.location.href = "/login"
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || error.message || `API Error: ${response.status}`)
  }

  return response.json()
}
