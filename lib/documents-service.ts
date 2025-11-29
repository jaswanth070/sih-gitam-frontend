const FALLBACK_DOCUMENTS_BASE_URL = "http://127.0.0.1:8002"

function normalizeBasePath(pathname: string): string {
  if (!pathname) return ""
  return pathname.replace(/\/+$/, "")
}

export function buildDocumentsBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_DOC_SERVICE_URL
  if (!raw) return FALLBACK_DOCUMENTS_BASE_URL

  if (raw.startsWith("/")) {
    const normalized = normalizeBasePath(raw)
    return normalized || "/"
  }

  try {
    const url = new URL(raw)
    url.pathname = normalizeBasePath(url.pathname)
    return `${url.origin}${url.pathname}`
  } catch (error) {
    console.warn("[documents-service] invalid NEXT_PUBLIC_DOC_SERVICE_URL, using default", error)
    return FALLBACK_DOCUMENTS_BASE_URL
  }
}
