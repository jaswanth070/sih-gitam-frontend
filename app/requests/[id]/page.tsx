"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { authService } from "@/lib/auth-service"
import { requestsService, type RequestData } from "@/lib/requests-service"
import { StatusChangeModal } from "@/components/modals/status-change-modal"
import { RequestProgress } from "@/components/requests/request-progress"

export default function RequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  const [request, setRequest] = useState<RequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [changingStatus, setChangingStatus] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)

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

  const shouldCollectRemarks = useCallback((currentStatus: string, nextStatus: string) => {
    if (nextStatus === "Cannot be Processed") return true
    return currentStatus === "Processing" && nextStatus === "Issued"
  }, [])

  const handleStatusChange = useCallback(
    async (newStatus: string, remarks?: string) => {
      if (!request) return

      try {
        setChangingStatus(true)
        const updated = await requestsService.changeRequestStatus(
          request.id,
          newStatus,
          `Status changed to ${newStatus}`,
          remarks,
        )
        setRequest(updated)
        setPendingStatus(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update status")
      } finally {
        setChangingStatus(false)
      }
    },
    [request],
  )

  const initiateStatusChange = useCallback(
    (nextStatus: string) => {
      if (!request) return
      if (shouldCollectRemarks(request.status, nextStatus)) {
        setPendingStatus(nextStatus)
        return
      }

      void handleStatusChange(nextStatus)
    },
    [handleStatusChange, request, shouldCollectRemarks],
  )

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#f75700]" />
          <p className="text-gray-600 font-medium">Loading request...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">{error || "Request not found"}</p>
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

  const accent = accentColor(request.status)
  const accentSoft = `${accent}1a`
  const headerGradient = `linear-gradient(135deg, ${accentSoft} 0%, #ffffff 65%)`
  const headingText = request.notes.trim().length > 0
    ? request.notes
    : request.description && request.description.trim().length > 0
      ? request.description
      : "Request"
  const detailedCopy = request.description && request.description.trim().length > 0
    ? request.description
    : request.notes.trim().length > 0
      ? request.notes
      : "No additional details were provided."
  const createdAt = new Date(request.created_at).toLocaleString()
  const updatedAt = new Date(request.updated_at).toLocaleString()
  const queuePosition = request.position ? `#${request.position}` : "--"
  const teamName = request.team_name || "Unassigned Team"

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-8 pb-12">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
          <div className="absolute inset-0" style={{ backgroundImage: headerGradient }} />
          <div className="relative space-y-6 p-8 md:p-12">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: categoryColor(request.category) }}
              >
                {request.category}
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: accentColor(request.status) }}
              >
                {request.status}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">{headingText}</h1>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 shadow-sm">
                  <span className="uppercase tracking-wide text-gray-500">Request</span>
                  <span className="text-gray-900">#{request.id}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 shadow-sm">
                  <span className="uppercase tracking-wide text-gray-500">Team</span>
                  <span className="text-gray-900">{teamName}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 shadow-sm">
                  <span className="uppercase tracking-wide text-gray-500">Queue</span>
                  <span className="text-gray-900">{queuePosition}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-inner">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Progress</span>
              <RequestProgress status={request.status} />
            </div>

            <div className="grid gap-4 text-xs font-semibold text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
              <MetaBlock label="Created" value={createdAt} />
              <MetaBlock label="Updated" value={updatedAt} />
              <MetaBlock label="Category" value={request.category} />
              <MetaBlock label="Status" value={request.status} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Section title="Overview">
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{detailedCopy}</p>
            </Section>

            {request.remarks && (
              <Section title="Team Remarks">
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-gray-800 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#f75700]">Latest Remark</p>
                  <p className="mt-2 whitespace-pre-line leading-relaxed">{request.remarks}</p>
                </div>
              </Section>
            )}

            {request.bom_items && request.bom_items.length > 0 && (
              <Section title="BOM Items">
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Item Name</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {request.bom_items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-800">{item.item_name}</td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {request.additional_items && request.additional_items.length > 0 && (
              <Section title="Additional Items">
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Item Name</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {request.additional_items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-800">{item.item_name}</td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {request.fabrication && (
              <Section title="Fabrication Details">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <MetaBlock label="Type" value={request.fabrication.fab_type} />
                  <MetaBlock label="Name" value={request.fabrication.name} />
                </div>
                {request.fabrication.file && (
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attachment</p>
                    <a
                      href={request.fabrication.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#002449]/20 bg-[#002449]/5 px-3 py-2 text-sm font-semibold text-[#002449] transition hover:bg-[#002449]/10"
                    >
                      Download fabrication file
                    </a>
                  </div>
                )}
              </Section>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-[#002449]">Key Details</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Request ID</dt>
                  <dd className="text-sm font-semibold text-gray-900">#{request.id}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Team</dt>
                  <dd className="max-w-[12rem] text-right text-sm font-semibold text-gray-900">{teamName}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Queue Position</dt>
                  <dd className="text-sm font-semibold text-gray-900">{queuePosition}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Created</dt>
                  <dd className="max-w-[12rem] text-right text-sm font-semibold text-gray-900">{createdAt}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Updated</dt>
                  <dd className="max-w-[12rem] text-right text-sm font-semibold text-gray-900">{updatedAt}</dd>
                </div>
              </dl>
            </div>

            {canChangeStatus && nextStatus.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-[#f75700]">Update Status</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Choose the next stage for this request. You can add remarks to guide the team before confirming.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {nextStatus.map((status) => (
                    <button
                      key={status}
                      onClick={() => initiateStatusChange(status)}
                      disabled={changingStatus}
                      className="rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70"
                      style={{ backgroundColor: status === "Cannot be Processed" ? "#f75700" : "#078e31" }}
                    >
                      {changingStatus
                        ? "Updating..."
                        : status === "Cannot be Processed"
                          ? "Reject"
                          : `Mark ${status}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {request && pendingStatus && (
        <StatusChangeModal
          open={!!pendingStatus}
          currentStatus={request.status}
          targetStatus={pendingStatus}
          loading={changingStatus}
          onClose={() => setPendingStatus(null)}
          onConfirm={async (remarks) => {
            await handleStatusChange(pendingStatus, remarks)
          }}
        />
      )}
    </>
  )
}

function categoryColor(cat: string) {
  if (cat === "BOM") return "#002449"
  if (cat === "ADDITIONAL") return "#007367"
  return "#f75700"
}

function accentColor(status: string) {
  if (status === "Submitted") return "#f75700"
  if (status === "Processing") return "#002449"
  if (status === "Issued") return "#078e31"
  return "#6b7280"
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-900 break-words">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-[#002449]">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}
