"use client"
import { usePathname } from "next/navigation"
import { SihBanner } from "@/components/navigation/sih-banner"

export function GlobalHeader() {
  const pathname = usePathname()
  if (pathname !== "/login") return null
  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <SihBanner />
    </div>
  )
}
