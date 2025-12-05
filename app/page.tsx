import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { InfrastructureScrollStack } from "@/components/infrastructure/infrastructure-scroll-stack"

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-[#002449]">
      <section className="relative flex min-h-[100dvh] flex-col items-center gap-8 px-6 py-8 text-center">
        <div className="flex w-full justify-center">
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
        </div>

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-5">
          <div className="relative group flex w-full max-w-5xl flex-col items-center justify-center gap-5 lg:flex-row lg:items-center lg:justify-center lg:gap-10">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,_rgba(247,87,0,0.35),_rgba(7,142,49,0.15),_transparent_70%)] blur-2xl transition-transform duration-500 ease-out group-hover:scale-110 sm:h-60 sm:w-60 lg:h-72 lg:w-72" aria-hidden="true" />
              <div className="absolute h-40 w-40 animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle_at_center,_rgba(7,142,49,0.12),_transparent_60%)] blur-xl sm:h-52 sm:w-52" aria-hidden="true" />
              <Image src="/SIH.png" alt="Smart India Hackathon Emblem" width={280} height={280} className="relative h-44 w-auto sm:h-56 lg:h-72" priority />
            </div>
            <span className="hidden h-56 w-[6px] rounded-full bg-gradient-to-b from-[#f75700] via-white to-[#078e31] lg:block" aria-hidden="true" />
            <span className="h-1 w-32 rounded-full bg-gradient-to-r from-[#f75700] via-white to-[#078e31] lg:hidden" aria-hidden="true" />
            <div className="flex flex-row items-center justify-center gap-4 lg:flex-col lg:items-center lg:gap-6">
              <Image
                src="/ndrf_logo.jpg"
                alt="National Disaster Response Force"
                width={220}
                height={140}
                className="h-16 w-auto object-contain sm:h-20 lg:h-24"
              />
              <Image
                src="/ITBP_Logo.svg"
                alt="Indo-Tibetan Border Police"
                width={220}
                height={140}
                className="h-16 w-auto object-contain sm:h-20 lg:h-24"
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
        </div>
      </section>

      <section className="w-full bg-white px-6 pb-12">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
          <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full justify-center sm:w-1/2 sm:justify-start">
              <Image
                src="/Enroute_GITAM.png"
                alt="Enroute GITAM overview"
                width={520}
                height={360}
                className="w-full max-w-[360px] object-cover transition-transform duration-300 ease-out hover:scale-105"
                priority
              />
            </div>

            <div className="flex w-full flex-col items-center gap-3 text-center sm:w-1/2 sm:items-start sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#7b859c]">Plan Arrival</p>
              <h2 className="text-3xl font-bold text-[#002449]">Enroute GITAM Guide</h2>
              <p className="max-w-md text-sm text-[#3f4a63]">
                Pinpoint pickup zones, campus gates, and final-mile support tailored for finalist teams.
              </p>
              <div className="flex w-full justify-center sm:justify-start">
                <Link
                  href="/enroute-gitam"
                  className="inline-flex items-center gap-2 rounded-full bg-[#002449] px-6 py-3 text-sm font-semibold text-white shadow transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#001a33]"
                >
                  Open Enroute Guide
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <InfrastructureScrollStack /> */}

      <footer className="w-full bg-white px-6 pt-10 pb-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4">
          <svg
            viewBox="0 0 100 12"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-full text-[#d7deec]"
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            <path d="M0 10 Q50 0 100 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <Image
            src="/gitam_logo_hoz.png"
            alt="GITAM University"
            width={360}
            height={120}
            className="h-auto w-[200px] sm:w-[240px] md:w-[280px] object-contain"
            priority
          />
        </div>
      </footer>
    </main>
  )
}