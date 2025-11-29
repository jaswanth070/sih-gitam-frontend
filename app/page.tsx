import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-[#002449]">
      <header className="flex flex-col items-center gap-6 px-4 pt-10">
        <div className="flex w-full max-w-[560px] items-center justify-between gap-1 overflow-hidden rounded-full border border-[#d9e2f2] bg-white px-8 py-4 shadow-[0_12px_30px_rgba(0,36,73,0.08)] sm:max-w-[680px] sm:gap-6 sm:px-10 sm:py-2 lg:max-w-[820px]">
          <div className="flex shrink-0 items-center">
            <Image
              src="/sih_banner.png"
              alt="Smart India Hackathon Banner"
              width={420}
              height={100}
              className="h-10 w-auto max-w-[210px] object-contain sm:h-16 sm:max-w-[320px] lg:h-20 lg:max-w-none"
              priority
            />
          </div>
          <span className="h-10 w-px bg-[#d9e2f2] sm:h-14" />
          <div className="flex shrink-0 items-center">
            <Image
              src="/gitam_logo.png"
              alt="GITAM University Logo"
              width={140}
              height={90}
              className="h-10 w-auto max-w-[96px] object-contain sm:h-16 sm:max-w-[140px] lg:h-20 lg:max-w-none"
              priority
            />
          </div>
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="relative group flex items-center justify-center">
          <div className="absolute h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,_rgba(247,87,0,0.35),_rgba(7,142,49,0.15),_transparent_70%)] blur-2xl transition-transform duration-500 ease-out group-hover:scale-110 sm:h-56 sm:w-56" aria-hidden="true" />
          <div className="absolute h-40 w-40 animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle_at_center,_rgba(7,142,49,0.12),_transparent_60%)] blur-xl" aria-hidden="true" />
          <Image src="/SIH.png" alt="Smart India Hackathon Emblem" width={200} height={200} className="relative h-48 w-auto" priority />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#002449] sm:text-5xl">
          SIH <span className="text-[#f75700]">2025</span> Grand Final
        </h1>
        <div className="flex items-center justify-center gap-2">
          <span className="h-px w-10 bg-[#f75700]" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7b859c]">GITAM</span>
          <span className="h-px w-10 bg-[#078e31]" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-[#002449]">
          <div className="rounded-2xl border border-[#d9e2f2] bg-white px-6 py-4 shadow-[0_10px_24px_rgba(0,36,73,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7b859c]">Schedule</p>
            <p className="mt-2 text-xl font-semibold">
              8&nbsp;&ndash;&nbsp;12 <span className="text-[#f75700]">December 2025</span>
            </p>
          </div>
          <div className="rounded-2xl border border-[#d9e2f2] bg-white px-6 py-4 shadow-[0_10px_24px_rgba(0,36,73,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7b859c]">Venue</p>
            <p className="mt-2 text-xl font-semibold">GITAM Visakhapatnam</p>
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
