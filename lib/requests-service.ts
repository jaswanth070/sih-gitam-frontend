/**
 * Requests Service API Client
 * Handles all communication with the Requests microservice
 */

import { authService } from "./auth-service"
import { buildRequestsBaseUrl } from "./ws-url"

const BASE_URL = buildRequestsBaseUrl()
const ACCESS_TOKEN_KEY = "sih_access_token"

export interface BOMItem {
  id?: number
  item_name: string
  quantity: number
}

export interface AdditionalItem {
  id?: number
  item_name: string
  quantity: number
}

export interface FabricationDetails {
  fab_type: "3D" | "LASER" | "OTHER"
  name: string
  file?: string
}

export interface RequestData {
  id: number
  team_id: string
  team_name?: string
  submitted_by_id: string
  category: "BOM" | "ADDITIONAL" | "FABRICATION"
  status: "Submitted" | "Processing" | "Issued" | "Cannot be Processed"
  notes: string // legacy field; backend now may send `description`
  description?: string
  remarks?: string | null
  created_at: string
  updated_at: string
  position?: number
  bom_items: BOMItem[]
  additional_items: AdditionalItem[]
  fabrication: FabricationDetails | null
}

export interface ListRequestsParams {
  category?: "BOM" | "ADDITIONAL" | "FABRICATION"
  status?: "Submitted" | "Processing" | "Issued" | "Cannot be Processed"
  fab_type?: "3D" | "LASER" | "OTHER"
  team_id?: string
  search?: string
  ordering?: string
  page?: number
}

export interface TeamRequestsParams {
  category?: "BOM" | "ADDITIONAL" | "FABRICATION"
  status?: "Submitted" | "Processing" | "Issued" | "Cannot be Processed"
  fab_type?: "3D" | "LASER" | "OTHER"
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

export interface RequestsListResponse {
  count: number
  next: string | null
  previous: string | null
  results: RequestData[]
}

// Queue snapshot response (includes explicit paging metadata and optional positions)
export interface QueueSnapshotResponse {
  count: number
  page: number
  page_size: number
  results: RequestData[]
}

export interface QueueSnapshotParams {
  category?: "BOM" | "ADDITIONAL" | "FABRICATION"
  status?: "Submitted" | "Processing" | "Issued" | "Cannot be Processed"
  fab_type?: "3D" | "LASER" | "OTHER"
  include_positions?: boolean
  page?: number
  page_size?: number
}

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const headers = new Headers(options.headers || {})

  const accessToken = authService.getAccessToken()
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  let response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    const refreshToken = authService.getRefreshToken()
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${BASE_URL}/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        })

        if (refreshResponse.ok) {
          const { access } = await refreshResponse.json()
          localStorage.setItem(ACCESS_TOKEN_KEY, access)
          headers.set("Authorization", `Bearer ${access}`)
          response = await fetch(url, { ...options, headers })
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

export const requestsService = {
  // List requests with filters
  async listRequests(params?: ListRequestsParams): Promise<RequestsListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.category) queryParams.append("category", params.category)
    if (params?.status) queryParams.append("status", params.status)
    if (params?.fab_type) queryParams.append("fab_type", params.fab_type)
    if (params?.team_id) queryParams.append("team_id", params.team_id)
    if (params?.search) queryParams.append("search", params.search)
    if (params?.ordering) queryParams.append("ordering", params.ordering)
    if (params?.page) queryParams.append("page", params.page.toString())

    const endpoint = `/requests/?${queryParams.toString()}`
    return apiCall<RequestsListResponse>(endpoint)
  },

  // Get queue snapshot
  async getQueueSnapshot(includePositions = true): Promise<RequestsListResponse> {
    const endpoint = `/requests/queue/?include_positions=${includePositions}`
    return apiCall<RequestsListResponse>(endpoint)
  },

  // Filtered queue snapshot (canonical ordering, optional positions, pagination)
  async getFilteredQueueSnapshot(params: QueueSnapshotParams): Promise<QueueSnapshotResponse> {
    const qp = new URLSearchParams()
    if (params.category) qp.append("category", params.category)
    if (params.status) qp.append("status", params.status)
    if (params.fab_type) qp.append("fab_type", params.fab_type)
    if (params.include_positions !== undefined) qp.append("include_positions", params.include_positions ? "true" : "false")
    if (params.page) qp.append("page", params.page.toString())
    if (params.page_size) qp.append("page_size", params.page_size.toString())
    const endpoint = `/requests/queue/?${qp.toString()}`
    return apiCall<QueueSnapshotResponse>(endpoint)
  },

  // Get single request
  async getRequest(id: number): Promise<RequestData> {
    return apiCall<RequestData>(`/requests/${id}/`)
  },

  // Create BOM request
  async createBOMRequest(teamId: string, notes: string, items: BOMItem[]): Promise<RequestData> {
    return apiCall<RequestData>("/requests/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team_id: teamId,
        category: "BOM",
        notes,
        bom_items: items,
      }),
    })
  },

  // Create Additional request
  async createAdditionalRequest(teamId: string, notes: string, items: AdditionalItem[]): Promise<RequestData> {
    return apiCall<RequestData>("/requests/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team_id: teamId,
        category: "ADDITIONAL",
        notes,
        additional_items: items,
      }),
    })
  },

  // Create Fabrication request with file
  async createFabricationRequest(
    teamId: string,
    notes: string,
    fabDetails: FabricationDetails,
    file?: File,
  ): Promise<RequestData> {
    const formData = new FormData()
    formData.append("team_id", teamId)
    formData.append("category", "FABRICATION")
    formData.append("notes", notes)
    formData.append("fabrication", JSON.stringify(fabDetails))
    if (file) {
      formData.append("file", file)
    }

    const accessToken = authService.getAccessToken()
    const headers = new Headers()
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`)
    }

    const response = await fetch(`${BASE_URL}/requests/`, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || error.message || `API Error: ${response.status}`)
    }

    return response.json()
  },

  // Change request status
  async changeRequestStatus(id: number, toStatus: string, note?: string, remarks?: string): Promise<RequestData> {
    return apiCall<RequestData>(`/requests/${id}/change_status/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to_status: toStatus,
        note: note || "",
        ...(remarks !== undefined ? { remarks } : {}),
      }),
    })
  },

  // List all requests for a specific team via dedicated endpoint
  async listTeamRequests(teamId: string, params?: TeamRequestsParams): Promise<RequestsListResponse> {
    const qp = new URLSearchParams()
    if (params?.category) qp.append("category", params.category)
    if (params?.status) qp.append("status", params.status)
    if (params?.fab_type) qp.append("fab_type", params.fab_type)
    if (params?.search) qp.append("search", params.search)
    if (params?.ordering) qp.append("ordering", params.ordering)
    if (params?.page) qp.append("page", params.page.toString())
    if (params?.page_size) qp.append("page_size", params.page_size.toString())
    const endpoint = `/teams/${teamId}/requests/${qp.toString() ? `?${qp.toString()}` : ""}`
    return apiCall<RequestsListResponse>(endpoint)
  },
}
