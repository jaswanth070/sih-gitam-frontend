import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-[#002449]">
      <header className="flex flex-col items-center gap-4 px-3 pt-4">
        <div className="inline-flex max-w-full flex-nowrap items-center justify-center gap-3 overflow-hidden rounded-full border border-[#d9e2f2] bg-white px-5 py-3 shadow-[0_10px_24px_rgba(0,36,73,0.08)] sm:gap-6 sm:px-8 sm:py-3">
          <div className="flex shrink-0 items-center justify-center">
            <Image
              src="/main_logo_banner.png"
              alt="Smart India Hackathon Banner"
              width={420}
              height={120}
              className="h-10 w-auto max-w-[220px] object-contain sm:h-14 sm:max-w-[320px] lg:h-18 lg:max-w-none"
              priority
            />
          </div>
          <span className="hidden h-10 w-px bg-[#d9e2f2] sm:block lg:h-14" />
          <div className="flex shrink-0 items-center justify-center">
            <Image
              src="/gitam_logo.png"
              alt="GITAM University Logo"
              width={160}
              height={120}
              className="h-10 w-auto max-w-[110px] object-contain sm:h-14 sm:max-w-[150px] lg:h-18 lg:max-w-none"
              priority
            />
          </div>
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="relative group flex w-full max-w-5xl flex-col items-center justify-center gap-6 lg:flex-row lg:items-center lg:justify-center lg:gap-10">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-60 w-60 rounded-full bg-[radial-gradient(circle_at_center,_rgba(247,87,0,0.35),_rgba(7,142,49,0.15),_transparent_70%)] blur-2xl transition-transform duration-500 ease-out group-hover:scale-110 sm:h-72 sm:w-72" aria-hidden="true" />
            <div className="absolute h-52 w-52 animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle_at_center,_rgba(7,142,49,0.12),_transparent_60%)] blur-xl" aria-hidden="true" />
            <Image src="/SIH.png" alt="Smart India Hackathon Emblem" width={280} height={280} className="relative h-60 w-auto sm:h-72" priority />
          </div>
          <span className="hidden h-56 w-[6px] rounded-full bg-gradient-to-b from-[#f75700] via-white to-[#078e31] lg:block" aria-hidden="true" />
          <span className="h-1 w-32 rounded-full bg-gradient-to-r from-[#f75700] via-white to-[#078e31] lg:hidden" aria-hidden="true" />
          <div className="flex flex-row items-center justify-center gap-6 lg:flex-col lg:items-center lg:gap-6">
            <Image
              src="/ndrf_logo.jpg"
              alt="National Disaster Response Force"
              width={220}
              height={140}
              className="h-22 w-auto object-contain sm:h-24"
            />
            <Image
              src="/ITBP_Logo.svg"
              alt="Indo-Tibetan Border Police"
              width={220}
              height={140}
              className="h-20 w-auto object-contain sm:h-24"
            />
          </div>
        </div>
        <h1 className="whitespace-nowrap text-3xl font-extrabold tracking-tight text-[#002449] sm:text-5xl">
          SIH <span className="text-[#f75700]">2025</span> GRAND FINAL
        </h1>
        <div className="flex items-center justify-center gap-2">
          <span className="h-px w-10 bg-[#f75700]" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7b859c]">HARDWARE EDITION</span>
          <span className="h-px w-10 bg-[#078e31]" />
        </div>
        <div className="flex items-center justify-center gap-4 text-[#002449]">
          <span className="text-3xl font-black leading-none sm:text-4xl">8&nbsp;&ndash;&nbsp;12</span>
          <div className="flex flex-col items-start justify-between gap-[2px] leading-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b859c]">December</span>
            <span className="text-lg font-semibold text-[#f75700] sm:text-xl">2025</span>
          </div>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-[#f75700] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#f75700]/30 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#e64d00]"
        >
          Enter Coordination Portal
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  )
}