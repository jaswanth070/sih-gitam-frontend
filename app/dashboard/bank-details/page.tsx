"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authService, type TeamBankDetails } from "@/lib/auth-service"
import { getCachedTeamDetails } from "@/lib/dashboard-cache"

interface BankDetailsFormState {
  bankName: string
  branchName: string
  accountantName: string
  ifsc: string
  pan: string
  aadhar: string
  accountNumber: string
}

function createEmptyBankForm(): BankDetailsFormState {
  return {
    bankName: "",
    branchName: "",
    accountantName: "",
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
    branchName: details.bankBranch || "",
    accountantName: details.bankAccountantName || "",
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

export default function TeamLeaderBankDetailsPage() {
  const [formState, setFormState] = useState<BankDetailsFormState>(() => createEmptyBankForm())
  const [teamSummary, setTeamSummary] = useState<{
    name?: string
    institution?: string
    teamCode?: string
  } | null>(null)
  const [originalDetails, setOriginalDetails] = useState<TeamBankDetails | null>(null)
  const [teamUuid, setTeamUuid] = useState<string | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(true)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      setDetailsLoading(true)
      setSaveError(null)
      setSaveSuccess(false)
      let loadError: string | null = null
      try {
        const team = await getCachedTeamDetails().catch((error: any) => {
          if (active) {
            loadError = error?.message || "Failed to load team details"
          }
          return null
        })
        if (!active) return

        if (team) {
          setTeamSummary({
            name: team.name || team.team_id,
            institution: team.institution,
            teamCode: team.team_id,
          })
          setTeamUuid(team.id ?? null)
        }

        const details = await authService.getTeamBankDetails(team?.id).catch((error: any) => {
          console.warn("[bank-details] unable to fetch saved details", error)
          if (active && !loadError) {
            loadError = error?.message || "Failed to load bank details"
          }
          return null
        })
        if (!active) return

        if (details) {
          setTeamUuid((prev) => details.id ?? prev ?? team?.id ?? null)
          setTeamSummary((prev) => ({
            name: details.teamName || prev?.name,
            institution: details.institution || prev?.institution,
            teamCode: details.teamId || prev?.teamCode,
          }))
        }

        setFormState(mapDetailsToForm(details))
        setOriginalDetails(details ?? null)
        setLastUpdatedAt(details?.updatedAt || details?.createdAt || null)
        if (loadError) {
          setSaveError(loadError)
        }
      } catch (error: any) {
        if (!active) return
        setSaveError(error?.message || "Failed to load bank details")
        setFormState(createEmptyBankForm())
        setLastUpdatedAt(null)
      } finally {
        if (active) setDetailsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const updateField = (field: keyof BankDetailsFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const targetTeamId = teamUuid ?? undefined

      const computeDiff = () => {
        const diff: TeamBankDetailsInput = {}
        const previous = originalDetails
        const fields: Array<
          [keyof BankDetailsFormState, keyof TeamBankDetailsInput]
        > = [
          ["bankName", "bankName"],
          ["branchName", "branchName"],
          ["accountantName", "accountantName"],
          ["ifsc", "ifsc"],
          ["pan", "pan"],
          ["aadhar", "aadhar"],
          ["accountNumber", "accountNumber"],
        ]

        const normalize = (value?: string | null) => (value ?? "").trim()

        fields.forEach(([formKey, payloadKey]) => {
          const nextValue = normalize(formState[formKey])
          const prevValue = previous ? normalize((previous as any)[
              payloadKey === "branchName"
                ? "bankBranch"
                : payloadKey === "accountantName"
                  ? "bankAccountantName"
                  : payloadKey
            ]) : ""
          if (!previous || nextValue !== prevValue) {
            (diff as any)[payloadKey] = nextValue
          }
        })
        return diff
      }

      const payload = computeDiff()

      if (!Object.keys(payload).length) {
        setSaveSuccess(true)
        return
      }

      const saved = await authService.upsertTeamBankDetails(targetTeamId, payload)
      setFormState(mapDetailsToForm(saved))
      setOriginalDetails(saved)
      setLastUpdatedAt(saved.updatedAt || new Date().toISOString())
      setSaveSuccess(true)
      setTeamSummary((prev) => ({
        name: saved.teamName || prev?.name,
        institution: saved.institution || prev?.institution,
        teamCode: saved.teamId || prev?.teamCode,
      }))
      setTeamUuid((prev) => saved.id ?? prev ?? targetTeamId ?? null)
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
              Bank Details
            </h1>
            <p className="text-sm text-muted-foreground">
              Update your team&rsquo;s beneficiary information once and reuse it across TA and mandate forms.
            </p>
          </div>
          {formattedUpdatedAt && (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#007367]">
              <CheckCircle2 className="h-4 w-4" /> Last updated {formattedUpdatedAt}
            </div>
          )}
        </header>

        <Card className="p-6 space-y-6 rounded-xl border border-[#d9e2f2] bg-[#f9fbff] shadow-md">
          {teamSummary && (teamSummary.name || teamSummary.institution) && (
            <div className="grid gap-3 rounded-lg border border-[#d9e2f2] bg-white/70 p-4 text-sm text-[#002449] md:grid-cols-2">
              {teamSummary.name && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Team</p>
                  <p className="font-semibold">{teamSummary.name}</p>
                  {teamSummary.teamCode && (
                    <p className="text-xs text-muted-foreground mt-1">Team Code: {teamSummary.teamCode}</p>
                  )}
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

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <fieldset className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">Bank Name</label>
                <Input
                  value={formState.bankName}
                  onChange={(event) => updateField("bankName", event.target.value)}
                  disabled={detailsLoading || saving}
                  placeholder="E.g., State Bank of India"
                  className="bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"
                />
              </fieldset>
              <fieldset className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">Bank Branch</label>
                <Input
                  value={formState.branchName}
                  onChange={(event) => updateField("branchName", event.target.value)}
                  disabled={detailsLoading || saving}
                  placeholder="Branch name"
                  className="bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"
                />
              </fieldset>
              <fieldset className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">IFSC Code</label>
                <Input
                  value={formState.ifsc}
                  onChange={(event) => updateField("ifsc", event.target.value.toUpperCase())}
                  disabled={detailsLoading || saving}
                  placeholder="IFSC Code"
                  className="bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"
                />
              </fieldset>
              <fieldset className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">PAN Number</label>
                <Input
                  value={formState.pan}
                  onChange={(event) => updateField("pan", event.target.value.toUpperCase())}
                  disabled={detailsLoading || saving}
                  placeholder="PAN"
                  className="bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"
                />
              </fieldset>
              <fieldset className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">Aadhaar Number</label>
                <Input
                  value={formState.aadhar}
                  onChange={(event) => updateField("aadhar", event.target.value)}
                  disabled={detailsLoading || saving}
                  placeholder="12-digit Aadhaar"
                  className="bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"
                />
              </fieldset>
              <fieldset className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">Account Number</label>
                <Input
                  value={formState.accountNumber}
                  onChange={(event) => updateField("accountNumber", event.target.value)}
                  disabled={detailsLoading || saving}
                  placeholder="Enter the beneficiary account number"
                  className="bg-[#f5f8ff] border-[#9bb1d4] focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/40"
                />
              </fieldset>
              <fieldset className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#002449]">Bank Accountant Name</label>
                <Input
                  value={formState.accountantName}
                  onChange={(event) => updateField("accountantName", event.target.value)}
                  disabled={detailsLoading || saving}
                  placeholder="Name of bank representative"
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
                {(saving || detailsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving" : detailsLoading ? "Loading" : "Save Bank Details"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardShell>
  )
}
