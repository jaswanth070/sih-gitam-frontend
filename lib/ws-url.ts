const DEFAULT_REQUESTS_SERVICE_URL = "http://127.0.0.1:8001"
const FALLBACK_REQUESTS_BASE_URL = `${DEFAULT_REQUESTS_SERVICE_URL}/requests/api`

function normalizeRequestsPath(pathname: string): string {
  let normalized = pathname.replace(/\/+$/, "")
  if (!normalized) return "/requests/api"
  if (!normalized.startsWith("/")) normalized = `/${normalized}`
  if (normalized.endsWith("/requests/api")) return normalized
  if (normalized.endsWith("/requests")) return `${normalized}/api`
  if (normalized.endsWith("/api")) return normalized.replace(/\/api$/, "/requests/api")
  return `${normalized}/requests/api`
}

function deriveRequestsPrefix(pathname: string): string {
  const fullPath = normalizeRequestsPath(pathname)
  if (fullPath === "/requests/api") return "/requests"
  return fullPath.replace(/\/api$/, "") || "/requests"
}

/**
 * Build the requests service REST base URL, preferring env and falling back to localhost.
 */
export function buildRequestsBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_REQUESTS_SERVICE_URL
  if (!envUrl) return FALLBACK_REQUESTS_BASE_URL

  if (envUrl.startsWith("/")) {
    return normalizeRequestsPath(envUrl)
  }

  try {
    const url = new URL(envUrl)
    url.pathname = normalizeRequestsPath(url.pathname)
    return `${url.origin}${url.pathname}`
  } catch (err) {
    console.warn("[ws-url] invalid NEXT_PUBLIC_REQUESTS_SERVICE_URL, using default", err)
    return FALLBACK_REQUESTS_BASE_URL
  }
}

/**
 * Build WebSocket URL for the requests service, appending JWT token as query param.
 */
export function buildRequestsWsUrl(token: string): string | null {
  const explicitWs = process.env.NEXT_PUBLIC_REQUESTS_WS_URL
  if (explicitWs) {
    try {
      const wsUrl = new URL(explicitWs)
      wsUrl.searchParams.set("token", token)
      return wsUrl.toString()
    } catch (err) {
      console.warn("[ws-url] invalid NEXT_PUBLIC_REQUESTS_WS_URL, falling back", err)
    }
  }

  const baseRestUrl = process.env.NEXT_PUBLIC_REQUESTS_SERVICE_URL
  let origin = ""
  let prefixPath = "/requests"

  if (baseRestUrl) {
    if (baseRestUrl.startsWith("http")) {
      try {
        const url = new URL(baseRestUrl)
        origin = url.origin
        prefixPath = deriveRequestsPrefix(url.pathname)
      } catch (err) {
        console.warn("[ws-url] invalid NEXT_PUBLIC_REQUESTS_SERVICE_URL, using defaults", err)
      }
    } else {
      prefixPath = deriveRequestsPrefix(baseRestUrl)
    }
  }

  if (!origin) origin = DEFAULT_REQUESTS_SERVICE_URL

  const secure = origin.startsWith("https://")
  const protocol = secure ? "wss" : "ws"
  const host = origin.replace(/^https?:\/\//, "")
  let wsPath = `${prefixPath}/ws/requests/`
  wsPath = wsPath.replace(/\/+/g, "/")
  if (!wsPath.startsWith("/")) wsPath = `/${wsPath}`

  return `${protocol}://${host}${wsPath}?token=${encodeURIComponent(token)}`
}
