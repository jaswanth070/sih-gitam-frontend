const DEFAULT_REQUESTS_SERVICE_URL = "http://127.0.0.1:8001"

/**
 * Build the requests service REST base URL, preferring env and falling back to localhost.
 */
export function buildRequestsBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_REQUESTS_SERVICE_URL
  if (!envUrl) return `${DEFAULT_REQUESTS_SERVICE_URL}/api`

  try {
    // Ensure trailing slash removed for consistency
    return new URL(envUrl).toString().replace(/\/$/, "")
  } catch (err) {
    console.warn("[ws-url] invalid NEXT_PUBLIC_REQUESTS_SERVICE_URL, using default", err)
    return `${DEFAULT_REQUESTS_SERVICE_URL}/api`
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
  if (baseRestUrl) {
    try {
      origin = new URL(baseRestUrl).origin
    } catch (err) {
      console.warn("[ws-url] invalid NEXT_PUBLIC_REQUESTS_SERVICE_URL, falling back", err)
    }
  }

  if (!origin) origin = DEFAULT_REQUESTS_SERVICE_URL

  const secure = origin.startsWith("https://")
  const protocol = secure ? "wss" : "ws"
  const host = origin.replace(/^https?:\/\//, "")
  return `${protocol}://${host}/ws/requests/?token=${encodeURIComponent(token)}`
}
