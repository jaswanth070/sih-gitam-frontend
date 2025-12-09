"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  HardHat,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface GuidesSection {
  title: string
  icon: ReactNode
  bullets: string[]
}

const GUIDELINES_SECTIONS: GuidesSection[] = [
  {
    title: "Participation & Team Regulations",
    icon: <ShieldCheck className="h-5 w-5 text-[#007367]" aria-hidden="true" />,
    bullets: [
      "Teams must abide by all AICTE Guidelines throughout the event.",
      "",
      "Teams cannot change team members at the Nodal Center without prior MIC approval and the official approval letter.",
      "Teams must not assist or participate in other teams’ work; focus only on your assigned problem statement.",
      "RF-blocking devices may only be used outdoors to prevent interference with other teams.",
    ],
  },
  {
    title: "Critical Information & Do’s",
    icon: <ClipboardCheck className="h-5 w-5 text-[#f75700]" aria-hidden="true" />,
    bullets: [
      "Carry original College ID, a valid Government ID, and keep them accessible at all times.",
      "Pack warm clothing for winter nights and bring personal essentials such as towels, flip-flops, shaving kit, and a reusable water bottle.",
      "Accommodation is on a sharing basis with separate hostels for boys and girls; hostels may have common washroom blocks.",
      "Essential toiletries are available on campus, but bring anything specific you rely on.",
      "Medical support is available for emergencies—alert the organizers immediately if assistance is required.",
      "Always lock your room when leaving and keep valuables secure; organizers are not responsible for theft—carry an additional lock.",
      "Meals will follow standard Indian cuisine (veg/non-veg). Maintain cleanliness and use trash bins for waste.",
      "Stick to the hackathon agenda, follow organizer instructions, and report grievances promptly.",
      "No participant or mentor may leave the premises once the hackathon begins. Travel reimbursement follows AICTE norms for sleeper-class train fare or equivalent only.",
    ],
  },
  {
    title: "Conduct & Campus Rules",
    icon: <ShieldAlert className="h-5 w-5 text-[#002449]" aria-hidden="true" />,
    bullets: [
      "Alcohol consumption, smoking, and the use of drugs without prescription are strictly prohibited.",
      "Participants and mentors must remain on campus for the duration of the event; regular attendance will be recorded.",
      "Any violation of campus conduct guidelines can lead to disqualification or disciplinary action.",
    ],
  },
  {
    title: "Safety & Fabrication Area Rules",
    icon: <HardHat className="h-5 w-5 text-[#078e31]" aria-hidden="true" />,
    bullets: [
      "Wear appropriate clothing when working with hardware tools or equipment, and stay indoors at night for safety.",
      "Safety shoes are mandatory while using fabrication tools, power tools, or any equipment.",
      "Follow all fabrication area safety protocols shared by the organizers.",
    ],
  },
]

const DONT_ITEMS: string[] = [
  "Do not leave the campus without explicit permission from organizers.",
  "Ensure no damage is done to any property anywhere on campus.",
  "Inter-hostel movement between boys’ and girls’ hostels is strictly prohibited.",
  "Any uncivilized behaviour may result in disqualification or legal action.",
  "Alcohol, smoking, and drugs are strictly prohibited at all times.",
  "Do not invite local friends into hostel rooms or event accommodations.",
]

export interface DosDontsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requireAcknowledgement?: boolean
  onAcknowledge?: () => void
}

export function DosDontsModal({
  open,
  onOpenChange,
  requireAcknowledgement = false,
  onAcknowledge,
}: DosDontsModalProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false)

  useEffect(() => {
    if (!open) {
      setHasScrolledToEnd(false)
      return
    }

    const container = scrollRef.current
    if (container) {
      container.scrollTop = 0
    }
  }, [open])

  const handleScroll = () => {
    const container = scrollRef.current
    if (!container) return
    const threshold = 16
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - threshold) {
      setHasScrolledToEnd(true)
    }
  }

  const closeModal = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setHasScrolledToEnd(false)
    }
  }

  const handleAcknowledge = () => {
    if (!requireAcknowledgement) return
    onAcknowledge?.()
    closeModal(false)
  }

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent
        className="max-h-[85vh] max-w-3xl overflow-hidden border-[#002449]/15 bg-white"
        showCloseButton={!requireAcknowledgement}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-[#002449]">
            <ScrollText className="h-6 w-6 text-[#f75700]" aria-hidden="true" />
            Do&apos;s &amp; Don&apos;ts Guidelines
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Please review the complete list to ensure a safe, disciplined, and smooth hackathon experience.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="mt-2 space-y-6 overflow-y-auto pr-2 text-sm text-gray-700"
          style={{ maxHeight: "55vh" }}
        >
          {GUIDELINES_SECTIONS.map((section) => (
            <section key={section.title} className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <header className="mb-3 flex items-center gap-2">
                {section.icon}
                <h3 className="text-base font-semibold text-[#002449]">{section.title}</h3>
              </header>
              <ul className="space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#007367]" aria-hidden="true" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <header className="mb-3 flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-red-700">Strict Don&apos;ts</h3>
            </header>
            <ul className="space-y-2">
              {DONT_ITEMS.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <DialogFooter className="mt-4">
          {requireAcknowledgement ? (
            <>
              <Button
                variant="outline"
                onClick={() => closeModal(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Close
              </Button>
              <Button
                onClick={handleAcknowledge}
                disabled={!hasScrolledToEnd}
                className="bg-[#005a52] text-white hover:bg-[#003f3a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                I Agree
              </Button>
            </>
          ) : (
            <DialogClose asChild>
              <Button className="bg-[#002449] text-white hover:bg-[#001b32]">Close</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
