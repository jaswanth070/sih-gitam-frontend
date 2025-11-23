"use client"
import React from "react"

interface RequestProgressProps {
  status: string
}

const steps = ["Submitted", "Processing", "Issued"]

export function RequestProgress({ status }: RequestProgressProps) {
  return (
    <div className="flex items-center gap-2" aria-label="Request status progress">
      {steps.map((step, idx) => {
        const currentIndex = steps.indexOf(status)
        const done = currentIndex >= idx
        const active = currentIndex === idx
        return (
          <React.Fragment key={step}>
            <div
              className={`flex flex-col items-center text-[10px] font-medium ${done ? "text-[#002449]" : "text-gray-400"}`}
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${done ? (active ? "bg-[#f75700]" : "bg-[#002449]") : "bg-gray-300"}`}
              />
              <span className="mt-1 tracking-wide">{step}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-px w-6 ${currentIndex > idx ? "bg-[#002449]" : "bg-gray-300"}`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
