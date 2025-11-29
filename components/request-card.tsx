"use client"

import Link from "next/link"
import type { RequestData } from "@/lib/requests-service"
import { formatRequestTitle, cn } from "@/lib/utils"

interface RequestCardProps {
  request: RequestData
  isClickable?: boolean
}

export function RequestCard({ request, isClickable = true }: RequestCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "BOM":
        return "#002449"
      case "ADDITIONAL":
        return "#007367"
      case "FABRICATION":
        return "#f75700"
      default:
        return "#078e31"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "#f75700"
      case "Processing":
        return "#002449"
      case "Issued":
        return "#078e31"
      case "Cannot be Processed":
        return "#999"
      default:
        return "#666"
    }
  }

  const content = (
    <div className={cn("bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all h-full flex flex-col gap-3 flash-update")}>      
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center px-3 py-1 text-xs font-semibold text-white rounded-full shadow-sm"
          style={{ backgroundColor: getCategoryColor(request.category) }}
        >{request.category}</span>
        <span
          className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
          style={{ backgroundColor: getStatusColor(request.status), color: '#fff' }}
        >{request.status}</span>
        {request.position && <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-gray-100 border border-gray-200 text-gray-600">#{request.position}</span>}
      </div>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-base text-gray-900 leading-snug line-clamp-2 flex-1">{formatRequestTitle(request)}</h3>
        {request.team_name && (
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-[#002449] text-white shadow-sm">{request.team_name}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
        {request.fabrication && (
          <div className="truncate"><strong>{request.fabrication.fab_type}</strong> • {request.fabrication.name}</div>
        )}
        {request.bom_items && request.bom_items.length > 0 && (
          <div>{request.bom_items.length} BOM items</div>
        )}
        {request.additional_items && request.additional_items.length > 0 && (
          <div>{request.additional_items.length} additional items</div>
        )}
        <div>{new Date(request.created_at).toLocaleDateString()}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 font-medium text-[11px]">ID {request.id}</span>
        <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 font-medium text-[11px]">Created {new Date(request.created_at).toLocaleDateString()}</span>
        <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 font-medium text-[11px]">Updated {new Date(request.updated_at).toLocaleDateString()}</span>
      </div>
      {request.remarks && (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#002449]">Remarks</p>
          <p className="whitespace-pre-line text-xs text-gray-700">{request.remarks}</p>
        </div>
      )}
    </div>
  )

  return isClickable ? <Link href={`/requests/${request.id}`}>{content}</Link> : content
}
