"use client"

interface RequestCategoryBadgeProps {
  category: "BOM" | "ADDITIONAL" | "FABRICATION"
  className?: string
}

export function RequestCategoryBadge({ category, className = "" }: RequestCategoryBadgeProps) {
  const getCategoryStyles = () => {
    switch (category) {
      case "BOM":
        return { backgroundColor: "#002449", label: "Bill of Materials" }
      case "ADDITIONAL":
        return { backgroundColor: "#007367", label: "Additional Items" }
      case "FABRICATION":
        return { backgroundColor: "#f75700", label: "Fabrication" }
    }
  }

  const styles = getCategoryStyles()

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full ${className}`}
      style={{ backgroundColor: styles.backgroundColor }}
      title={category}
    >
      {styles.label}
    </span>
  )
}
