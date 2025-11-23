"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { authService, type TeamDetails } from "@/lib/auth-service"
import { requestsService, type RequestData } from "@/lib/requests-service"
import { useRequestsWS } from "@/hooks/use-requests-ws"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { RequestProgress } from "@/components/requests/request-progress"

export default function POCTeamDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  const [team, setTeam] = useState<TeamDetails | null>(null)
  const [requests, setRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        const teamData = await authService.getPOCTeamDetail(teamId)
        setTeam(teamData)
      } catch (err: any) {
        setError(err.message || "Failed to load team details")
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      fetchTeamDetails()
    }
  }, [teamId])

  const handleWsEvent = (message: any) => {
    setRequests(prev => {
      if ((message.event === 'request_created' || message.event === 'request_updated') && message.request) {
        const r = message.request as RequestData
        if (r.team_id !== teamId) return prev
        const merged = [...prev.filter(x => x.id !== r.id), r]
        return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }
      if (message.event === 'state_transition' && message.request_id) {
        const updated = prev.map(r => r.id === message.request_id ? { ...r, status: message.to as any } : r)
        return updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }
      return prev
    })
  }

  useRequestsWS(handleWsEvent)

  useEffect(() => {
    if (!teamId) return
    const fetchSnapshot = async () => {
      try {
        const response = await requestsService.listTeamRequests(teamId, {
          ordering: 'created_at',
          page_size: 100,
        })
        const ordered = [...response.results].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        setRequests(ordered)
      } catch (err) {
        console.error('[team] Error fetching team requests snapshot:', err)
      }
    }
    fetchSnapshot()
    const interval = setInterval(fetchSnapshot, 300000) // periodic resync every 5 minutes
    return () => clearInterval(interval)
  }, [teamId])

  const handleStatusChange = async (requestId: number, newStatus: string) => {
    try {
      const updated = await requestsService.changeRequestStatus(requestId, newStatus)
      setBOMRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    }
  }

  const isLoading = loading

  return (
    <DashboardShell>
      <div className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-gray-300 border-t-[#f75700] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading team details...</p>
            </div>
          </div>
        ) : team ? (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="space-y-2 min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#002449' }}>{team.name}</h1>
                  <p className="text-sm text-gray-600 truncate">{team.institution}</p>
                  {team.problem_statement && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold tracking-wide bg-[#002449]/10 text-[#002449] border border-[#002449]/20 w-fit">
                      PS ID: {team.problem_statement.id}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-4 w-full md:w-auto">
                  {team.faculty_mentor && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Mentor</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{team.faculty_mentor.name}</p>
                    </div>
                  )}
                  {team.poc && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">POC</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{team.poc?.name || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>
              {team.members?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Team Members</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {team.members.map(m => (
                      <div key={m.user.email} className="border border-gray-200 bg-gray-50 rounded-md p-3 flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.user.name || m.user.email}</p>
                        <p className="text-[11px] text-gray-600">{m.role.replace(/_/g,' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: '#002449' }}>Team Requests ({requests.length})</h2>
              {requests.length === 0 ? (
                <p className="text-sm text-gray-600">No requests yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.map(r => (
                    <TeamRequestCard key={r.id} request={r} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600">No team data found.</p>
        )}
      </div>
    </DashboardShell>
  )
}

interface TeamRequestCardProps {
  request: RequestData
  onStatusChange: (requestId: number, newStatus: string) => void
}

function TeamRequestCard({ request, onStatusChange }: TeamRequestCardProps) {
  const accent = request.status === 'Submitted'
    ? '#f75700'
    : request.status === 'Processing'
      ? '#002449'
      : request.status === 'Issued'
        ? '#078e31'
        : '#6b7280'

  const next = request.status === 'Submitted'
    ? ['Processing', 'Cannot be Processed']
    : request.status === 'Processing'
      ? ['Issued', 'Cannot be Processed']
      : []

  return (
    <div
      className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex flex-col"
      style={{ boxShadow: `inset 0 0 0 2px ${accent}20` }}
    >
      <span className="absolute inset-y-0 left-0 w-1 rounded-l-lg" style={{ backgroundColor: accent }} />
      <div className="flex items-center justify-between gap-3 mb-2">
        <span
          className="px-2 py-0.5 text-[10px] font-semibold text-white rounded-md"
          style={{
            backgroundColor:
              request.category === 'BOM'
                ? '#002449'
                : request.category === 'ADDITIONAL'
                  ? '#007367'
                  : '#f75700'
          }}
        >{request.category}</span>
        <RequestProgress status={request.status} />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">{request.notes || 'Untitled'}</h3>
      {request.fabrication && (
        <p className="text-xs text-gray-600 mb-2">{request.fabrication.fab_type} • {request.fabrication.name}</p>
      )}
      {(request.bom_items?.length || 0) > 0 && (
        <div className="mb-2 space-y-1 max-h-20 overflow-auto pr-0.5">
          {request.bom_items!.map(i => (
            <div key={i.id || i.item_name} className="px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-700 border border-gray-200 flex justify-between">
              <span className="truncate pr-2">{i.item_name}</span>
              <span className="font-mono">x{i.quantity}</span>
            </div>
          ))}
        </div>
      )}
      {(request.additional_items?.length || 0) > 0 && (
        <div className="mb-2 space-y-1 max-h-20 overflow-auto pr-0.5">
          {request.additional_items!.map(i => (
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
          <time title={request.created_at}>{new Date(request.created_at).toLocaleString()}</time>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-medium text-gray-500">Updated</span>
          <time title={request.updated_at}>{new Date(request.updated_at).toLocaleString()}</time>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/requests/${request.id}`}
          className="px-3 py-1.5 text-[11px] font-medium rounded-md border border-gray-300 hover:bg-gray-50"
        >View</Link>
        {next.map(status => (
          <button
            key={status}
            onClick={() => onStatusChange(request.id, status)}
            className="px-3 py-1.5 text-[11px] font-medium rounded-md text-white"
            style={{ backgroundColor: status === 'Cannot be Processed' ? '#f75700' : '#078e31' }}
          >{status === 'Cannot be Processed' ? 'Reject' : status === 'Processing' ? 'Accept' : status === 'Issued' ? 'Issue' : status}</button>
        ))}
      </div>
    </div>
  )
}
