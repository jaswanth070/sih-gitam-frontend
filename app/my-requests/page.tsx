"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { requestsService, type RequestData } from "@/lib/requests-service"
import { RequestProgress } from "@/components/requests/request-progress"
import { RequestFilters } from "@/components/requests/request-filters"
import { DashboardShell } from "@/components/navigation/dashboard-shell"

export default function MyRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<RequestData[]>([])
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const user = authService.getCurrentUser()
  const teamIds: string[] = user?.team_ids || []

  const fetchOnce = useCallback(async () => {
    try {
      if (!authService.getAccessToken()) {
        router.push("/login")
        return
      }
      setLoading(true)
      setError("")
      if (!teamIds.length) {
        setRequests([])
        return
      }
      const response = await requestsService.listRequests({ ordering: "-created_at" })
      const filtered = response.results.filter((r: RequestData) => teamIds.includes(r.team_id))
      setRequests(filtered)
    } catch (err) {
      console.error("[requests] single fetch error", err)
      setError(err instanceof Error ? err.message : "Failed to fetch requests")
    } finally {
      setLoading(false)
    }
  }, [router, teamIds])

  useEffect(() => {
    fetchOnce()
    // only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (categoryFilter && r.category !== categoryFilter) return false
      if (searchQuery && !(r.notes || "Untitled").toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [requests, statusFilter, categoryFilter, searchQuery])

  const counts = useMemo(() => {
    const base = { Submitted: 0, Processing: 0, Issued: 0, Cannot: 0 }
    requests.forEach((r) => {
      if (r.status === "Submitted") base.Submitted++
      else if (r.status === "Processing") base.Processing++
      else if (r.status === "Issued") base.Issued++
      else if (r.status === "Cannot be Processed") base.Cannot++
    })
    return base
  }, [requests])

  const formatTS = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const statusAccent = (status: string) => {
    if (status === "Submitted") return "#f75700"
    if (status === "Processing") return "#002449"
    if (status === "Issued") return "#078e31"
    return "#6b7280"
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: "#002449" }}>
            My Requests
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOnce}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Refresh
            </button>
            <Link
              href="/my-requests/new"
              className="px-4 py-2 text-white font-medium rounded-lg transition-opacity"
              style={{ backgroundColor: "#f75700" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              New Request
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-gray-200 bg-white flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-gray-500">Submitted</span>
            <span className="text-xl font-bold" style={{ color: "#f75700" }}>{counts.Submitted}</span>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 bg-white flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-gray-500">Processing</span>
            <span className="text-xl font-bold" style={{ color: "#002449" }}>{counts.Processing}</span>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 bg-white flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-gray-500">Issued</span>
            <span className="text-xl font-bold" style={{ color: "#078e31" }}>{counts.Issued}</span>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 bg-white flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-gray-500">Cannot</span>
            <span className="text-xl font-bold" style={{ color: "#c62828" }}>{counts.Cannot}</span>
          </div>
        </div>
        <RequestFilters
          currentStatus={statusFilter}
          onStatusChange={setStatusFilter}
          search={searchQuery}
          onSearch={setSearchQuery}
          category={categoryFilter}
          onCategoryChange={setCategoryFilter}
        />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No requests yet</p>
          <Link
            href="/my-requests/new"
            className="inline-block px-4 py-2 text-white font-medium rounded-lg"
            style={{ backgroundColor: "#f75700" }}
          >
            Create Your First Request
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((request) => {
            const accent = statusAccent(request.status)
            return (
              <Link key={request.id} href={`/my-requests/${request.id}`}>
                <div
                  className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer h-full flex flex-col"
                  style={{ boxShadow: `inset 0 0 0 2px ${accent}20` }}
                >
                  <span className="absolute inset-y-0 left-0 w-1 rounded-l-lg" style={{ backgroundColor: accent }} />
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span
                      className="px-2 py-0.5 text-[10px] font-semibold text-white rounded-md"
                      style={{
                        backgroundColor:
                          request.category === "BOM"
                            ? "#002449"
                            : request.category === "ADDITIONAL"
                              ? "#007367"
                              : "#f75700",
                      }}
                    >{request.category}</span>
                    <RequestProgress status={request.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">{request.notes || "Untitled"}</h3>
                  {request.fabrication && (
                    <p className="text-xs text-gray-600 mb-2">{request.fabrication.fab_type} • {request.fabrication.name}</p>
                  )}
                  {(request.bom_items?.length || 0) > 0 && (
                    <div className="mb-2 space-y-1 max-h-24 overflow-auto pr-0.5">
                      {request.bom_items!.map((i) => (
                        <div key={i.id || i.item_name} className="px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-700 border border-gray-200 flex justify-between">
                          <span className="truncate pr-2">{i.item_name}</span>
                          <span className="font-mono">x{i.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(request.additional_items?.length || 0) > 0 && (
                    <div className="mb-2 space-y-1 max-h-24 overflow-auto pr-0.5">
                      {request.additional_items!.map((i) => (
                        <div key={i.id || i.item_name} className="px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-700 border border-gray-200 flex justify-between">
                          <span className="truncate pr-2">{i.item_name}</span>
                          <span className="font-mono">x{i.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto pt-2 grid grid-cols-2 gap-2 text-[10px] text-gray-600">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-500">Submitted</span>
                      <time title={request.created_at}>{formatTS(request.created_at)}</time>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-gray-500">Updated</span>
                      <time title={request.updated_at}>{formatTS(request.updated_at)}</time>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
