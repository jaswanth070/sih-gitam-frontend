"use client"
import Image from "next/image"

export function DashboardNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto flex w-full flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
        {/* Left: Banner + separator + GITAM logo */}
        <div className="flex w-full min-w-0 items-center justify-center gap-3 overflow-hidden sm:w-auto sm:justify-start">
          <Image
            src="/sih_banner.png"
            alt="Smart India Hackathon 2025 Banner"
            width={320}
            height={70}
            className="h-10 w-auto max-w-[220px] object-contain sm:h-14 sm:max-w-none lg:h-16"
            priority
            sizes="(max-width: 640px) 55vw, 320px"
          />
          <span className="h-10 w-px bg-gray-300" aria-hidden="true" />
          <Image
            src="/gitam_logo.png"
            alt="GITAM Logo"
            width={180}
            height={70}
            className="h-9 w-auto max-w-[30vw] object-contain sm:h-14 sm:max-w-none lg:h-16"
            priority
            sizes="(max-width: 640px) 30vw, 180px"
          />
        </div>
        {/* Right: Title cluster */}
        <div className="flex flex-col items-center text-center sm:items-center sm:text-right">
          <h1 className="text-base font-extrabold leading-5 tracking-tight text-[#002449] sm:text-lg">
            SIH <span className="text-[#f75700]">2025</span> GRAND FINAL
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-px w-5 sm:w-6 bg-[#f75700]" />
            <span className="text-[12px] sm:text-[14px] font-medium text-gray-500 uppercase tracking-wider">HARDWARE EDITION</span>
            <span className="h-px w-5 sm:w-6 bg-[#078e31]" />
          </div>
        </div>
      </div>
    </nav>
  )
}
