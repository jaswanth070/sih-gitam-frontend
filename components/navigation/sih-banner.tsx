"use client"
import Image from "next/image"

export function SihBanner() {
  return (
    <div className="mx-auto flex justify-center mb-14">
      <div className="bg-white rounded-b-3xl shadow-sm px-6 py-3 flex items-center justify-center border border-gray-200">
        <Image
          src="/sih_banner.png"
          alt="Smart India Hackathon 2025 Banner"
          width={650}
          height={90}
          className="h-20 w-auto object-contain"
          priority
        />
      </div>
    </div>
  )
}
