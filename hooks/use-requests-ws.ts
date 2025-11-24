"use client"

/**
 * WebSocket hook for real-time requests queue updates
 * Handles automatic reconnection with exponential backoff
 */

import { useEffect, useRef, useCallback } from "react"
import { authService } from "@/lib/auth-service"
import { buildRequestsWsUrl } from "@/lib/ws-url"

// Derive backend origin for WebSocket from NEXT_PUBLIC_REQUESTS_SERVICE_URL if provided.
// Fallback to current window.location.origin (same host/port as frontend) if not set.
export interface WSMessage {
  event: "request_created" | "request_updated" | "state_transition"
  request?: any
  request_id?: number
  from?: string
  to?: string
  changed_by?: string
  timestamp?: string
  note?: string
}

const INITIAL_BACKOFF = 1000
const MAX_BACKOFF = 30000

export function useRequestsWS(onEvent: (message: WSMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const backoffRef = useRef(INITIAL_BACKOFF)
  const closedManuallyRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const getWsUrl = useCallback(() => {
    const token = authService.getAccessToken()
    if (!token) return null

    return buildRequestsWsUrl(token)
  }, [])

  const connect = useCallback(() => {
    const wsUrl = getWsUrl()
    if (!wsUrl) return

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("[v0] WebSocket connected")
        backoffRef.current = INITIAL_BACKOFF
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          onEvent(message)
        } catch (error) {
          console.error("[v0] Failed to parse WS message:", error)
        }
      }

      ws.onclose = (evt) => {
        console.log("[v0] WebSocket closed", evt.code, evt.reason || "")
        if (closedManuallyRef.current) return

        // Schedule reconnect with exponential backoff
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("[v0] Attempting to reconnect with backoff:", backoffRef.current)
          connect()
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF)
        }, backoffRef.current)
      }

      ws.onerror = (event) => {
        // Browser provides limited info; create a synthetic error object for consistency.
        console.error("[v0] WebSocket error: network/connection issue", { type: event.type })
      }
    } catch (error) {
      console.error("[v0] Failed to create WebSocket:", error)
    }
  }, [getWsUrl, onEvent])

  useEffect(() => {
    closedManuallyRef.current = false
    connect()

    return () => {
      closedManuallyRef.current = true
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    close: () => {
      closedManuallyRef.current = true
      wsRef.current?.close()
    },
  }
}
