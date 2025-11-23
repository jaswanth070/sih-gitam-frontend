"use client"
import Image from "next/image"

export function DashboardNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm h-20 flex items-center">
      <div className="px-4 w-full flex items-center justify-between">
        {/* Left: Banner + separator + GITAM logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/sih_banner.png"
            alt="Smart India Hackathon 2025 Banner"
            width={320}
            height={70}
            className="h-14 w-auto object-contain"
            priority
          />
          <span className="h-10 w-px bg-gray-300" />
          <Image
            src="/gitam_logo.png"
            alt="GITAM Logo"
            width={130}
            height={70}
            className="h-14 w-auto object-contain"
            priority
          />
        </div>
        {/* Right: Title cluster */}
        <div className="flex flex-col text-right">
          <h1 className="text-lg font-extrabold tracking-tight text-[#002449] leading-5">
            SIH <span className="text-[#f75700]">2025</span> Grand Final
          </h1>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="h-px w-6 bg-[#f75700]" />
            <span className="text-[14px] font-medium text-gray-500 uppercase tracking-wider">GITAM</span>
            <span className="h-px w-6 bg-[#078e31]" />
          </div>
        </div>
      </div>
    </nav>
  )
}
