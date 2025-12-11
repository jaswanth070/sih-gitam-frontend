"use client"

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCachedPOCTeams } from "@/lib/dashboard-cache"
import { authService, type POCTeam, type TeamBankDetails } from "@/lib/auth-service"

interface BankDetailsFormState {
  bankName: string
  ifsc: string
  pan: string
  aadhar: string
  accountNumber: string
}

function createEmptyBankForm(): BankDetailsFormState {
  return {
    bankName: "",
    ifsc: "",
    pan: "",
    aadhar: "",
    accountNumber: "",
  }
}

function mapDetailsToForm(details: TeamBankDetails | null): BankDetailsFormState {
  if (!details) return createEmptyBankForm()
  return {
    bankName: details.bankName || "",
    ifsc: details.ifsc || "",
    pan: details.pan || "",
    aadhar: details.aadhar || "",
    accountNumber: details.accountNumber || "",
  }
}

function formatTimestamp(timestamp?: string): string | null {
  if (!timestamp) return null
  try {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return null
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  } catch (error) {
    return null
  }
}

function CollectBankDetailsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTeamId = searchParams.get("teamId") || ""

  const [teams, setTeams] = useState<POCTeam[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId)

  const [formState, setFormState] = useState<BankDetailsFormState>(() => createEmptyBankForm())
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [teamSummary, setTeamSummary] = useState<{ name?: string; institution?: string; code?: string } | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    let mounted = true
    const loadTeams = async () => {
      try {
        const pocTeams = await getCachedPOCTeams()
        if (mounted) setTeams(pocTeams)
      } catch (error: any) {
        if (mounted) setSaveError(error?.message || "Unable to fetch teams")
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
      setFormState(createEmptyBankForm())
      setLastUpdatedAt(null)
      setTeamSummary(null)
      return
    }

    const fallbackTeam = teams.find((team) => team.id === selectedTeamId)
    const fallbackSummary = fallbackTeam
      ? {
          name: fallbackTeam.name || fallbackTeam.team_id,
          institution: fallbackTeam.institution,
          code: fallbackTeam.team_id,
        }
      : null

    let active = true
    const loadDetails = async () => {
      setDetailsLoading(true)
      setSaveError(null)
      setSaveSuccess(false)
      try {
        const details = await authService
          .getTeamBankDetails(selectedTeamId)
          .catch((error: unknown) => {
            console.warn("[bank-details] unable to fetch saved details", error)
            return null
          })
        if (!active) return
        setFormState(mapDetailsToForm(details))
        setLastUpdatedAt(details?.updatedAt || details?.createdAt || null)
        if (details) {
          setTeamSummary({
            name: details.teamName || fallbackSummary?.name,
            institution: details.institution || fallbackSummary?.institution,
            code: details.teamId || fallbackSummary?.code,
          })
        } else {
          setTeamSummary(fallbackSummary)
        }
      } catch (error: any) {
        if (active) {
          setSaveError(error?.message || "Failed to load bank details")
          setFormState(createEmptyBankForm())
          setLastUpdatedAt(null)
          setTeamSummary(fallbackSummary)
        }
      } finally {
        if (active) setDetailsLoading(false)
      }
    }

    loadDetails()

    return () => {
      active = false
    }
  }, [selectedTeamId, teams])

  useEffect(() => {
    if (!initialTeamId) return
    if (teams.some((team) => team.id === initialTeamId)) {
      setSelectedTeamId(initialTeamId)
    }
  }, [initialTeamId, teams])

  const teamOptions = useMemo(
    () => teams.map((team) => ({ id: team.id, label: team.name || team.team_id || "Team" })),
    [teams],
  )

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value)
    const fallbackTeam = teams.find((team) => team.id === value)
    setTeamSummary(
      fallbackTeam
        ? {
            name: fallbackTeam.name || fallbackTeam.team_id,
            institution: fallbackTeam.institution,
            code: fallbackTeam.team_id,
          }
        : null,
    )
    if (value) {
      router.replace(`/poc/bank-details?teamId=${value}`)
    } else {
      router.replace("/poc/bank-details")
    }
  }

  const updateField = (field: keyof BankDetailsFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTeamId) {
      setSaveError("Please select a team before saving details.")
      return
    }

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const payload = {
        bankName: formState.bankName,
        ifsc: formState.ifsc,
        pan: formState.pan,
        aadhar: formState.aadhar,
        accountNumber: formState.accountNumber,
      }
      const saved = await authService.upsertTeamBankDetails(selectedTeamId, payload)
      setFormState(mapDetailsToForm(saved))
      setLastUpdatedAt(saved.updatedAt || new Date().toISOString())
      setSaveSuccess(true)
      setTeamSummary({ name: saved.teamName, institution: saved.institution, code: saved.teamId })
    } catch (error: any) {
      setSaveError(error?.message || "Failed to save bank details")
    } finally {
      setSaving(false)
    }
  }

  const formattedUpdatedAt = useMemo(() => formatTimestamp(lastUpdatedAt || undefined), [lastUpdatedAt])

  return (
    <DashboardShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#002449" }}>
              Collect Bank Details
            </h1>
            <p className="text-sm text-muted-foreground">
              Capture verified beneficiary information once and reuse it across TA and mandate forms.
            </p>
          </div>
          {formattedUpdatedAt && (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#007367]">
              <CheckCircle2 className="h-4 w-4" /> Last updated {formattedUpdatedAt}
            </div>
          )}
        </header>

        <Card className="p-6 space-y-6 rounded-xl border border-[#d9e2f2] bg-[#f9fbff] shadow-md">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Select Team</label>
            {teamsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading teams...
              </div>
            ) : teamOptions.length ? (
              <Select value={selectedTeamId || undefined} onValueChange={handleTeamChange}>
                <SelectTrigger className="w-full justify-between">
                  <SelectValue placeholder="Choose a team" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {teamOptions.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-red-600">No teams assigned yet.</p>
            )}
          </div>

          {saveError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Bank details saved successfully.</span>
            </div>
          )}

          {selectedTeamId && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {teamSummary && (teamSummary.name || teamSummary.institution || teamSummary.code) && (
                <div className="grid gap-3 rounded-lg border border-[#d9e2f2] bg-white/70 p-4 text-sm text-[#002449] md:grid-cols-2">
                  {teamSummary.name && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Team</p>
                      <p className="font-semibold">{teamSummary.name}</p>
                    </div>
                  )}
                  {teamSummary.code && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Team Code</p>
                      <p className="font-semibold">{teamSummary.code}</p>
                    </div>
                  )}
                  {teamSummary.institution && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Institution</p>
                      <p className="font-semibold">{teamSummary.institution}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <fieldset className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">
                    Bank Name
                  </label>
                  <Input
                    value={formState.bankName}
                    onChange={(event) => updateField("bankName", event.target.value)}
                    disabled={detailsLoading || saving}
                    placeholder="E.g., State Bank of India"
                    className="bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">
                    IFSC Code
                  </label>
                  <Input
                    value={formState.ifsc}
                    onChange={(event) => updateField("ifsc", event.target.value.toUpperCase())}
                    disabled={detailsLoading || saving}
                    placeholder="IFSC Code"
                    className="bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">
                    PAN Number
                  </label>
                  <Input
                    value={formState.pan}
                    onChange={(event) => updateField("pan", event.target.value.toUpperCase())}
                    disabled={detailsLoading || saving}
                    placeholder="PAN"
                    className="bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">
                    Aadhaar Number
                  </label>
                  <Input
                    value={formState.aadhar}
                    onChange={(event) => updateField("aadhar", event.target.value)}
                    disabled={detailsLoading || saving}
                    placeholder="12-digit Aadhaar"
                    className="bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"
                  />
                </fieldset>
                <fieldset className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">
                    Account Number
                  </label>
                  <Input
                    value={formState.accountNumber}
                    onChange={(event) => updateField("accountNumber", event.target.value)}
                    disabled={detailsLoading || saving}
                    placeholder="Enter the beneficiary account number"
                    className="bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"
                  />
                </fieldset>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  disabled={saving || detailsLoading}
                  className="bg-[#f75700] hover:bg-[#e35200] text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {saving ? "Saving" : "Save Bank Details"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </DashboardShell>
  )
}

export default function CollectBankDetailsPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell>
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading bank details...
            </div>
          </div>
        </DashboardShell>
      }
    >
      <CollectBankDetailsContent />
    </Suspense>
  )
}
