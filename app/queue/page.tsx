"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"
import { requestsService, type RequestData } from "@/lib/requests-service"
import { formatRequestTitle, summarizeFabrication, formatFileSize, cn } from "@/lib/utils"
import { useRequestsQueue } from "@/hooks/use-requests-queue"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { RequestProgress } from "@/components/requests/request-progress"
import { StatusChangeModal } from "@/components/modals/status-change-modal"

export default function QueuePage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const user = authService.getCurrentUser()

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [fabTypeFilter, setFabTypeFilter] = useState<string>("")
  const [searchFilter, setSearchFilter] = useState("")

  // Check authentication and authorization
  useEffect(() => {
    const token = authService.getAccessToken()
    if (!token) {
      router.push("/login")
      return
    }

    // Verify user is POC or admin
    const user = authService.getCurrentUser()
    if (!user || (!user.is_poc && !user.is_admin)) {
      router.push("/dashboard")
    }
  }, [router])

  // Hook: snapshot + websocket live queue
  const token = authService.getAccessToken()
  const { requests, live, loading, error: hookError, refresh, forceReconnect, recentlyChangedIds } = useRequestsQueue({
    token,
    pageSize: 50,
    activeOnly: false,
    resyncIntervalMs: 300000,
  })

  useEffect(() => {
    if (hookError) setError(hookError)
  }, [hookError])
  const [loadingIds, setLoadingIds] = useState<string[]>([])
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    request: RequestData
    nextStatus: string
  } | null>(null)

  const shouldCollectRemarks = useCallback((currentStatus: string, nextStatus: string) => {
    if (nextStatus === "Cannot be Processed") return true
    return currentStatus === "Processing" && nextStatus === "Issued"
  }, [])

  const handleStatusChange = async (
    requestId: string,
    newStatus: string,
    remarks?: string,
  ) => {
    setLoadingIds((ids) => (ids.includes(requestId) ? ids : [...ids, requestId]))

    const finalNote = `Status changed to ${newStatus}`

    try {
      await requestsService.changeRequestStatus(requestId, newStatus, finalNote, remarks)
      setError("")
      setPendingStatusChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change status")
    } finally {
      setLoadingIds((ids) => ids.filter((id) => id !== requestId))
    }
  }

  const initiateStatusChange = (request: RequestData, newStatus: string) => {
    if (shouldCollectRemarks(request.status, newStatus)) {
      setPendingStatusChange({ request, nextStatus: newStatus })
      return
    }

    void handleStatusChange(request.id, newStatus)
  }

  const filteredRequests = useMemo(() => {
    const base = requests.filter(req => {
      if (categoryFilter && req.category !== categoryFilter) return false
      if (statusFilter && req.status !== statusFilter) return false
      if (fabTypeFilter && req.fabrication?.fab_type !== fabTypeFilter) return false
      if (searchFilter) {
        const haystack = (req.notes || '') + ' ' + req.bom_items.map(i => i.item_name).join(' ') + ' ' + req.additional_items.map(i => i.item_name).join(' ')
        if (!haystack.toLowerCase().includes(searchFilter.toLowerCase())) return false
      }
      return true
    })
    if (!statusFilter) {
      return base.filter(r => r.status !== 'Issued' && r.status !== 'Cannot be Processed')
    }
    return base
  }, [requests, categoryFilter, statusFilter, fabTypeFilter, searchFilter])

  const metrics = useMemo(() => ({
    total: filteredRequests.length,
    submitted: filteredRequests.filter(r => r.status === 'Submitted').length,
    processing: filteredRequests.filter(r => r.status === 'Processing').length,
    issued: filteredRequests.filter(r => r.status === 'Issued').length,
    rejected: filteredRequests.filter(r => r.status === 'Cannot be Processed').length,
  }), [filteredRequests])

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Metrics Strip */}
        <div className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            <MetricStripItem label="Total" value={metrics.total} color="#002449" />
            <MetricStripItem label="Submitted" value={metrics.submitted} color="#f75700" />
            <MetricStripItem label="Processing" value={metrics.processing} color="#007367" />
            <MetricStripItem label="Issued" value={metrics.issued} color="#078e31" />
            <MetricStripItem label="Rejected" value={metrics.rejected} color="#6b7280" />
          </div>
        </div>
        <ConnectionStatus
          live={live}
          onRefresh={refresh}
          onReconnect={forceReconnect}
          ordering="FCFS"
        />
        {/* Filters Toolbar */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 items-center">
            <FilterSegment
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={['', 'BOM', 'ADDITIONAL', 'FABRICATION']}
            />
            <FilterSegment
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={['', 'Submitted', 'Processing', 'Issued', 'Cannot be Processed']}
            />
            <FilterSegment
              label="Fab"
              value={fabTypeFilter}
              onChange={setFabTypeFilter}
              options={['', '3D', 'LASER', 'OTHER']}
            />
            <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent w-full sm:w-56"
              />
              <button
                onClick={() => { setCategoryFilter(''); setStatusFilter(''); setFabTypeFilter(''); setSearchFilter('') }}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
              >Clear</button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Queue FCFS Cards */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-600 bg-white border border-gray-200 rounded-lg">Loading queue...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-600 bg-white border border-gray-200 rounded-lg">No requests match filters.</div>
          ) : (
            <ul className="space-y-3">
              {filteredRequests.map((r, idx) => (
                <li key={r.id}>
                    <QueueRow
                      request={r}
                      position={idx + 1}
                      onAdvance={initiateStatusChange}
                      canAdvance={!!user && (user.is_poc || user.is_admin)}
                      highlight={recentlyChangedIds.includes(r.id)}
                      loading={loadingIds.includes(r.id)}
                    />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {pendingStatusChange && (
        <StatusChangeModal
          open={!!pendingStatusChange}
          currentStatus={pendingStatusChange.request.status}
          targetStatus={pendingStatusChange.nextStatus}
          loading={loadingIds.includes(pendingStatusChange.request.id)}
          onClose={() => setPendingStatusChange(null)}
          onConfirm={async (remarks) => {
            if (!pendingStatusChange) return
            await handleStatusChange(
              pendingStatusChange.request.id,
              pendingStatusChange.nextStatus,
              remarks,
            )
          }}
        />
      )}
    </DashboardShell>
  )
}

function categoryBadgeColor(category: string) {
  if (category === 'BOM') return '#002449'
  if (category === 'ADDITIONAL') return '#007367'
  if (category === 'FABRICATION') return '#f75700'
  return '#6b7280'
}
function statusAccent(status: string) {
  if (status === 'Submitted') return '#f75700'
  if (status === 'Processing') return '#007367'
  if (status === 'Issued') return '#078e31'
  if (status === 'Cannot be Processed') return '#6b7280'
  return '#002449'
}

interface QueueRowProps {
  request: RequestData
  position: number
  onAdvance: (request: RequestData, next: string) => void
  canAdvance: boolean
  highlight?: boolean
  loading?: boolean
}

function QueueRow({ request, position, onAdvance, canAdvance, highlight = false, loading = false }: QueueRowProps) {
  const nextStatus = request.status === 'Submitted'
    ? 'Processing'
    : request.status === 'Processing'
      ? 'Issued'
      : ''
  const fabricationSummary = summarizeFabrication(request.fabrication)
  const fabricationPreviewUrl = fabricationSummary?.fileUrl ?? null
  const openFabricationPreview = () => {
    if (!fabricationPreviewUrl) return
    window.open(fabricationPreviewUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`relative bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition ${highlight ? 'flash-update' : ''} ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 text-[11px] font-semibold rounded-full bg-gray-100 border border-gray-200 text-gray-600">{position}</span>
        <span className="px-2 py-1 text-[11px] font-semibold text-white rounded-md" style={{ backgroundColor: categoryBadgeColor(request.category) }}>{request.category}</span>
        <RequestProgress status={request.status} />
        <span className="px-2 py-1 text-[11px] font-semibold rounded-md" style={{ backgroundColor: statusAccent(request.status), color: '#fff' }}>{request.status}</span>
        {request.team_name && (
          <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold rounded-full bg-[#002449] text-white">
            {request.team_name}
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{formatRequestTitle(request)}</h3>
      <div className="flex flex-wrap gap-4 text-[11px] text-gray-600">
        {(request.bom_items?.length || 0) > 0 && <span>BOM: {request.bom_items.length}</span>}
        {(request.additional_items?.length || 0) > 0 && <span>Additional: {request.additional_items.length}</span>}
        {fabricationSummary && (
          <span>
            Fab: {fabricationSummary.secondary ? `${fabricationSummary.base} • ${fabricationSummary.secondary}` : fabricationSummary.base}
            {fabricationSummary.filename && ` — ${fabricationSummary.filename}${fabricationSummary.fileSize != null ? ` (${formatFileSize(fabricationSummary.fileSize)})` : ''}`}
          </span>
        )}
        <span>Created: {new Date(request.created_at).toLocaleTimeString()}</span>
        <span>Updated: {new Date(request.updated_at).toLocaleTimeString()}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={`/my-requests/${request.id}`}
          className="px-3 py-1.5 text-[11px] font-medium rounded-md border border-gray-300 hover:bg-gray-50"
        >View</a>
        {fabricationSummary?.fileUrl && (
          <button
            type="button"
            onClick={openFabricationPreview}
            disabled={!fabricationPreviewUrl}
            className="px-3 py-1.5 text-[11px] font-medium rounded-md text-white"
            style={{ backgroundColor: '#f75700' }}
          >Preview</button>
        )}
        {canAdvance && nextStatus && (
          <button
            onClick={() => onAdvance(request, nextStatus)}
            disabled={loading}
            className="px-3 py-1.5 text-[11px] font-medium rounded-md text-white"
            style={{ backgroundColor: nextStatus === 'Processing' ? '#007367' : '#078e31' }}
          >{nextStatus === 'Processing' ? 'Accept' : 'Issue'}</button>
        )}
        {canAdvance && request.status !== 'Issued' && request.status !== 'Cannot be Processed' && (
          <button
            onClick={() => onAdvance(request, 'Cannot be Processed')}
            disabled={loading}
            className="px-3 py-1.5 text-[11px] font-medium rounded-md text-white bg-[#f75700]"
          >Reject</button>
        )}
        {loading && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-gray-800 text-white">Updating...</span>
        )}
      </div>
      {request.remarks && (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#002449]">Remarks</p>
          <p className="whitespace-pre-line text-xs text-gray-700">{request.remarks}</p>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col">
      <span className="text-[10px] uppercase tracking-wide font-medium text-gray-500">{label}</span>
      <span className="text-xl font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

function MetricPill() { return null }
function MetricStripItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 text-sm border-r last:border-r-0 border-gray-200">
      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-base font-semibold" style={{ color }}>{value}</span>
    </div>
  )
}

function FilterSegment({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-500">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map(opt => (
          <button
            key={opt || 'all'}
            onClick={() => onChange(opt)}
            className={cn(
              "px-2 py-1 text-[11px] rounded-md border transition-colors",
              value === opt
                ? "bg-accent text-white border-accent"
                : "bg-white hover:bg-gray-50 text-gray-600 border-gray-300"
            )}
            type="button"
          >{opt === '' ? 'All' : opt}</button>
        ))}
      </div>
    </div>
  )
}

function ConnectionStatus({ live, ordering, onRefresh, onReconnect }: { live: boolean; ordering: string; onRefresh: () => void; onReconnect: () => void }) {
  return (
    <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${live ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span className={`inline-block w-2 h-2 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          {live ? 'Live' : 'Disconnected'}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-gray-50 border border-gray-200">Ordering: {ordering}</span>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-[11px] font-medium rounded-md border border-gray-300 hover:bg-gray-50"
        >Refresh</button>
        <button
          onClick={onReconnect}
          className="px-3 py-1.5 text-[11px] font-medium rounded-md border border-gray-300 hover:bg-gray-50"
        >Reconnect</button>
      </div>
    </div>
  )
}
