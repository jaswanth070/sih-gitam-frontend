"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Printer } from "lucide-react"
import { getCachedPOCTeams } from "@/lib/dashboard-cache"
import { authService, type TeamDetails, type POCTeam } from "@/lib/auth-service"

const EMPTY_FIELD = "\u00A0"
const DEFAULT_PLACE = "Visakhapatnam"

type FormState = {
  teamLeaderName: string
  instituteName: string
  aadharNumber: string
  panNumber: string
  beneficiaryAddress: string
  beneficiaryPin: string
  beneficiaryPhone: string
  beneficiaryEmail: string
  bankName: string
  branchName: string
  bankAddress: string
  bankAddressPin: string
  bankPhone: string
  accountNumber: string
  ifsc: string
  accountInName: "Yes" | "No" | ""
  jointAccount: "Yes" | "No" | ""
  accountOperational: "Yes" | "No" | ""
  date: string
  place: string
}

function createInitialFormState(): FormState {
  const now = new Date()
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  return {
    teamLeaderName: "",
    instituteName: "",
    aadharNumber: "",
    panNumber: "",
    beneficiaryAddress: "",
    beneficiaryPin: "",
    beneficiaryPhone: "",
    beneficiaryEmail: "",
    bankName: "",
    branchName: "",
    bankAddress: "",
    bankAddressPin: "",
    bankPhone: "",
    accountNumber: "",
    ifsc: "",
    accountInName: "",
    jointAccount: "",
    accountOperational: "",
    date: localIso,
    place: DEFAULT_PLACE,
  }
}

function display(value: string) {
  return value && value.trim().length > 0 ? value : EMPTY_FIELD
}

function displayChoice(value: string) {
  return value && value.trim().length > 0 ? value : "Yes / No"
}

function MandateFormContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTeamId = searchParams.get("teamId") || ""

  const [teams, setTeams] = useState<POCTeam[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId)
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null)
  const [teamLoading, setTeamLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormState>(() => createInitialFormState())

  const fieldLabelClass = "text-xs font-semibold uppercase tracking-wide text-[#002449]"
  const inputAccentClass = "bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"

  useEffect(() => {
    let mounted = true
    const loadTeams = async () => {
      try {
        const pocTeams = await getCachedPOCTeams()
        if (mounted) {
          setTeams(pocTeams)
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Unable to fetch teams")
        }
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
      setTeamDetails(null)
      setFormData(createInitialFormState())
      return
    }
    let active = true
    const fetchDetails = async () => {
      setTeamLoading(true)
      setError(null)
      try {
        const details = await authService.getPOCTeamDetail(selectedTeamId)
        if (!active) return
        setTeamDetails(details)
        const leader = details.members?.find((member) => member.role?.toLowerCase().includes("leader"))
        const base = createInitialFormState()
        setFormData({
          ...base,
          teamLeaderName: leader?.user?.name || leader?.user?.email || "",
          instituteName: details.institution || "",
          beneficiaryEmail: leader?.user?.email || "",
        })
      } catch (err: any) {
        if (active) {
          setError(err?.message || "Unable to fetch team details")
          setTeamDetails(null)
          setFormData(createInitialFormState())
        }
      } finally {
        if (active) setTeamLoading(false)
      }
    }
    fetchDetails()
    return () => {
      active = false
    }
  }, [selectedTeamId])

  useEffect(() => {
    if (initialTeamId && teams.some((team) => team.id === initialTeamId)) {
      setSelectedTeamId(initialTeamId)
    }
  }, [initialTeamId, teams])

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value)
    if (value) {
      router.replace(`/poc/mandate-form?teamId=${value}`)
    } else {
      router.replace("/poc/mandate-form")
      setTeamDetails(null)
      setFormData(createInitialFormState())
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const teamName = useMemo(() => teamDetails?.name || "", [teamDetails])

  return (
    <DashboardShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#002449" }}>
              Mandate Form
            </h1>
            <p className="text-sm text-muted-foreground">
              Fill in beneficiary payment details and use the print option once the information is verified.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
            {selectedTeamId && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/poc/teams/${selectedTeamId}`}>View Team Details</Link>
              </Button>
            )}
            <Button onClick={handlePrint} size="sm" className="bg-[#002449] hover:bg-[#001a33] text-white">
              <Printer className="w-4 h-4" /> Print Mandate Form
            </Button>
          </div>
        </header>

        <Card className="p-6 space-y-6 rounded-xl border border-[#d9e2f2] bg-[#f9fbff] shadow-md print:hidden">
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

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {teamLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Fetching team details...
            </div>
          )}

          {selectedTeamId && !teamLoading && (
            <div className="space-y-6 print:hidden">
              <div className="grid gap-4 md:grid-cols-2">
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>
                    Name of the Team Leader
                  </label>
                  <Input
                    value={formData.teamLeaderName}
                    onChange={(event) => handleFieldChange("teamLeaderName", event.target.value)}
                    placeholder="Enter team leader name"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>
                    Institute / College Name
                  </label>
                  <Input
                    value={formData.instituteName}
                    onChange={(event) => handleFieldChange("instituteName", event.target.value)}
                    placeholder="Enter institute name"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>
                    Aadhaar Card Number
                  </label>
                  <Input
                    value={formData.aadharNumber}
                    onChange={(event) => handleFieldChange("aadharNumber", event.target.value)}
                    placeholder="Enter Aadhaar (if allotted)"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>PAN Number</label>
                  <Input
                    value={formData.panNumber}
                    onChange={(event) => handleFieldChange("panNumber", event.target.value)}
                    placeholder="Enter PAN"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2 md:col-span-2">
                  <label className={fieldLabelClass}>
                    Beneficiary Address for Communication
                  </label>
                  <Textarea
                    rows={3}
                    value={formData.beneficiaryAddress}
                    onChange={(event) => handleFieldChange("beneficiaryAddress", event.target.value)}
                    placeholder="Complete postal address"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>PIN Code</label>
                  <Input
                    value={formData.beneficiaryPin}
                    onChange={(event) => handleFieldChange("beneficiaryPin", event.target.value)}
                    placeholder="PIN"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>
                    Beneficiary Mobile Number
                  </label>
                  <Input
                    value={formData.beneficiaryPhone}
                    onChange={(event) => handleFieldChange("beneficiaryPhone", event.target.value)}
                    placeholder="Enter mobile / telephone number"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>
                    Beneficiary Email
                  </label>
                  <Input
                    type="email"
                    value={formData.beneficiaryEmail}
                    onChange={(event) => handleFieldChange("beneficiaryEmail", event.target.value)}
                    placeholder="Enter email"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>
                    Beneficiary Bank Name
                  </label>
                  <Input
                    value={formData.bankName}
                    onChange={(event) => handleFieldChange("bankName", event.target.value)}
                    placeholder="Bank name"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>Branch Name</label>
                  <Input
                    value={formData.branchName}
                    onChange={(event) => handleFieldChange("branchName", event.target.value)}
                    placeholder="Branch name"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2 md:col-span-2">
                  <label className={fieldLabelClass}>Bank Address</label>
                  <Textarea
                    rows={3}
                    value={formData.bankAddress}
                    onChange={(event) => handleFieldChange("bankAddress", event.target.value)}
                    placeholder="Complete bank address"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>Bank PIN Code</label>
                  <Input
                    value={formData.bankAddressPin}
                    onChange={(event) => handleFieldChange("bankAddressPin", event.target.value)}
                    placeholder="PIN"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>
                    Bank Telephone Number
                  </label>
                  <Input
                    value={formData.bankPhone}
                    onChange={(event) => handleFieldChange("bankPhone", event.target.value)}
                    placeholder="Contact number"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>
                    Account Number (Full)
                  </label>
                  <Input
                    value={formData.accountNumber}
                    onChange={(event) => handleFieldChange("accountNumber", event.target.value)}
                    placeholder="Enter account number"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>
                    IFSC Code
                  </label>
                  <Input
                    value={formData.ifsc}
                    onChange={(event) => handleFieldChange("ifsc", event.target.value)}
                    placeholder="Enter IFSC"
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>
                    Account in Beneficiary's Name
                  </label>
                  <Select
                    value={formData.accountInName || undefined}
                    onValueChange={(value) => handleFieldChange("accountInName", value)}
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
                  <label className={fieldLabelClass}>
                    Joint Account
                  </label>
                  <Select
                    value={formData.jointAccount || undefined}
                    onValueChange={(value) => handleFieldChange("jointAccount", value)}
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
                  <label className={fieldLabelClass}>
                    Account Operational
                  </label>
                  <Select
                    value={formData.accountOperational || undefined}
                    onValueChange={(value) => handleFieldChange("accountOperational", value)}
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
                  <label className={fieldLabelClass}>Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(event) => handleFieldChange("date", event.target.value)}
                    className={inputAccentClass}
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className={fieldLabelClass}>Place</label>
                  <Input
                    value={formData.place}
                    onChange={(event) => handleFieldChange("place", event.target.value)}
                    placeholder="Enter place"
                    className={inputAccentClass}
                  />
                </fieldset>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4 print:space-y-1.5">
          <Card className="mandate-print-container p-6 border border-gray-300 shadow-sm bg-white print:border-0 print:shadow-none print:p-4 print:rounded-none">
            <div className="text-center space-y-1.5 print:space-y-1 mb-4 print:mb-3 font-serif text-gray-900">
              <p className="text-sm print:text-base font-semibold">All India Council for Technical Education</p>
              <p className="text-xs print:text-[11px] text-gray-700">
                Nelson Mandela Marg, Vasant Kunj, New Delhi-110070 TA
              </p>
              <p className="text-sm print:text-[13px] font-semibold uppercase">Mandate Form (For Team)</p>
              <p className="text-sm print:text-[13px] font-semibold">SMART INDIA HACKATHON 2025</p>
              <p className="text-xs print:text-[11px] text-gray-700">Gandhi Institute of Technology and Management (GITAM), Vishakapatanam-530045</p>
              {teamName && <p className="text-xs text-gray-600 print:hidden">Team: {teamName}</p>}
            </div>
            <div className="border border-black">
              <table className="w-full table-fixed border-collapse text-[11px] leading-5 text-black font-serif print:text-[11px] print:leading-[1.45]">
                <colgroup>
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "44%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "25%" }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="border border-black w-10 text-center font-semibold">1</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Name of the Team Leader</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{display(formData.teamLeaderName)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">2</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Name of the institute/College where the team from</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{display(formData.instituteName)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">3</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Aadhar Card Number (If allotted)</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{display(formData.aadharNumber)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">4</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">PAN number</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{display(formData.panNumber)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold align-top" rowSpan={2}>5</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold align-top" rowSpan={2}>
                      Complete address of the Beneficiary for communication
                    </td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>
                      <div className="min-h-[3.25rem] print:min-h-[2.6rem] whitespace-pre-line">{display(formData.beneficiaryAddress)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-1 print:px-2 print:py-0.5 font-semibold">PIN</td>
                    <td className="border border-black px-3 py-1 print:px-2 print:py-0.5">{display(formData.beneficiaryPin)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">6</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Mobile/Telephone no. of the beneficiary</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{display(formData.beneficiaryPhone)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">7</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Email ID of the Beneficiary</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{display(formData.beneficiaryEmail)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">8</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Beneficiary Bank Name</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{display(formData.bankName)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">9</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Branch Name</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{display(formData.branchName)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold align-top" rowSpan={2}>10</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold align-top" rowSpan={2}>Address of the Bank</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>
                      <div className="min-h-[3.25rem] print:min-h-[2.6rem] whitespace-pre-line">{display(formData.bankAddress)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-1 print:px-2 print:py-0.5 font-semibold">PIN</td>
                    <td className="border border-black px-3 py-1 print:px-2 print:py-0.5">{display(formData.bankAddressPin)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">11</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Telephone No. of the Bank</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{display(formData.bankPhone)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">12</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Account Number (Full):</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{display(formData.accountNumber)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">13</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Bank Branch IFSC Code:</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{display(formData.ifsc)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">14</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Whether the Account is in the name of Beneficiary</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{displayChoice(formData.accountInName)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">16</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Whether the Account is Joint Account (Tick One)</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{displayChoice(formData.jointAccount)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-center font-semibold">17</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1 font-semibold">Whether the Account is Operational (Tick One)</td>
                    <td className="border border-black px-3 py-2 print:px-2 print:py-1" colSpan={2}>{displayChoice(formData.accountOperational)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="border-t border-black px-4 py-4 print:px-3 print:py-3 text-xs print:text-[11px] leading-5 print:leading-[1.45] space-y-3 print:space-y-2.5">
                <p className="print:text-[11px] print:leading-[1.45]">
                  I hereby declare that the particular given above are correct and complete. If the transaction is delayed or not
                  effected at all for reasons of incomplete or incorrect information, I would not hold the user institution responsible.
                </p>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 print:flex-row print:items-end print:gap-4">
                  <div className="space-y-1 print:space-y-1.5">
                    <p className="print:text-[11px] print:leading-[1.45]">Date&nbsp;&nbsp;: {display(formData.date)}</p>
                    <p className="print:text-[11px] print:leading-[1.45]">Place&nbsp;: {display(formData.place)}</p>
                  </div>
                  <p className="text-sm print:text-sm font-semibold text-red-600">Signature of Account holder</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 18mm 20mm;
        }
        @media print {
          body {
            background: #ffffff !important;
            color: #000 !important;
          }
          #__next {
            background: #ffffff !important;
          }
          nav,
          footer,
          aside,
          .print\:hidden,
          [data-slot="sidebar"],
          [data-slot="sidebar-trigger"],
          [data-slot="sidebar-gap"],
          [data-slot="sidebar-container"],
          [data-slot="sidebar-rail"],
          [data-slot="sidebar-header"],
          [data-slot="sidebar-footer"],
          [data-slot="sidebar-content"],
          [data-slot="sidebar-group"] {
            display: none !important;
          }
          [data-slot="sidebar-wrapper"] {
            display: block !important;
            min-height: auto !important;
          }
          [data-slot="sidebar-inset"] {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          [data-slot="sidebar-inset"] > div:first-child {
            display: none !important;
          }
          [data-slot="sidebar-inset"] > div:last-child {
            padding: 0 !important;
            margin: 0 !important;
          }
          .mandate-print-container {
            box-shadow: none !important;
            border: none !important;
            padding: 8mm 10mm !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .mandate-print-container,
          .mandate-print-container * {
            font-family: "Times New Roman", Times, serif !important;
            color: #000 !important;
          }
        }
      `}</style>
    </DashboardShell>
  )
}

export default function MandateFormPage() {
  return (
    <Suspense
      fallback={(
        <DashboardShell>
          <div className="flex h-full items-center justify-center py-20">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#f75700]" />
            <span className="text-sm text-muted-foreground">Loading mandate form…</span>
          </div>
        </DashboardShell>
      )}
    >
      <MandateFormContent />
    </Suspense>
  )
}
