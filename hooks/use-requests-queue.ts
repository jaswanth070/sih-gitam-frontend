"use client"

// Comprehensive Requests Queue hook implementing:
// 1. Initial canonical snapshot fetch (REST) with optional positions
// 2. WebSocket subscription with resilient exponential backoff
// 3. Upsert + ordering (FCFS oldest-first) using Map for O(1) access
// 4. State transition handling (remove if filtered out)
// 5. Re-sync on reconnect & periodic interval
// 6. Placeholder comments for future optimistic create support

import { useCallback, useEffect, useRef, useState } from 'react'
import { requestsService, type RequestData, type QueueSnapshotParams } from '@/lib/requests-service'
import { authService } from '@/lib/auth-service'

export interface QueueEventMessage {
  event: 'request_created' | 'request_updated' | 'state_transition'
  request?: RequestData
  request_id?: number
  from?: string
  to?: string
  changed_by?: string
  timestamp?: string
  note?: string
}

interface UseRequestsQueueOptions extends Omit<QueueSnapshotParams, 'include_positions' | 'page' | 'page_size'> {
  pageSize?: number
  activeOnly?: boolean // If true, hide Issued / Cannot be Processed
  resyncIntervalMs?: number
  token?: string // optional explicit JWT override
  dropUnfilteredEvents?: boolean // if true, ignore events not matching current filters instead of upserting then filtering
}

interface RequestsQueueState {
  requests: RequestData[]
  live: boolean
  loading: boolean
  error: string
  refresh: () => Promise<void>
  upsertById: (req: RequestData) => void
  forceReconnect: () => void
  recentlyChangedIds: number[]
}

export function useRequestsQueue(options: UseRequestsQueueOptions = {}): RequestsQueueState {
  const { category, status, fab_type, pageSize = 50, activeOnly = false, resyncIntervalMs = 300000, token, dropUnfilteredEvents = true } = options
  const [requests, setRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)
  const [recentlyChangedIds, setRecentlyChangedIds] = useState<number[]>([])
  const highlightTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map())

  // Internal store (Map) for O(1) upsert
  const storeRef = useRef<{ byId: Map<number, RequestData>; list: RequestData[] }>({ byId: new Map(), list: [] })
  const wsRef = useRef<WebSocket | null>(null)
  const backoffRef = useRef(1000)
  const reconnectingRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const closedRef = useRef(false)

  const applyList = useCallback((list: RequestData[]) => {
    storeRef.current.byId.clear()
    list.forEach(r => storeRef.current.byId.set(r.id, r))
    storeRef.current.list = list
    setRequests(list)
  }, [])

  const computeOrdered = useCallback((arr: RequestData[]) => {
    const ordered = [...arr].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    return ordered.map((r, idx) => ({ ...r, position: r.position ?? (idx + 1) }))
  }, [])

  const snapshotFetch = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params: QueueSnapshotParams = {
        include_positions: true,
        page: 1,
        page_size: pageSize,
        category,
        status,
        fab_type,
      }
      const snap = await requestsService.getFilteredQueueSnapshot(params)
      // Filter active-only if enabled
      const filtered = activeOnly ? snap.results.filter(r => !['Issued', 'Cannot be Processed'].includes(r.status)) : snap.results
      applyList(computeOrdered(filtered))
    } catch (err) {
      console.error('[queue-hook] snapshot error', err)
      setError(err instanceof Error ? err.message : 'Snapshot fetch failed')
    } finally {
      setLoading(false)
    }
  }, [applyList, computeOrdered, category, status, fab_type, pageSize, activeOnly])

  const upsert = useCallback((req: RequestData) => {
    const store = storeRef.current
    store.byId.set(req.id, req)
    const idx = store.list.findIndex(r => r.id === req.id)
    if (idx >= 0) {
      store.list[idx] = req
    } else {
      // Insert preserving created_at ascending
      const pos = store.list.findIndex(r => new Date(r.created_at) > new Date(req.created_at))
      if (pos === -1) store.list.push(req)
      else store.list.splice(pos, 0, req)
    }
    // Active-only filtering
    let list = store.list
    if (activeOnly) list = list.filter(r => !['Issued', 'Cannot be Processed'].includes(r.status))
    const ordered = computeOrdered(list)
    setRequests(ordered)
  }, [activeOnly, computeOrdered])

  const applyTransition = useCallback((id: number, to: string) => {
    const store = storeRef.current
    const existing = store.byId.get(id)
    if (!existing) return
    const updated = { ...existing, status: to as any }
    store.byId.set(id, updated)
    const idx = store.list.findIndex(r => r.id === id)
    if (idx >= 0) store.list[idx] = updated
    // Remove if activeOnly and becomes terminal
    let list = store.list
    if (activeOnly && ['Issued', 'Cannot be Processed'].includes(updated.status)) {
      list = list.filter(r => r.id !== id)
      store.list = list
    }
    const ordered = computeOrdered(list)
    setRequests(ordered)
  }, [activeOnly, computeOrdered])

  const registerHighlight = useCallback((id: number) => {
    setRecentlyChangedIds(prev => prev.includes(id) ? prev : [...prev, id])
    // Clear existing timeout if re-triggered
    const existing = highlightTimeoutsRef.current.get(id)
    if (existing) clearTimeout(existing)
    const to = setTimeout(() => {
      setRecentlyChangedIds(prev => prev.filter(x => x !== id))
      highlightTimeoutsRef.current.delete(id)
    }, 2000)
    highlightTimeoutsRef.current.set(id, to)
  }, [])

  const handleMessage = useCallback((msg: QueueEventMessage) => {
    if (msg.event === 'request_created' || msg.event === 'request_updated') {
      if (msg.request) {
        // Optionally drop events that do not match active filters
        if (dropUnfilteredEvents) {
          if (category && msg.request.category !== category) return
          if (status && msg.request.status !== status) return
          if (fab_type && msg.request.fabrication?.fab_type !== fab_type) return
        }
        upsert(msg.request)
        registerHighlight(msg.request.id)
      }
    } else if (msg.event === 'state_transition' && msg.request_id) {
      applyTransition(msg.request_id, msg.to || '')
      registerHighlight(msg.request_id)
    }
  }, [upsert, applyTransition, category, status, fab_type, dropUnfilteredEvents, registerHighlight])

  const connectWs = useCallback(() => {
    const jwt = token || authService.getAccessToken()
    if (!jwt) return
    // Derive backend origin from env NEXT_PUBLIC_REQUESTS_SERVICE_URL if provided
    let backendOrigin = ''
    const envBase = process.env.NEXT_PUBLIC_REQUESTS_SERVICE_URL
    if (envBase) {
      try { backendOrigin = new URL(envBase).origin } catch {}
    }
    // Fallback: explicit backend port 8001 if env not set
    if (!backendOrigin) {
      backendOrigin = 'http://127.0.0.1:8001'
    }
    const secure = backendOrigin.startsWith('https://')
    const proto = secure ? 'wss' : 'ws'
    const host = backendOrigin.replace(/^https?:\/\//, '')
    const url = `${proto}://${host}/ws/requests/?token=${encodeURIComponent(jwt)}`
    try {
      wsRef.current = new WebSocket(url)
      wsRef.current.onopen = () => {
        setLive(true)
        backoffRef.current = 1000
        if (reconnectingRef.current) {
          snapshotFetch() // resync after reconnect
          reconnectingRef.current = false
        }
      }
      wsRef.current.onmessage = ev => {
        try {
          const data = JSON.parse(ev.data)
          handleMessage(data)
        } catch (e) {
          console.error('[queue-hook] parse error', e)
        }
      }
      wsRef.current.onclose = () => {
        setLive(false)
        if (closedRef.current) return
        reconnectingRef.current = true
        const delay = backoffRef.current
        setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 1.5, 30000)
          connectWs()
        }, delay)
      }
      wsRef.current.onerror = err => {
        console.error('[queue-hook] ws error', err)
      }
    } catch (err) {
      console.error('[queue-hook] ws connect error', err)
    }
  }, [handleMessage, snapshotFetch])

  const refresh = useCallback(async () => {
    await snapshotFetch()
  }, [snapshotFetch])

  const forceReconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    } else {
      connectWs()
    }
  }, [connectWs])

  // Init
  useEffect(() => {
    closedRef.current = false
    snapshotFetch().then(() => connectWs())
    // periodic resync
    intervalRef.current = setInterval(() => {
      if (!closedRef.current) snapshotFetch()
    }, resyncIntervalMs)
    return () => {
      closedRef.current = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      wsRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, fab_type, pageSize, activeOnly])

  // NOTE: For future optimistic create support:
  // Provide a function optimisticCreate(payload) that inserts temp entry with id `temp-<ts>`
  // then replaces or removes based on POST result.

  return { requests, live, loading, error, refresh, upsertById: upsert, forceReconnect, recentlyChangedIds }
}
