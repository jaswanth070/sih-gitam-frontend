"use client"

interface RequestStatusBadgeProps {
  status: "Submitted" | "Processing" | "Issued" | "Cannot be Processed"
  className?: string
}

export function RequestStatusBadge({ status, className = "" }: RequestStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "Submitted":
        return { backgroundColor: "#f75700", label: "Pending Review" }
      case "Processing":
        return { backgroundColor: "#002449", label: "In Progress" }
      case "Issued":
        return { backgroundColor: "#078e31", label: "Completed" }
      case "Cannot be Processed":
        return { backgroundColor: "#999", label: "Rejected" }
    }
  }

  const styles = getStatusStyles()

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full ${className}`}
      style={{ backgroundColor: styles.backgroundColor }}
      title={status}
    >
      {styles.label}
    </span>
  )
}
