import { authService } from "@/lib/auth-service"
import { buildDocumentsBaseUrl } from "@/lib/documents-service"

const DOCUMENTS_BASE_URL = buildDocumentsBaseUrl()

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const base = DOCUMENTS_BASE_URL.replace(/\/+$/, "") || "/"
  if (base === "/") {
    return normalizedPath
  }
  return `${base}${normalizedPath}`
}

function requireAuthHeaders(contentType?: string): Headers {
  const headers = new Headers()
  const token = authService.getAccessToken()

  if (!token) {
    throw new Error("Session expired. Please log in again.")
  }

  headers.set("Authorization", `Bearer ${token}`)
  if (contentType) {
    headers.set("Content-Type", contentType)
  }

  return headers
}

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.clone().json()
    if (typeof data === "string" && data.trim()) {
      return data
    }
    if (data && typeof data === "object") {
      const candidate =
        (data as Record<string, unknown>).detail ||
        (data as Record<string, unknown>).message ||
        (data as Record<string, unknown>).error

      if (typeof candidate === "string" && candidate.trim()) {
        return candidate
      }
    }
  } catch (jsonError) {
    // Ignore JSON parsing errors and attempt to read text instead.
  }

  try {
    const text = await response.clone().text()
    if (text.trim()) {
      return text
    }
  } catch (textError) {
    // Ignore text parsing errors.
  }

  return fallback
}

async function parseJsonBody<T>(response: Response): Promise<T | null> {
  if (response.status === 204) {
    return null
  }
  try {
    return (await response.json()) as T
  } catch (error) {
    return null
  }
}

export type DocumentType =
  | "govt_id"
  | "college_id"
  | "consent_letter"
  | "bank_details"
  | "travel_allowance"
  | "beneficiary_form"
  | "bills"
  | (string & {})

export interface PrepareUploadResponse {
  upload_url: string
  version_id: string
  storage_path?: string
}

export interface NotifyUploadResponse {
  detail?: string
  status?: string
  [key: string]: unknown
}

export interface DownloadUrlResponse {
  download_url: string
  expires_at?: string
  [key: string]: unknown
}

export interface DocumentVersionDetail {
  id: string
  version: number
  status: string
  original_filename?: string
  mime_type?: string
  size_bytes?: number
  uploaded_at?: string
  uploader_id?: string
  approved_at?: string
  approved_by?: string
  rejection_reason?: string | null
  download_url?: string
  storage_path?: string
  team_id?: string
  team_name?: string
  document_type?: DocumentType
}

export interface DocumentOverviewItem {
  team_id: string
  team_name?: string
  document_type: DocumentType
  document_id: string
  versions_count: number
  latest_status: string
  latest_version?: DocumentVersionDetail
  pending_review: boolean
  requires_upload: boolean
}

export interface DocumentOverviewResponse {
  documents: DocumentOverviewItem[]
}

export interface TeamDocumentHistoryItem {
  document_id?: string
  document_type: DocumentType
  latest_status: string
  latest_version?: DocumentVersionDetail
  versions: DocumentVersionDetail[]
  pending_review?: boolean
  requires_upload?: boolean
}

export interface TeamDocumentHistoryResponse {
  team_id: string
  documents: TeamDocumentHistoryItem[]
}

type UploadableFile = File | Blob

export async function prepareUpload(
  teamId: string,
  file: UploadableFile,
  documentType: DocumentType,
): Promise<PrepareUploadResponse> {
  if (!teamId) {
    throw new Error("Missing team identifier.")
  }

  const filename = (file as File).name || "document"
  const contentType = (file as File).type || "application/octet-stream"
  const response = await fetch(
    buildUrl(`/documents/api/${teamId}/prepare-upload/`),
    {
      method: "POST",
      headers: requireAuthHeaders("application/json"),
      body: JSON.stringify({
        document_type: documentType,
        filename,
        content_type: contentType,
      }),
    },
  )

  if (!response.ok) {
    const message = await extractErrorMessage(response, "Failed to prepare upload.")
    throw new Error(message)
  }

  const body = await parseJsonBody<PrepareUploadResponse>(response)
  if (!body?.upload_url || !body.version_id) {
    throw new Error("Unexpected response from prepare-upload endpoint.")
  }

  return body
}

export async function uploadToGCS(uploadUrl: string, file: UploadableFile): Promise<void> {
  if (!uploadUrl) {
    throw new Error("Missing upload URL.")
  }

  const headers = new Headers()
  const contentType = (file as File).type
  if (contentType) {
    headers.set("Content-Type", contentType)
  }

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers,
    body: file,
  })

  if (!response.ok) {
    const message = await extractErrorMessage(response, "File upload failed.")
    throw new Error(message)
  }
}

export async function notifyUploaded(versionId: string): Promise<NotifyUploadResponse | null> {
  if (!versionId) {
    throw new Error("Missing version identifier.")
  }

  const response = await fetch(
    buildUrl(`/documents/api/notify-uploaded/${versionId}/`),
    {
      method: "POST",
      headers: requireAuthHeaders(),
    },
  )

  if (!response.ok) {
    const message = await extractErrorMessage(response, "Failed to notify backend about the upload.")
    throw new Error(message)
  }

  return parseJsonBody<NotifyUploadResponse>(response)
}

export async function approveDocument(versionId: string): Promise<NotifyUploadResponse | null> {
  if (!versionId) {
    throw new Error("Missing version identifier.")
  }

  const response = await fetch(
    buildUrl(`/documents/api/approve/${versionId}/`),
    {
      method: "POST",
      headers: requireAuthHeaders(),
    },
  )

  if (!response.ok) {
    const message = await extractErrorMessage(response, "Failed to approve document.")
    throw new Error(message)
  }

  return parseJsonBody<NotifyUploadResponse>(response)
}

export async function rejectDocument(versionId: string, remarks?: string): Promise<NotifyUploadResponse | null> {
  if (!versionId) {
    throw new Error("Missing version identifier.")
  }

  const trimmedRemarks = remarks?.trim()
  const response = await fetch(
    buildUrl(`/documents/api/reject/${versionId}/`),
    {
      method: "POST",
      headers: requireAuthHeaders(trimmedRemarks ? "application/json" : undefined),
      body: trimmedRemarks ? JSON.stringify({ remarks: trimmedRemarks }) : undefined,
    },
  )

  if (!response.ok) {
    const message = await extractErrorMessage(response, "Failed to reject document.")
    throw new Error(message)
  }

  return parseJsonBody<NotifyUploadResponse>(response)
}

export async function getDownloadURL(versionId: string): Promise<DownloadUrlResponse> {
  if (!versionId) {
    throw new Error("Missing version identifier.")
  }

  const response = await fetch(
    buildUrl(`/documents/api/download/${versionId}/`),
    {
      method: "GET",
      headers: requireAuthHeaders(),
    },
  )

  if (!response.ok) {
    const message = await extractErrorMessage(response, "Failed to get download URL.")
    throw new Error(message)
  }

  const body = await parseJsonBody<DownloadUrlResponse>(response)
  if (!body?.download_url) {
    throw new Error("Download URL not provided by the server.")
  }

  return body
}

function buildQueryString(params?: Record<string, string | undefined | null>): string {
  if (!params) return ""
  const qp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      qp.set(key, String(value).trim())
    }
  })
  const query = qp.toString()
  return query ? `?${query}` : ""
}

export async function listDocumentVersions(params?: {
  status?: string
  document_type?: DocumentType | string
  team_id?: string
}): Promise<DocumentVersionDetail[]> {
  const response = await fetch(
    buildUrl(`/documents/api/admin/versions/${buildQueryString(params)}`),
    {
      method: "GET",
      headers: requireAuthHeaders(),
    },
  )

  if (!response.ok) {
    const message = await extractErrorMessage(response, "Failed to load document versions.")
    throw new Error(message)
  }

  return (await parseJsonBody<DocumentVersionDetail[]>(response)) ?? []
}

export async function listPendingDocuments(): Promise<DocumentVersionDetail[]> {
  return listDocumentVersions({ status: "pending" })
}

export async function getDocumentDashboardOverview(): Promise<DocumentOverviewItem[]> {
  const response = await fetch(buildUrl("/documents/api/dashboard/overview/"), {
    method: "GET",
    headers: requireAuthHeaders(),
  })

  if (!response.ok) {
    const message = await extractErrorMessage(response, "Failed to load document overview.")
    throw new Error(message)
  }

  const payload = (await parseJsonBody<DocumentOverviewResponse>(response)) ?? { documents: [] }
  return payload.documents || []
}

export async function getTeamDocumentHistory(teamId: string): Promise<TeamDocumentHistoryItem[]> {
  if (!teamId) {
    throw new Error("Missing team identifier.")
  }

  const response = await fetch(buildUrl(`/documents/api/dashboard/${teamId}/`), {
    method: "GET",
    headers: requireAuthHeaders(),
  })

  if (!response.ok) {
    const message = await extractErrorMessage(response, "Failed to load team document history.")
    throw new Error(message)
  }

  const payload = (await parseJsonBody<TeamDocumentHistoryResponse>(response)) ?? { team_id: teamId, documents: [] }
  return payload.documents || []
}
