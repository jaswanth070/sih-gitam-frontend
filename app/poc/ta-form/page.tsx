"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Printer, Eye, EyeOff } from "lucide-react"
import { getCachedPOCTeams } from "@/lib/dashboard-cache"
import { authService, type POCTeam, type TeamDetails } from "@/lib/auth-service"

const TA_PDF_SRC = "/TA-Students.pdf"

const POSITION_OPTIONS = ["Leader", "Member", "Mentor"] as const

const MEMBER_SLOTS: Array<{ slot: string; label: string; defaultPosition: (typeof POSITION_OPTIONS)[number] }> = [
  { slot: "1", label: "Entry 1", defaultPosition: "Leader" },
  { slot: "2", label: "Entry 2", defaultPosition: "Member" },
  { slot: "3", label: "Entry 3", defaultPosition: "Member" },
  { slot: "4", label: "Entry 4", defaultPosition: "Member" },
  { slot: "5", label: "Entry 5", defaultPosition: "Member" },
  { slot: "m1", label: "Mentor 1", defaultPosition: "Mentor" },
  { slot: "m2", label: "Mentor 2", defaultPosition: "Mentor" },
]

type BeneficiaryFormState = {
  teamLeaderName: string
  instituteName: string
  aadharNumber: string
  panNumber: string
  beneficiaryAddress1: string
  beneficiaryAddress2: string
  beneficiaryPin: string
  beneficiaryPhone: string
  beneficiaryEmail: string
  bankName: string
  branchName: string
  bankAddress1: string
  bankAddress2: string
  bankAddressPin: string
  bankPhone: string
  accountNumber: string
  ifsc: string
  accountInName: "Yes" | "No" | ""
  jointAccount: "Yes" | "No" | ""
  accountOperational: "Yes" | "No" | ""
}

type TAInfoState = {
  teamLeaderName: string
  teamName: string
  teamId: string
  instituteName: string
}

type TravelLeg = {
  fromDate: string
  fromTime: string
  fromPlace: string
  toDate: string
  toTime: string
  toPlace: string
  travelMode: string
  totalFare: string
  admissibleFare: string
}

type TravelMember = {
  slot: string
  id: string
  name: string
  position: (typeof POSITION_OPTIONS)[number]
  onward: TravelLeg
  returnTrip: TravelLeg
  signature: string
}

function extractEntryName(entry: unknown): string {
  if (!entry || typeof entry !== "object") return ""
  if ("user" in entry && entry.user && typeof entry.user === "object") {
    const user = entry.user as { name?: string | null; email?: string | null }
    return user.name || user.email || ""
  }
  if ("name" in entry && typeof entry.name === "string") {
    return entry.name
  }
  if ("email" in entry && typeof entry.email === "string") {
    return entry.email
  }
  return ""
}

function extractEntryId(entry: unknown, fallback: string): string {
  if (!entry || typeof entry !== "object") return fallback
  if ("id" in entry && typeof entry.id === "string" && entry.id) {
    return entry.id
  }
  return fallback
}

function createInitialBeneficiaryState(): BeneficiaryFormState {
  return {
    teamLeaderName: "",
    instituteName: "",
    aadharNumber: "",
    panNumber: "",
    beneficiaryAddress1: "",
    beneficiaryAddress2: "",
    beneficiaryPin: "",
    beneficiaryPhone: "",
    beneficiaryEmail: "",
    bankName: "",
    branchName: "",
    bankAddress1: "",
    bankAddress2: "",
    bankAddressPin: "",
    bankPhone: "",
    accountNumber: "",
    ifsc: "",
    accountInName: "",
    jointAccount: "",
    accountOperational: "",
  }
}

function createInitialTAInfo(): TAInfoState {
  return {
    teamLeaderName: "",
    teamName: "",
    teamId: "",
    instituteName: "",
  }
}

function createBlankLeg(): TravelLeg {
  return {
    fromDate: "",
    fromTime: "",
    fromPlace: "",
    toDate: "",
    toTime: "",
    toPlace: "",
    travelMode: "",
    totalFare: "",
    admissibleFare: "",
  }
}

function createTravelMembers(details: TeamDetails | null): TravelMember[] {
  const members = details?.members ?? []
  const leaderMember = members.find((member) => member.role?.toLowerCase().includes("leader"))
  const mentorMembers = members.filter((member) => member.role?.toLowerCase().includes("mentor"))
  const generalMembers = members.filter((member) => {
    const role = member.role?.toLowerCase() || ""
    return !role.includes("leader") && !role.includes("mentor")
  })

  return MEMBER_SLOTS.map((slotInfo, index) => {
    let candidateName = ""
    let candidateId = `${slotInfo.slot}-${index}`
    let candidatePosition: (typeof POSITION_OPTIONS)[number] = slotInfo.defaultPosition

    if (slotInfo.defaultPosition === "Leader") {
      const leader = leaderMember ?? members[0]
      candidateName = extractEntryName(leader)
      candidateId = extractEntryId(leader, `leader-${slotInfo.slot}`)
    } else if (slotInfo.defaultPosition === "Mentor") {
      const mentorCandidate = mentorMembers.shift() ?? (slotInfo.slot === "m1" ? details?.faculty_mentor : null)
      candidateName = extractEntryName(mentorCandidate)
      candidateId = extractEntryId(mentorCandidate, `mentor-${slotInfo.slot}`)
    } else {
      const member = generalMembers.shift()
      candidateName = extractEntryName(member)
      candidateId = extractEntryId(member, `member-${slotInfo.slot}`)
      candidatePosition = "Member"
    }

    return {
      slot: slotInfo.slot,
      id: candidateId,
      name: candidateName,
      position: candidatePosition,
      onward: createBlankLeg(),
      returnTrip: createBlankLeg(),
      signature: candidateName,
    }
  })
}

function syncAllMembersToPrimary(members: TravelMember[]): TravelMember[] {
  if (members.length <= 1) return members
  const primary = members[0]
  return members.map((member, index) =>
    index === 0
      ? member
      : {
          ...member,
          onward: { ...primary.onward },
          returnTrip: { ...primary.returnTrip },
        },
  )
}

function parseAmount(value: string): number {
  if (!value) return 0
  const normalized = value.replace(/[^0-9.-]/g, "")
  const amount = parseFloat(normalized)
  return Number.isFinite(amount) ? amount : 0
}

function TAFormPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTeamId = searchParams.get("teamId") || ""

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const generatedUrlRef = useRef<string | null>(null)

  const [teams, setTeams] = useState<POCTeam[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId)
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamError, setTeamError] = useState<string | null>(null)

  const [beneficiaryData, setBeneficiaryData] = useState<BeneficiaryFormState>(() => createInitialBeneficiaryState())
  const [taInfo, setTaInfo] = useState<TAInfoState>(() => createInitialTAInfo())
  const [travelMembers, setTravelMembers] = useState<TravelMember[]>(() => createTravelMembers(null))
  const [syncAll, setSyncAll] = useState(true)

  const [previewVisible, setPreviewVisible] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewGenerating, setPreviewGenerating] = useState(false)

  const fieldLabelClass = "text-xs font-semibold uppercase tracking-wide text-[#002449]"
  const inputAccentClass = "bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"

  useEffect(() => {
    let mounted = true
    const loadTeams = async () => {
      try {
        const pocTeams = await getCachedPOCTeams()
        if (mounted) setTeams(pocTeams)
      } catch (error: any) {
        if (mounted) setTeamError(error?.message || "Unable to fetch teams")
      } finally {
        if (mounted) setTeamsLoading(false)
      }
    }
    loadTeams()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedTeamId) {
      setBeneficiaryData(createInitialBeneficiaryState())
      setTaInfo(createInitialTAInfo())
      setTravelMembers(createTravelMembers(null))
      return
    }

    let active = true
    const fetchTeamDetails = async () => {
      setTeamLoading(true)
      setTeamError(null)
      try {
        const details = await authService.getPOCTeamDetail(selectedTeamId)
        if (!active) return
        const leaderMember = details.members?.find((member) => member.role?.toLowerCase().includes("leader"))
        const baseBeneficiary = createInitialBeneficiaryState()
        setBeneficiaryData({
          ...baseBeneficiary,
          teamLeaderName: leaderMember?.user?.name || leaderMember?.user?.email || "",
          instituteName: details.institution || "",
          beneficiaryEmail: leaderMember?.user?.email || "",
          beneficiaryPhone: leaderMember?.user?.phone || "",
        })
        setTaInfo({
          teamLeaderName: leaderMember?.user?.name || leaderMember?.user?.email || "",
          teamName: details.name || "",
          teamId: details.team_id || "",
          instituteName: details.institution || "",
        })
        const populatedMembers = createTravelMembers(details)
        setTravelMembers(syncAll ? syncAllMembersToPrimary(populatedMembers) : populatedMembers)
      } catch (error: any) {
        if (active) {
          setTeamError(error?.message || "Unable to fetch team details")
          setBeneficiaryData(createInitialBeneficiaryState())
          setTaInfo(createInitialTAInfo())
          setTravelMembers(createTravelMembers(null))
        }
      } finally {
        if (active) setTeamLoading(false)
      }
    }

    fetchTeamDetails()

    return () => {
      active = false
    }
  }, [selectedTeamId])

  useEffect(() => {
    if (initialTeamId && teams.some((team) => team.id === initialTeamId)) {
      setSelectedTeamId(initialTeamId)
    }
  }, [initialTeamId, teams])

  useEffect(() => {
    let active = true

    const generatePreview = async () => {
      if (!previewVisible) {
        setPreviewGenerating(false)
        setPreviewError(null)
        setPdfUrl(null)
        if (generatedUrlRef.current) {
          URL.revokeObjectURL(generatedUrlRef.current)
          generatedUrlRef.current = null
        }
        return
      }

      setPreviewGenerating(true)
      setPreviewError(null)

      try {
        const response = await fetch(TA_PDF_SRC, { cache: "no-store" })
        if (!response.ok) throw new Error(`Failed to fetch PDF (${response.status})`)
        const sourceBuffer = await response.arrayBuffer()

        const pdfLib = await import("pdf-lib")
        const pdfDoc = await pdfLib.PDFDocument.load(sourceBuffer)
        const form = pdfDoc.getForm()

        const setText = (fieldName: string, value: string) => {
          try {
            form.getTextField(fieldName).setText(value)
          } catch (error) {
            try {
              form.getDropdown(fieldName).select(value)
            } catch (error2) {
              // field might not exist; ignore silently
            }
          }
        }

        const setCheckboxPair = (yesField: string, noField: string, value: "Yes" | "No" | "") => {
          try {
            const yesBox = form.getCheckBox(yesField)
            value === "Yes" ? yesBox.check() : yesBox.uncheck()
          } catch (error) {}
          try {
            const noBox = form.getCheckBox(noField)
            value === "No" ? noBox.check() : noBox.uncheck()
          } catch (error) {}
        }

        setText("teamLeaderName", beneficiaryData.teamLeaderName || "")
        setText("instituteName", beneficiaryData.instituteName || "")
        setText("aadharNumber", beneficiaryData.aadharNumber || "")
        setText("panNumber", beneficiaryData.panNumber || "")
        setText("beneficiaryAddress_1", beneficiaryData.beneficiaryAddress1 || "")
        setText("beneficiaryAddress_2", beneficiaryData.beneficiaryAddress2 || "")
        setText("beneficiaryPin", beneficiaryData.beneficiaryPin || "")
        setText("beneficiaryPhone", beneficiaryData.beneficiaryPhone || "")
        setText("beneficiaryEmail", beneficiaryData.beneficiaryEmail || "")
        setText("bankName", beneficiaryData.bankName || "")
        setText("branchName", beneficiaryData.branchName || "")
        setText("bankAddress_1", beneficiaryData.bankAddress1 || "")
        setText("bankAddress_2", beneficiaryData.bankAddress2 || "")
        setText("bankAddressPin", beneficiaryData.bankAddressPin || "")
        setText("bankPhone", beneficiaryData.bankPhone || "")
        setText("accountNumber", beneficiaryData.accountNumber || "")
        setText("ifsc", beneficiaryData.ifsc || "")

        setCheckboxPair("accountInNameYes", "accountInNameNo", beneficiaryData.accountInName)
        setCheckboxPair("jointAccountYes", "jointAccountNo", beneficiaryData.jointAccount)
        setCheckboxPair("accountOperationalYes", "accountOperationalNo", beneficiaryData.accountOperational)

        setText("TeamLeaderName", taInfo.teamLeaderName || "")
        setText("TeamName", taInfo.teamName || "")
        setText("TeamId", taInfo.teamId || "")
        setText("InstituteName", taInfo.instituteName || "")

        let grandTotal = 0

        travelMembers.forEach((member) => {
          const onward = member.onward
          const returnLeg = member.returnTrip
// travelMembersLeaderonwardfromDate
          if (member.slot === "1") {
            setText("1personName", member.name || "")
            setText("travelMembersLeaderonwardfromDate", onward.fromDate || "")
            setText("travelMembersLeaderonwardFromTime", onward.fromTime || "")
            setText("travelMembersLeaderonwardFromPlace", onward.fromPlace || "")
            setText("travelMembersLeaderonwardToDate", onward.toDate || "")
            setText("travelMembersLeaderonwardToTime", onward.toTime || "")
            setText("travelMembersLeaderonwardToPlace", onward.toPlace || "")
            setText("travelMembersLeaderreturnFromDate", returnLeg.fromDate || "")
            setText("travelMembersLeaderreturnFromTime", returnLeg.fromTime || "")
            setText("travelMembersLeaderreturnFromPlace", returnLeg.fromPlace || "")
            setText("travelMembersLeaderreturnToDate", returnLeg.toDate || "")
            setText("travelMembersLeaderreturnToTime", returnLeg.toTime || "")
            setText("travelMembersLeaderreturnToPlace", returnLeg.toPlace || "")
            setText("leadertonwardtravelMode", onward.travelMode || "")
            setText("leaderreturntravelMode", returnLeg.travelMode || "")
            setText("leaderonwardFare", onward.totalFare || "")
            setText("leaderreturnFare", returnLeg.totalFare || "")
            setText("leaderonwardadmissibleFare", onward.admissibleFare || "")
            setText("leaderreturnadmissibleFare", returnLeg.admissibleFare || "")
          } else if (member.slot === "m1" || member.slot === "m2") {
            const mentorNumber = member.slot === "m1" ? "1" : "2"
            setText(`teamMentor${mentorNumber}_Name`, member.name || "")
            setText(`travelMentor${mentorNumber}onwardFromDate`, onward.fromDate || "")
            setText(`travelMentor${mentorNumber}onwardFromTime`, onward.fromTime || "")
            setText(`travelMentor${mentorNumber}onwardFromPlace`, onward.fromPlace || "")
            setText(`travelMentor${mentorNumber}onwardToDate`, onward.toDate || "")
            setText(`travelMentor${mentorNumber}onwardToTime`, onward.toTime || "")
            setText(`travelMentor${mentorNumber}onwardToPlace`, onward.toPlace || "")
            setText(`travelMentor${mentorNumber}returnFromDate`, returnLeg.fromDate || "")
            setText(`travelMentor${mentorNumber}returnFromTime`, returnLeg.fromTime || "")
            setText(`travelMentor${mentorNumber}returnFromPlace`, returnLeg.fromPlace || "")
            setText(`travelMentor${mentorNumber}returnToDate`, returnLeg.toDate || "")
            setText(`travelMentor${mentorNumber}returnToTime`, returnLeg.toTime || "")
            setText(
              member.slot === "m1" ? "traveMentor1returnToPlace" : "traveMentor2returnToPlace",
              returnLeg.toPlace || "",
            )
            setText(`m${mentorNumber}onwardtravelMode`, onward.travelMode || "")
            setText(`m${mentorNumber}returntravelMode`, returnLeg.travelMode || "")
            setText(`m${mentorNumber}onwardFare`, onward.totalFare || "")
            setText(`m${mentorNumber}returnFare`, returnLeg.totalFare || "")
            setText(`m${mentorNumber}onwardadmissibleFare`, onward.admissibleFare || "")
            setText(`m${mentorNumber}returnadmissibleFare`, returnLeg.admissibleFare || "")
          } else {
            const numericSlot = Number(member.slot)
            if (!Number.isNaN(numericSlot) && numericSlot > 1) {
              const indexString = String(numericSlot - 1)
              setText(`teamMemebr${indexString}_Name`, member.name || "")
              setText(`travelMember${indexString}onwardFromDate`, onward.fromDate || "")
              setText(`travelMember${indexString}onwardFromTime`, onward.fromTime || "")
              setText(`travelMember${indexString}onwardFromPlace`, onward.fromPlace || "")
              setText(`travelMember${indexString}onwardToDate`, onward.toDate || "")
              setText(`travelMember${indexString}onwardToTime`, onward.toTime || "")
              setText(`travelMember${indexString}onwardToPlace`, onward.toPlace || "")
              setText(`travelMember${indexString}returnFromDate`, returnLeg.fromDate || "")
              setText(`travelMember${indexString}returnFromTime`, returnLeg.fromTime || "")
              setText(`travelMember${indexString}returnFromPlace`, returnLeg.fromPlace || "")
              setText(`travelMember${indexString}returnToDate`, returnLeg.toDate || "")
              setText(`travelMember${indexString}returnToTime`, returnLeg.toTime || "")
              setText(`travelMember${indexString}returnToPlace`, returnLeg.toPlace || "")
              setText(`${indexString}onwardtravelMode`, onward.travelMode || "")
              setText(`${indexString}returntravelMode`, returnLeg.travelMode || "")
              setText(`${indexString}onwardFare`, onward.totalFare || "")
              setText(`${indexString}returnFare`, returnLeg.totalFare || "")
              setText(`${indexString}onwardadmissibleFare`, onward.admissibleFare || "")
              setText(`${indexString}returnadmissibleFare`, returnLeg.admissibleFare || "")
            }
          }

          grandTotal += parseAmount(onward.admissibleFare) + parseAmount(returnLeg.admissibleFare)
        })

        setText("grandTotal", grandTotal ? String(grandTotal) : "")

        const pdfBytes = await pdfDoc.save()
        const arrayBuffer = new ArrayBuffer(pdfBytes.byteLength)
        new Uint8Array(arrayBuffer).set(pdfBytes)
        const blob = new Blob([arrayBuffer], { type: "application/pdf" })
        const objectUrl = URL.createObjectURL(blob)

        if (!active) {
          URL.revokeObjectURL(objectUrl)
          return
        }

        if (generatedUrlRef.current) {
          URL.revokeObjectURL(generatedUrlRef.current)
        }

        generatedUrlRef.current = objectUrl
        setPdfUrl(objectUrl)
      } catch (error) {
        console.error("Failed to generate TA preview", error)
        if (active) {
          setPreviewError("Unable to generate preview. Please try again.")
          setPdfUrl(null)
        }
      } finally {
        if (active) setPreviewGenerating(false)
      }
    }

    generatePreview()

    return () => {
      active = false
    }
  }, [previewVisible, beneficiaryData, travelMembers, taInfo])

  useEffect(() => {
    if (syncAll) {
      setTravelMembers((prev) => syncAllMembersToPrimary(prev))
    }
  }, [syncAll])

  const totalFareDisplay = useMemo(() => {
    return travelMembers.reduce((sum, member) => {
      return sum + parseAmount(member.onward.totalFare) + parseAmount(member.returnTrip.totalFare)
    }, 0)
  }, [travelMembers])

  const admissibleFareDisplay = useMemo(() => {
    return travelMembers.reduce((sum, member) => {
      return sum + parseAmount(member.onward.admissibleFare) + parseAmount(member.returnTrip.admissibleFare)
    }, 0)
  }, [travelMembers])

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value)
    if (value) {
      router.replace(`/poc/ta-form?teamId=${value}`)
    } else {
      router.replace("/poc/ta-form")
    }
  }

  const handleBeneficiaryField = (field: keyof BeneficiaryFormState, value: string) => {
    setBeneficiaryData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBeneficiaryChoice = (
    field: "accountInName" | "jointAccount" | "accountOperational",
    value: "Yes" | "No" | "",
  ) => {
    setBeneficiaryData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTaInfoField = (field: keyof TAInfoState, value: string) => {
    setTaInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleMemberField = (
    index: number,
    field: "name" | "position",
    value: string,
  ) => {
    setTravelMembers((prev) =>
      prev.map((member, idx) => {
        if (idx !== index) return member
        if (field === "position" && !POSITION_OPTIONS.includes(value as any)) {
          return member
        }
        const updated = {
          ...member,
          [field]: field === "position" ? (value as (typeof POSITION_OPTIONS)[number]) : value,
        }
        if (field === "name") {
          updated.signature = value
        }
        return updated
      }),
    )
  }

  const handleLegField = (
    index: number,
    leg: "onward" | "returnTrip",
    field: keyof TravelLeg,
    value: string,
  ) => {
    setTravelMembers((prev) => {
      const updated = prev.map((member, idx) => {
        if (idx !== index) return member
        return {
          ...member,
          [leg]: {
            ...member[leg],
            [field]: value,
          },
        }
      })

      if (!syncAll || index !== 0) {
        return updated
      }

      const primaryLeg = updated[0][leg]
      return updated.map((member, idx) =>
        idx === 0
          ? member
          : {
              ...member,
              [leg]: { ...primaryLeg },
            },
      )
    })
  }

  const handleTogglePreview = () => {
    if (previewVisible) {
      setPreviewVisible(false)
      setPreviewError(null)
    } else {
      setPreviewVisible(true)
    }
  }

  const handlePrint = () => {
    if (!previewVisible) return
    const frameWindow = iframeRef.current?.contentWindow
    if (!frameWindow) return
    try {
      frameWindow.focus()
      frameWindow.print()
    } catch (error) {
      console.error("Print failed", error)
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#002449" }}>
              TA & Mandate Form
            </h1>
            
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleTogglePreview} className="gap-2">
              {previewVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {previewVisible ? "Hide Preview" : "Show PDF Preview"}
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-[#002449] hover:bg-[#001a33] text-white gap-2"
              disabled={!previewVisible || previewGenerating || !pdfUrl}
            >
              <Printer className="h-4 w-4" /> Print Form
            </Button>
          </div>
        </header>

        <Card className="p-6 space-y-6 rounded-xl border border-[#d9e2f2] bg-[#f9fbff] shadow-md">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Select Team</label>
            {teamsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading teams...
              </div>
            ) : teams.length ? (
              <Select value={selectedTeamId || undefined} onValueChange={handleTeamChange}>
                <SelectTrigger className="w-full justify-between">
                  <SelectValue placeholder="Choose a team" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-red-600">No teams assigned yet.</p>
            )}
          </div>

          {teamError && <p className="text-sm text-red-600">{teamError}</p>}

          {teamLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Fetching team details...
            </div>
          )}

          {(!selectedTeamId || teamLoading) ? null : (
            <div className="space-y-8">
              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#002449]">
                  Beneficiary & Bank Details
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Name of the Team Leader</label>
                    <Input
                      value={beneficiaryData.teamLeaderName}
                      onChange={(event) => handleBeneficiaryField("teamLeaderName", event.target.value)}
                      placeholder="Team leader name"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Institute / College Name</label>
                    <Input
                      value={beneficiaryData.instituteName}
                      onChange={(event) => handleBeneficiaryField("instituteName", event.target.value)}
                      placeholder="Institute name"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Aadhaar Card Number</label>
                    <Input
                      value={beneficiaryData.aadharNumber}
                      onChange={(event) => handleBeneficiaryField("aadharNumber", event.target.value)}
                      placeholder="Aadhaar number"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>PAN Number</label>
                    <Input
                      value={beneficiaryData.panNumber}
                      onChange={(event) => handleBeneficiaryField("panNumber", event.target.value)}
                      placeholder="PAN number"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2 md:col-span-2">
                    <label className={fieldLabelClass}>Beneficiary Address (Line 1)</label>
                    <Input
                      value={beneficiaryData.beneficiaryAddress1}
                      onChange={(event) => handleBeneficiaryField("beneficiaryAddress1", event.target.value)}
                      placeholder="Street address"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2 md:col-span-2">
                    <label className={fieldLabelClass}>Beneficiary Address (Line 2)</label>
                    <Input
                      value={beneficiaryData.beneficiaryAddress2}
                      onChange={(event) => handleBeneficiaryField("beneficiaryAddress2", event.target.value)}
                      placeholder="Area / Landmark"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>PIN Code</label>
                    <Input
                      value={beneficiaryData.beneficiaryPin}
                      onChange={(event) => handleBeneficiaryField("beneficiaryPin", event.target.value)}
                      placeholder="PIN"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Beneficiary Mobile Number</label>
                    <Input
                      value={beneficiaryData.beneficiaryPhone}
                      onChange={(event) => handleBeneficiaryField("beneficiaryPhone", event.target.value)}
                      placeholder="Mobile number"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Beneficiary Email</label>
                    <Input
                      value={beneficiaryData.beneficiaryEmail}
                      onChange={(event) => handleBeneficiaryField("beneficiaryEmail", event.target.value)}
                      placeholder="Email address"
                      type="email"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Beneficiary Bank Name</label>
                    <Input
                      value={beneficiaryData.bankName}
                      onChange={(event) => handleBeneficiaryField("bankName", event.target.value)}
                      placeholder="Bank name"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Branch Name</label>
                    <Input
                      value={beneficiaryData.branchName}
                      onChange={(event) => handleBeneficiaryField("branchName", event.target.value)}
                      placeholder="Branch"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2 md:col-span-2">
                    <label className={fieldLabelClass}>Bank Address (Line 1)</label>
                    <Input
                      value={beneficiaryData.bankAddress1}
                      onChange={(event) => handleBeneficiaryField("bankAddress1", event.target.value)}
                      placeholder="Bank street address"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2 md:col-span-2">
                    <label className={fieldLabelClass}>Bank Address (Line 2)</label>
                    <Input
                      value={beneficiaryData.bankAddress2}
                      onChange={(event) => handleBeneficiaryField("bankAddress2", event.target.value)}
                      placeholder="Area / Landmark"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Bank PIN Code</label>
                    <Input
                      value={beneficiaryData.bankAddressPin}
                      onChange={(event) => handleBeneficiaryField("bankAddressPin", event.target.value)}
                      placeholder="PIN"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Bank Telephone Number</label>
                    <Input
                      value={beneficiaryData.bankPhone}
                      onChange={(event) => handleBeneficiaryField("bankPhone", event.target.value)}
                      placeholder="Telephone"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Account Number (Full)</label>
                    <Input
                      value={beneficiaryData.accountNumber}
                      onChange={(event) => handleBeneficiaryField("accountNumber", event.target.value)}
                      placeholder="Account number"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Bank Branch IFSC Code</label>
                    <Input
                      value={beneficiaryData.ifsc}
                      onChange={(event) => handleBeneficiaryField("ifsc", event.target.value)}
                      placeholder="IFSC"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Account in Beneficiary's Name</label>
                    <Select
                      value={beneficiaryData.accountInName || undefined}
                      onValueChange={(value) => handleBeneficiaryChoice("accountInName", value as "Yes" | "No")}
                    >
                      <SelectTrigger className={`w-full justify-between ${inputAccentClass}`}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Joint Account</label>
                    <Select
                      value={beneficiaryData.jointAccount || undefined}
                      onValueChange={(value) => handleBeneficiaryChoice("jointAccount", value as "Yes" | "No")}
                    >
                      <SelectTrigger className={`w-full justify-between ${inputAccentClass}`}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Account Operational</label>
                    <Select
                      value={beneficiaryData.accountOperational || undefined}
                      onValueChange={(value) => handleBeneficiaryChoice("accountOperational", value as "Yes" | "No")}
                    >
                      <SelectTrigger className={`w-full justify-between ${inputAccentClass}`}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </fieldset>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#002449]">Team Details (for TA)</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Name of Team Leader</label>
                    <Input
                      value={taInfo.teamLeaderName}
                      onChange={(event) => handleTaInfoField("teamLeaderName", event.target.value)}
                      placeholder="Team leader"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Name of Team</label>
                    <Input
                      value={taInfo.teamName}
                      onChange={(event) => handleTaInfoField("teamName", event.target.value)}
                      placeholder="Team name"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Team ID</label>
                    <Input
                      value={taInfo.teamId}
                      onChange={(event) => handleTaInfoField("teamId", event.target.value)}
                      placeholder="Team identifier"
                      className={inputAccentClass}
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <label className={fieldLabelClass}>Institute Detail</label>
                    <Input
                      value={taInfo.instituteName}
                      onChange={(event) => handleTaInfoField("instituteName", event.target.value)}
                      placeholder="Institute"
                      className={inputAccentClass}
                    />
                  </fieldset>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[#002449]">
                    Travel Particulars (Team-wise)
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch id="sync-all" checked={syncAll} onCheckedChange={(checked) => setSyncAll(checked)} />
                    <label htmlFor="sync-all" className="cursor-pointer">
                      Mirror travel details from Entry 1 to the rest
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  {travelMembers.map((member, index) => (
                    <div
                      key={member.slot}
                      className="rounded-lg border border-[#d9e2f2] bg-white/80 p-4 space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="text-xs font-semibold uppercase tracking-wide text-[#007367]">
                          {member.slot.toUpperCase()} • {index === 0 ? "Leader" : member.position}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 w-full md:w-auto">
                          <fieldset className="space-y-2">
                            <label className={fieldLabelClass}>Name</label>
                            <Input
                              value={member.name}
                              onChange={(event) => handleMemberField(index, "name", event.target.value)}
                              placeholder="Member name"
                              className={inputAccentClass}
                            />
                          </fieldset>
                          <fieldset className="space-y-2">
                            <label className={fieldLabelClass}>Position</label>
                            <Select
                              value={member.position}
                              onValueChange={(value) => handleMemberField(index, "position", value)}
                            >
                              <SelectTrigger className={`w-full justify-between ${inputAccentClass}`}>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {POSITION_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </fieldset>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#002449]">
                            Onward Journey
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Date</label>
                              <Input
                                type="date"
                                value={member.onward.fromDate}
                                onChange={(event) => handleLegField(index, "onward", "fromDate", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Time</label>
                              <Input
                                type="time"
                                value={member.onward.fromTime}
                                onChange={(event) => handleLegField(index, "onward", "fromTime", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Place</label>
                              <Input
                                value={member.onward.fromPlace}
                                onChange={(event) => handleLegField(index, "onward", "fromPlace", event.target.value)}
                                placeholder="City / Station"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Date</label>
                              <Input
                                type="date"
                                value={member.onward.toDate}
                                onChange={(event) => handleLegField(index, "onward", "toDate", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Time</label>
                              <Input
                                type="time"
                                value={member.onward.toTime}
                                onChange={(event) => handleLegField(index, "onward", "toTime", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Place</label>
                              <Input
                                value={member.onward.toPlace}
                                onChange={(event) => handleLegField(index, "onward", "toPlace", event.target.value)}
                                placeholder="City / Station"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Travel Mode Used</label>
                              <Input
                                value={member.onward.travelMode}
                                onChange={(event) => handleLegField(index, "onward", "travelMode", event.target.value)}
                                placeholder="Train / Bus / Flight"
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Total Fare (to & fro)*</label>
                              <Input
                                value={member.onward.totalFare}
                                onChange={(event) => handleLegField(index, "onward", "totalFare", event.target.value)}
                                placeholder="Amount"
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Admissible TA (Sleeper)</label>
                              <Input
                                value={member.onward.admissibleFare}
                                onChange={(event) => handleLegField(index, "onward", "admissibleFare", event.target.value)}
                                placeholder="Amount"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#002449]">
                            Return Journey
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Date</label>
                              <Input
                                type="date"
                                value={member.returnTrip.fromDate}
                                onChange={(event) => handleLegField(index, "returnTrip", "fromDate", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Time</label>
                              <Input
                                type="time"
                                value={member.returnTrip.fromTime}
                                onChange={(event) => handleLegField(index, "returnTrip", "fromTime", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>From Place</label>
                              <Input
                                value={member.returnTrip.fromPlace}
                                onChange={(event) => handleLegField(index, "returnTrip", "fromPlace", event.target.value)}
                                placeholder="City / Station"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Date</label>
                              <Input
                                type="date"
                                value={member.returnTrip.toDate}
                                onChange={(event) => handleLegField(index, "returnTrip", "toDate", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Time</label>
                              <Input
                                type="time"
                                value={member.returnTrip.toTime}
                                onChange={(event) => handleLegField(index, "returnTrip", "toTime", event.target.value)}
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>To Place</label>
                              <Input
                                value={member.returnTrip.toPlace}
                                onChange={(event) => handleLegField(index, "returnTrip", "toPlace", event.target.value)}
                                placeholder="City / Station"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Travel Mode Used</label>
                              <Input
                                value={member.returnTrip.travelMode}
                                onChange={(event) => handleLegField(index, "returnTrip", "travelMode", event.target.value)}
                                placeholder="Train / Bus / Flight"
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Total Fare (to & fro)*</label>
                              <Input
                                value={member.returnTrip.totalFare}
                                onChange={(event) => handleLegField(index, "returnTrip", "totalFare", event.target.value)}
                                placeholder="Amount"
                                className={inputAccentClass}
                              />
                            </fieldset>
                            <fieldset className="space-y-2">
                              <label className={fieldLabelClass}>Admissible TA (Sleeper)</label>
                              <Input
                                value={member.returnTrip.admissibleFare}
                                onChange={(event) => handleLegField(index, "returnTrip", "admissibleFare", event.target.value)}
                                placeholder="Amount"
                                className={inputAccentClass}
                              />
                            </fieldset>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium text-gray-700">
                  <div className="rounded-lg bg-white border border-[#d9e2f2] p-3">
                    <p className="text-xs uppercase text-muted-foreground">Total Fare (to & fro)</p>
                    <p className="text-lg font-semibold" style={{ color: "#002449" }}>
                      ₹{totalFareDisplay.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-[#d9e2f2] p-3">
                    <p className="text-xs uppercase text-muted-foreground">Admissible TA (sleeper)</p>
                    <p className="text-lg font-semibold" style={{ color: "#002449" }}>
                      ₹{admissibleFareDisplay.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </Card>

        {previewVisible && (
          <Card className="p-4 md:p-6 border border-[#d9e2f2] bg-[#f9fbff]">
            <div className="relative w-full rounded-lg border border-[#c7d4ec] bg-white shadow-sm">
              {(previewGenerating || !pdfUrl) && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-[#f75700]" />
                  Generating preview…
                </div>
              )}
              {pdfUrl && (
                <iframe
                  ref={iframeRef}
                  src={pdfUrl}
                  title="TA & Mandate Preview"
                  className="h-[75vh] min-h-[520px] w-full rounded-lg"
                />
              )}
            </div>
            {previewError && <p className="mt-3 text-sm text-amber-600">{previewError}</p>}
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}

export default function TAFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-[#f75700]" />
        </div>
      }
    >
      <TAFormPageContent />
    </Suspense>
  )
}
