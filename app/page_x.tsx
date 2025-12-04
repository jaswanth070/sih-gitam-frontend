import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-[#002449]">
      <header className="flex justify-center px-4">
        <div className="w-full max-w-2xl">
          <Image
            src="/main_logo_banner.png"
            alt="Smart India Hackathon Banner"
            width={1600}
            height={280}
            className="block h-auto w-full object-contain"
            priority
          />
        </div>
      </header>
      <section className="flex flex-1 flex-col justify-center px-6 pb-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-8 lg:items-start">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(247,87,0,0.35),_rgba(7,142,49,0.15),_transparent_70%)] blur-2xl transition-transform duration-500 ease-out group-hover:scale-110 sm:h-90 sm:w-90" aria-hidden="true" />
                <div className="absolute h-56 w-56 animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle_at_center,_rgba(7,142,49,0.12),_transparent_60%)] blur-xl" aria-hidden="true" />
                <Image src="/SIH.png" alt="Smart India Hackathon Emblem" width={400} height={400} className="relative h-64 w-auto sm:h-80" priority />
              </div>
              <div className="h-1 w-32 rounded-full bg-gradient-to-r from-[#f75700] via-white to-[#078e31] sm:hidden" aria-hidden="true" />
              <div className="hidden h-64 w-[6px] rounded-full bg-gradient-to-b from-[#f75700] via-white to-[#078e31] sm:block" aria-hidden="true" />
              <div className="flex flex-col items-center gap-6">
                <Image
                  src="/ndrf_logo.jpg"
                  alt="National Disaster Response Force"
                  width={260}
                  height={140}
                  className="h-34 w-auto object-contain sm:h-42"
                />
                <Image
                  src="/ITBP_Logo.svg"
                  alt="Indo-Tibetan Border Police"
                  width={260}
                  height={140}
                  className="h-32 w-auto object-contain sm:h-40"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 lg:ml-16 lg:items-start lg:text-left">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#002449] sm:text-5xl">
                SIH <span className="text-[#f75700]">2025</span> Grand Final
              </h1>
              <div className="mt-3 flex items-center justify-center gap-2 lg:justify-center">
                <span className="h-px w-10 bg-[#f75700]" />
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7b859c]">HARDWARE EDITION</span>
                <span className="h-px w-10 bg-[#078e31]" />
              </div>
            </div>

            {/* <div className="flex flex-wrap items-end justify-center gap-3 text-center text-[#002449]">
              <span className="text-2xl font-bold leading-none sm:text-3xl">8&nbsp;&ndash;&nbsp;12</span>
              <div className="flex flex-col items-start gap-0 text-left leading-none">
                <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#7b859c] leading-none">December</span>
                <span className="text-lg font-semibold text-[#f75700] leading-none sm:text-xl">2025</span>
              </div>
            </div> */}

            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#f75700] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#f75700]/30 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#e64d00]"
            >
              Enter Coordination Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
