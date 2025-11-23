"use client"
import React from "react"

interface RequestFiltersProps {
  currentStatus: string | null
  onStatusChange: (s: string | null) => void
  search: string
  onSearch: (q: string) => void
  category: string | null
  onCategoryChange: (c: string | null) => void
}

const statusOptions = ["Submitted", "Processing", "Issued", "Cannot be Processed"]
const categoryOptions = ["BOM", "ADDITIONAL", "FABRICATION"]

export function RequestFilters({
  currentStatus,
  onStatusChange,
  search,
  onSearch,
  category,
  onCategoryChange,
}: RequestFiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onStatusChange(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            currentStatus === null ? "bg-[#002449] text-white border-[#002449]" : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        {statusOptions.map((st) => (
          <button
            key={st}
            onClick={() => onStatusChange(st)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              currentStatus === st ? "bg-[#f75700] text-white border-[#f75700]" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {st}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search notes..."
            className="pl-3 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002449] w-48"
          />
        </div>
        <select
          value={category || ""}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002449]"
        >
          <option value="">All Categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
