"use client"

import { useMemo, useState, useEffect } from "react"

interface StatusChangeModalProps {
  open: boolean
  currentStatus: string
  targetStatus: string
  onClose: () => void
  onConfirm: (remarks?: string) => void
  loading?: boolean
}

const SHOULD_REQUIRE_REMARKS = (currentStatus: string, targetStatus: string) => {
  if (targetStatus === "Cannot be Processed") return true
  return currentStatus === "Processing" && targetStatus === "Issued"
}

export function StatusChangeModal({
  open,
  currentStatus,
  targetStatus,
  onClose,
  onConfirm,
  loading = false,
}: StatusChangeModalProps) {
  const [remarks, setRemarks] = useState("")

  useEffect(() => {
    if (open) {
      setRemarks("")
    }
  }, [open, currentStatus, targetStatus])

  const requiresRemarks = useMemo(
    () => SHOULD_REQUIRE_REMARKS(currentStatus, targetStatus),
    [currentStatus, targetStatus],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl animate-in fade-in slide-in-from-bottom">
        <h2 className="mb-4 text-lg font-semibold" style={{ color: "#002449" }}>
          Confirm Status Update
        </h2>

        <div className="mb-4 space-y-2 text-sm">
          <p className="text-gray-600">
            You are changing the request from <span className="font-semibold">{currentStatus}</span> to {" "}
            <span className="font-semibold">{targetStatus}</span>.
          </p>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            {requiresRemarks ? "A remark for the team is required before you continue." : "Review the update and confirm when ready."}
          </p>
        </div>

        {requiresRemarks && (
          <div className="mb-5 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Remarks for Team (required)</label>
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Share any guidance or context for the team."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f75700]/40"
              rows={3}
            />
            <p className="text-[11px] text-gray-500">
              These remarks are visible to the team on their dashboard and request view.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(remarks.trim() || undefined)}
            disabled={loading}
            className="flex-1 rounded-lg bg-[#f75700] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#f75700]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  )
}
