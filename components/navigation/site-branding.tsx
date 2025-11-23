"use client"
import Image from "next/image"

export function SiteBranding() {
  return (
    <div className="flex w-full items-center justify-between gap-6 select-none">
      <div className="flex items-center">
        <Image
          src="/sih_banner.png"
          alt="Smart India Hackathon"
          width={220}
          height={56}
          className="h-12 md:h-14 w-auto object-contain transition-all"
          priority
        />
      </div>
      <div className="flex items-center">
        <Image
          src="/gitam_logo.png"
          alt="GITAM Logo"
          width={160}
          height={56}
          className="h-12 md:h-14 w-auto object-contain transition-all"
          priority
        />
      </div>
    </div>
  )
}
