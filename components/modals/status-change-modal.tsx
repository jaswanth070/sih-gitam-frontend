"use client"

import { useState } from "react"

interface StatusChangeModalProps {
  open: boolean
  currentStatus: string
  onClose: () => void
  onConfirm: (newStatus: string, note: string) => void
  loading?: boolean
}

export function StatusChangeModal({
  open,
  currentStatus,
  onClose,
  onConfirm,
  loading = false,
}: StatusChangeModalProps) {
  const [note, setNote] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  const getNextStatuses = () => {
    if (currentStatus === "Submitted") {
      return ["Processing", "Cannot be Processed"]
    }
    if (currentStatus === "Processing") {
      return ["Issued", "Cannot be Processed"]
    }
    return []
  }

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus, note)
      setNote("")
      setSelectedStatus("")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-4" style={{ color: "#002449" }}>
          Update Request Status
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Change from: <span className="font-semibold">{currentStatus}</span>
          </label>
          <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ focusColor: "#002449" }}
          >
            <option value="">Select a status</option>
            {getNextStatuses().map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this status change..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStatus || loading}
            className="flex-1 px-4 py-2 text-white font-medium rounded-lg transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#f75700" }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = "1")}
          >
            {loading ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  )
}
