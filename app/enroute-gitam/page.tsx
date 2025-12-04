"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"
import {
  ArrowRight,
  BusFront,
  Clock,
  DollarSign,
  Gauge,
  Home,
  MapPin,
  Plane,
  TrainFront,
} from "lucide-react"

type LucideIcon = typeof TrainFront

type ModeId = "train" | "plane" | "bus"

type ModeConfig = {
  id: ModeId
  label: string
  icon: LucideIcon
  caption: string
  summary: string
  description: string
  tags: string[]
  gradient: string
  badge: string
  localTransport: Array<{
    title: string
    highlight: string
    detail: string
    icon: LucideIcon
  }>
  tip: string
}

const MODES: ModeConfig[] = [
  {
    id: "train",
    label: "Train",
    icon: TrainFront,
    caption: "Visakhapatnam Railway Station",
    summary: "~16 km • 25 mins via Beach Road",
    description:
      "Classic arrival? Step out of the station and glide to campus with a sea-breeze drive or a single-hop bus ride.",
    tags: ["Cab 25 mins", "900K Direct", "Beach Road views"],
    gradient: "from-[#fef3ea] via-white to-[#e3f2fd]",
    badge: "Rail ready",
    localTransport: [
      {
        title: "Cab / Auto",
        highlight: "₹300 – ₹500",
        detail: "Book Ola/Uber outside the concourse or take the prepaid counter. Ask for the Beach Road route for coastline snaps.",
        icon: DollarSign,
      },
      {
        title: "900K Direct Bus",
        highlight: "~40 mins",
        detail: "Board APSRTC 900K from the station stand. It drops you right at the GITAM Front Gate without transfers.",
        icon: BusFront,
      },
      {
        title: "Transit Hop",
        highlight: "400 • 500 • 900",
        detail: "Catch any of these to Maddilapalem and switch to a Rushikonda-bound service. Conductors happily call out the campus stop.",
        icon: MapPin,
      },
    ],
    tip: "Try to get 900K Bus !!",
  },
  {
    id: "plane",
    label: "Plane",
    icon: Plane,
    caption: "Visakhapatnam International Airport",
    summary: "~24 km • 45–55 mins door to door",
    description:
      "Fly in and roll out through a breezy coastal highway. Airport exits are streamlined for app cabs and group rides.",
    tags: ["App cabs 24×7", "Coastal highway", "Share the ride"],
    gradient: "from-[#f1fff4] via-white to-[#eef3ff]",
    badge: "Air arrival",
    localTransport: [
      {
        title: "App Cab Lane",
        highlight: "₹500 – ₹700",
        detail: "Left lane outside arrivals queues Ola/Uber and BluSmart. Drivers know the main gate; share the trip link for easy entry.",
        icon: DollarSign,
      },
      {
        title: "Group Shuttle",
        highlight: "Split the fare",
        detail: "Travelling as a team? Request an SUV, split the ride, and enjoy the 30 kmph coastal stretch playlist ready.",
        icon: Gauge,
      },
      {
        title: "Local Taxi Desk",
        highlight: "Fixed tariffs",
        detail: "Inside the terminal hall, the prepaid counter issues slips. Pay upfront and bypass negotiations, ideal for late-night landings.",
        icon: Clock,
      },
    ],
    tip: "Peak hours (5–8 PM) can slow NH-16. Buffer an extra 15 minutes if you have a campus reporting slot.",
  },
  {
    id: "bus",
    label: "Bus",
    icon: BusFront,
    caption: "City Bus Hubs & Rushikonda Loop",
    summary: "Budget friendly • Runs every 6–12 mins",
    description:
      "Already in the city? APSRTC buses crest the Rushikonda hill with postcard views and pocket-friendly fares.",
    tags: ["₹15 – ₹35", "Frequent daytime", "Hilltop panorama"],
    gradient: "from-[#eef2ff] via-white to-[#fef3ea]",
    badge: "City ride",
    localTransport: [
      {
        title: "Maddilapalem Junction",
        highlight: "222 • 333 • 666",
        detail: "This hub fires buses almost every 8 minutes. Stay near Platform 2 and watch for Rushikonda signboards.",
        icon: MapPin,
      },
      {
        title: "RTC Complex",
        highlight: "500 • 600 • 700",
        detail: "Sheltered bays with digital boards. Ask staff for the GITAM bay if you are new; last buses leave ~9:20 PM.",
        icon: Clock,
      },
      {
        title: "Dwaraka Bus Station",
        highlight: "300 • 400",
        detail: "Ideal for backpackers. Hop on the beach-corridor routes and ring the bell once the campus arch appears.",
        icon: BusFront,
      },
    ],
    tip: "Keep small change handy. A few upgraded coaches accept UPI, but coins still win when rides get crowded.",
  },
]

export default function EnrouteGitamPage() {
  const [activeMode, setActiveMode] = useState<ModeId | null>(null)
  const activeConfig = activeMode ? MODES.find((mode) => mode.id === activeMode) ?? null : null

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#002449]">
      <AccentAura activeMode={activeMode} />
      <main className="relative mx-auto w-full max-w-6xl px-5 pb-12 pt-6 sm:px-8 lg:px-10">
        <nav className="mb-8 flex items-center justify-between rounded-full border border-[#002449]/10 bg-white/85 px-4 py-3 shadow-sm shadow-[#002449]/5 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="relative h-9 w-9">
              <Image src="/SIH.png" alt="SIH Logo" fill className="rounded-full object-cover" sizes="36px" />
            </span>
            <span className="relative h-9 w-9">
              <Image src="/gitam_logo.png" alt="GITAM Logo" fill className="object-contain" sizes="36px" />
            </span>
          </div>
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0b1f3a]/15 bg-[#0b1f3a] text-white transition hover:-translate-y-0.5 hover:bg-[#133055]"
            aria-label="Back to home"
          >
            <Home className="h-5 w-5" aria-hidden="true" />
          </Link>
        </nav>
        <header className="mb-10 flex flex-col items-center gap-6 text-center sm:mb-14">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            <h1 className="text-3xl font-black leading-none text-[#0b1f3a] sm:text-[42px]">Enroute</h1>
            <span className="relative h-16 w-40 sm:h-20 sm:w-52">
              <Image src="/gitam_logo_hoz.png" alt="GITAM" fill className="object-contain" priority />
            </span>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Pick how you are arriving in Visakhapatnam and instantly see the smartest campus connections.
          </p>
        </header>

        <section aria-labelledby="travel-mode" className="space-y-6 sm:space-y-8">
          <h2 id="travel-mode" className="sr-only">
            Travel mode selection
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {MODES.map((mode) => {
              const isActive = activeMode === mode.id
              return (
                <div key={mode.id} className="space-y-4 sm:space-y-0">
                  <ModeCard
                    mode={mode}
                    isActive={isActive}
                    onSelect={() => setActiveMode((current) => (current === mode.id ? null : mode.id))}
                  />
                  {isActive && (
                    <div className="sm:hidden">
                      <MobileModeDetail mode={mode} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {activeConfig ? (
            <div className="hidden min-h-[200px]  rounded-3xl border border-[#002449]/10 bg-white/95 p-7 shadow-lg shadow-[#002449]/6 sm:block sm:p-8">
              <ModeDetail mode={activeConfig} />
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-3xl border border-[#002449]/12 bg-gradient-to-r from-[#fdf1e6] via-[#ffe0c7] to-[#ffb980] p-6 text-center shadow-md sm:mt-10 sm:p-7">
          <h3 className="text-xl font-semibold text-[#0b1f3a] sm:text-2xl">Ready to roll to Rushikonda?</h3>
          <p className="mt-2 text-sm text-[#3b4858] sm:text-sm">
            Save the campus pin now and get turn-by-turn directions when you land in Vizag.
          </p>
          <Link
            href="https://maps.app.goo.gl/VqhLhPVRx1wEwXNs6"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f75700] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#ff8a3d]"
          >
            Launch Google Maps
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </main>

      <style jsx>{`
        @keyframes floaty {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
          100% {
            transform: translateY(0);
          }
        }
        @keyframes pulseRing {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          70% {
            transform: scale(1.4);
            opacity: 0;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        .animated-logo {
          animation: floaty 2.4s ease-in-out infinite;
        }
        .animated-logo::after {
          content: "";
          position: absolute;
          inset: -8px;
          border-radius: 9999px;
          border: 1px solid rgba(247, 87, 0, 0.25);
          animation: pulseRing 2.8s ease-out infinite;
        }
      `}</style>
    </div>
  )
}

function ModeCard({ mode, isActive, onSelect }: { mode: ModeConfig; isActive: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "relative h-full overflow-hidden rounded-3xl border border-[#002449]/12 bg-white/80 p-6 text-left transition-all duration-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f75700]",
        isActive ? "shadow-2xl shadow-[#002449]/15 ring-1 ring-[#f75700]/40" : "hover:-translate-y-1 hover:shadow-xl"
      )}
    >
      <div
        className={clsx(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500",
          isActive && "opacity-100",
          `bg-gradient-to-br ${mode.gradient}`
        )}
      />
      <div className="relative flex min-h-[100px] flex-col gap-5">
        <div className="flex items-start gap-4">
          <span
            className={clsx(
              "relative flex h-14 w-14 items-center justify-center rounded-2xl border-2",
              isActive
                ? "border-[#f75700]/50 bg-white/80 text-[#f75700]"
                : "border-transparent bg-[#002449]/6 text-[#002449]"
            )}
          >
            <mode.icon className={clsx("h-8 w-8", isActive && "animated-logo")}
              aria-hidden="true"
            />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f75700]">{mode.badge}</p>
            <h3 className="mt-1 text-lg font-semibold text-[#0b1f3a] sm:text-xl">{mode.caption}</h3>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">{mode.summary}</p>
          </div>
          <ArrowRight
            className={clsx(
              "mt-1 h-5 w-5 text-slate-400 transition-all",
              isActive && "rotate-90 text-[#f75700]"
            )}
            aria-hidden="true"
          />
        </div>
      </div>
    </button>
  )
}

function ModeDetail({ mode, isInline = false }: { mode: ModeConfig; isInline?: boolean }) {
  return (
    <div className={clsx("relative space-y-8", isInline && "space-y-6") }>
      <div
        className={clsx(
          "flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between",
          isInline && "sm:flex-col sm:items-start sm:gap-4"
        )}
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#002449]/12 bg-[#002449]/6 text-[#002449]">
            <mode.icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-xl font-semibold sm:text-2xl" style={{ color: "#002449" }}>
              Local transport from {mode.caption}
            </h3>
            <p className="text-xs text-slate-600 sm:text-sm">{mode.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#002449]/15 bg-[#002449]/6 px-3 py-1 text-[11px] font-semibold text-[#002449]/80"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className={clsx("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", isInline && "grid-cols-1 gap-4") }>
        {mode.localTransport.map((option) => (
          <article
            key={option.title}
            className="flex h-full flex-col gap-4 rounded-2xl border border-[#002449]/12 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f75700]/10 text-[#f75700]">
                <option.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#002449]">{option.title}</p>
                <p className="text-xs font-semibold text-[#f75700]">{option.highlight}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">{option.detail}</p>
          </article>
        ))}
      </div>

      <div className={clsx(
        "rounded-2xl border border-dashed border-[#002449]/20 bg-white/80 px-5 py-4 text-sm text-[#002449]/80",
        isInline && "px-4 py-3"
      )}>
        <span className="font-semibold text-[#f75700]">Pro tip:</span> {mode.tip}
      </div>
    </div>
  )
}

function MobileModeDetail({ mode }: { mode: ModeConfig }) {
  return (
    <div className="rounded-3xl border border-[#002449]/15 bg-white/95 p-5 shadow-md">
      <ModeDetail mode={mode} isInline />
    </div>
  )
}

function AccentAura({ activeMode }: { activeMode: ModeId | null }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute left-1/2 top-14 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#f75700]/16 via-transparent to-transparent blur-3xl transition-all"
        style={{ opacity: activeMode ? 1 : 0.5, transform: `translate(-50%, ${activeMode ? "0" : "-30px"})` }}
      />
      <div className="absolute -left-24 bottom-24 h-60 w-60 rounded-full bg-gradient-to-tr from-[#002449]/12 via-transparent to-transparent blur-3xl" />
      <div className="absolute -right-14 top-36 h-52 w-52 rounded-full bg-gradient-to-br from-[#ffb48a]/16 via-transparent to-transparent blur-3xl" />
    </div>
  )
}
