"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { requestsService, type RequestData } from "@/lib/requests-service"
import { RequestProgress } from "@/components/requests/request-progress"

export default function RequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  const [request, setRequest] = useState<RequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [changingStatus, setChangingStatus] = useState(false)

  const user = authService.getCurrentUser()

  useEffect(() => {
    const token = authService.getAccessToken()
    if (!token) {
      router.push("/login")
      return
    }
  }, [router])

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true)
        const data = await requestsService.getRequest(Number.parseInt(requestId))
        setRequest(data)
      } catch (err) {
        console.error("[v0] Error fetching request:", err)
        setError(err instanceof Error ? err.message : "Failed to load request")
      } finally {
        setLoading(false)
      }
    }

    fetchRequest()
  }, [requestId])

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return

    try {
      setChangingStatus(true)
      const updated = await requestsService.changeRequestStatus(request.id, newStatus)
      setRequest(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setChangingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-[#f75700] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading request...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="p-6">
        <p className="text-gray-600 text-sm">{error || "Request not found"}</p>
      </div>
    )
  }

  const canChangeStatus = user?.is_poc || user?.is_admin
  const nextStatus =
    request.status === "Submitted"
      ? ["Processing", "Cannot be Processed"]
      : request.status === "Processing"
        ? ["Issued", "Cannot be Processed"]
        : []

  return (
      <div className="max-w-5xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        <div
          className="group relative bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm"
          style={{ boxShadow: `inset 0 0 0 2px ${accentColor(request.status)}20` }}
        >
          <span className="absolute inset-y-0 left-0 w-1 rounded-l-xl" style={{ backgroundColor: accentColor(request.status) }} />
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6 lg:gap-10 mb-6">
            <div className="space-y-3 md:space-y-4 flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="px-3 py-1 text-xs font-semibold text-white rounded-md"
                  style={{ backgroundColor: categoryColor(request.category) }}
                >{request.category}</span>
                <RequestProgress status={request.status} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight line-clamp-3">{request.notes || 'Request'}</h1>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] md:text-xs w-full lg:w-auto lg:min-w-[24rem]">
              <MetaBlock label="Created" value={new Date(request.created_at).toLocaleString()} />
              <MetaBlock label="Updated" value={new Date(request.updated_at).toLocaleString()} />
              <MetaBlock label="Status" value={request.status} />
              {request.position && <MetaBlock label="Queue" value={'#'+request.position} />}
            </div>
          </div>

          {/* BOM Items */}
          {request.bom_items && request.bom_items.length > 0 && (
            <Section title="BOM Items">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-50 border border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Item Name</th>
                    <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {request.bom_items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{item.item_name}</td>
                      <td className="px-3 py-2 text-right font-semibold">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Additional Items */}
          {request.additional_items && request.additional_items.length > 0 && (
            <Section title="Additional Items">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-50 border border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Item Name</th>
                    <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {request.additional_items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{item.item_name}</td>
                      <td className="px-3 py-2 text-right font-semibold">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Fabrication */}
          {request.fabrication && (
            <Section title="Fabrication Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <MetaBlock label="Type" value={request.fabrication.fab_type} />
                <MetaBlock label="Name" value={request.fabrication.name} />
              </div>
              {request.fabrication.file && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href={request.fabrication.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-xs font-medium text-[#002449] hover:bg-gray-50"
                  >Download File →</a>
                </div>
              )}
            </Section>
          )}

          {/* Status Actions */}
          {canChangeStatus && nextStatus.length > 0 && (
            <div className="pt-6 mt-6 border-t border-gray-200">
              <h2 className="text-sm font-semibold mb-4" style={{color:'#f75700'}}>Update Status</h2>
              <div className="flex flex-wrap gap-2">
                {nextStatus.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={changingStatus}
                    className="px-4 py-2 text-xs font-semibold rounded-md text-white"
                    style={{ backgroundColor: status === 'Cannot be Processed' ? '#f75700' : '#078e31' }}
                  >
                    {changingStatus ? 'Updating...' : status === 'Cannot be Processed' ? 'Reject' : 'Mark ' + status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  )

}


function categoryColor(cat: string) {
  if (cat === 'BOM') return '#002449'
  if (cat === 'ADDITIONAL') return '#007367'
  return '#f75700'
}
function accentColor(status: string) {
  if (status === 'Submitted') return '#f75700'
  if (status === 'Processing') return '#002449'
  if (status === 'Issued') return '#078e31'
  return '#6b7280'
}
function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">{label}</p>
      <p className="text-xs font-semibold text-gray-900 truncate whitespace-nowrap max-w-[12rem]" title={value}>{value}</p>
    </div>
  )
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold mb-3" style={{color:'#002449'}}>{title}</h2>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden p-2 md:p-3">
        {children}
      </div>
    </div>
  )
}
// Duplicate legacy blocks removed to resolve parse error.
