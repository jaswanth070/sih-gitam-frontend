"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  authService,
  type AdminTeamSummary,
  type TeamDetails,
} from "@/lib/auth-service"
import { getCachedPOCTeams } from "@/lib/dashboard-cache"
import {
  DOCUMENT_SECTIONS_BY_TYPE,
  DOCUMENT_SECTIONS,
  isApprovedStatus,
} from "@/lib/document-metadata"
import {
  getTeamDocumentHistory,
  getDownloadURL,
  type TeamDocumentHistoryItem,
  type DocumentVersionDetail,
} from "@/utils/upload"
import {
  Loader2,
  Building2,
  Users,
  FileDown,
  Inbox,
  ShieldCheck,
} from "lucide-react"

interface TeamOption {
  id: string
  label: string
  subtitle?: string
  code?: string
}

interface ApprovedDocumentEntry {
  documentType: string
  version: DocumentVersionDetail
  latestStatus: string
}

type UserRole = "admin" | "poc" | "leader" | null

function formatStatusLabel(status?: string): string {
  if (!status) return "Unknown"
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((segment) => (segment ? segment[0].toUpperCase() + segment.slice(1) : segment))
    .join(" ")
}

function resolveStatusVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "outline"
  const normalized = status.toLowerCase()
  if (["approved", "verified", "accepted"].includes(normalized)) return "default"
  if (["rejected", "declined", "invalid"].includes(normalized)) return "destructive"
  if (["pending", "submitted", "in_review", "processing", "awaiting_review"].includes(normalized)) return "secondary"
  return "outline"
}

export default function ViewDocumentsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<UserRole>(null)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [teamDetailsMap, setTeamDetailsMap] = useState<Record<string, TeamDetails>>({})
  const [teamError, setTeamError] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => searchParams?.get("teamId") ?? "")
  const [documents, setDocuments] = useState<TeamDocumentHistoryItem[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [bulkDownloading, setBulkDownloading] = useState(false)

  const timestampFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [],
  )

  const syncTeamParam = useCallback(
    (teamId: string) => {
      if (typeof window === "undefined") return
      const params = new URLSearchParams(window.location.search)
      if (teamId) {
        params.set("teamId", teamId)
      } else {
        params.delete("teamId")
      }
      const query = params.toString()
      const target = query ? `?${query}` : ""
      if (target === window.location.search) return
      router.replace(`${window.location.pathname}${target}`, { scroll: false })
    },
    [router],
  )

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    const detectedRole: UserRole = currentUser?.is_admin
      ? "admin"
      : currentUser?.is_poc
        ? "poc"
        : currentUser
          ? "leader"
          : null
    setRole(detectedRole)

    const loadTeams = async () => {
      setLoadingTeams(true)
      setTeamError(null)
      try {
        if (detectedRole === "admin") {
          const items = await authService.getAdminTeams()
          const options: TeamOption[] = items.map((team: AdminTeamSummary) => ({
            id: team.id,
            label: team.name,
            subtitle: team.institution,
            code: team.team_id,
          }))
          setTeams(options)
          setTeamDetailsMap(
            items.reduce((acc, team) => {
              acc[team.id] = team
              return acc
            }, {} as Record<string, TeamDetails>),
          )
          let cleared = false
          setSelectedTeamId((prev) => {
            if (prev && options.some((team) => team.id === prev)) {
              return prev
            }
            cleared = Boolean(prev)
            return ""
          })
          if (cleared) {
            syncTeamParam("")
            setDocuments([])
          }
        } else if (detectedRole === "poc") {
          const pocTeams = await getCachedPOCTeams()
          const options: TeamOption[] = pocTeams.map((team) => ({
            id: String(team.id),
            label: team.name,
            subtitle: team.institution,
            code: (team as Record<string, unknown>).team_id as string | undefined,
          }))
          setTeams(options)
          let cleared = false
          setSelectedTeamId((prev) => {
            if (prev && options.some((team) => team.id === prev)) {
              return prev
            }
            cleared = Boolean(prev)
            return ""
          })
          if (cleared) {
            syncTeamParam("")
            setDocuments([])
          }
        } else if (detectedRole === "leader") {
          const team = await authService.getTeamDetails()
          setTeams([
            {
              id: team.id,
              label: team.name,
              subtitle: team.institution,
              code: team.team_id,
            },
          ])
          setTeamDetailsMap({ [team.id]: team })
          let cleared = false
          setSelectedTeamId((prev) => {
            if (prev && prev === team.id) {
              return prev
            }
            cleared = Boolean(prev)
            return ""
          })
          if (cleared) {
            syncTeamParam("")
            setDocuments([])
          }
        } else {
          setTeams([])
          let cleared = false
          setSelectedTeamId((prev) => {
            if (!prev) return prev
            cleared = true
            return ""
          })
          if (cleared) {
            syncTeamParam("")
            setDocuments([])
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load teams."
        setTeamError(message)
        toast({
          variant: "destructive",
          title: "Failed to load teams",
          description: message,
        })
      } finally {
        setLoadingTeams(false)
      }
    }

    void loadTeams()
  }, [toast, syncTeamParam])

  useEffect(() => {
    const queryTeamId = searchParams?.get("teamId") ?? ""
    setSelectedTeamId((prev) => (prev === queryTeamId ? prev : queryTeamId))
  }, [searchParams])

  const hasTeamDetails = selectedTeamId ? Boolean(teamDetailsMap[selectedTeamId]) : false

  useEffect(() => {
    if (!selectedTeamId) return

    let cancelled = false
    const loadDocuments = async () => {
      setDocumentsLoading(true)
      setDocumentsError(null)
      try {
        if (!hasTeamDetails) {
          if (role === "poc") {
            const detail = await authService.getPOCTeamDetail(selectedTeamId)
            if (!cancelled) {
              setTeamDetailsMap((prev) => ({ ...prev, [selectedTeamId]: detail }))
            }
          } else if (role === "leader") {
            const detail = await authService.getTeamDetails()
            if (!cancelled) {
              setTeamDetailsMap((prev) => ({ ...prev, [detail.id]: detail }))
            }
          }
        }

        const history = await getTeamDocumentHistory(selectedTeamId)
        if (cancelled) return
        setDocuments(history)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : "Unable to load documents."
        setDocumentsError(message)
      } finally {
        if (!cancelled) {
          setDocumentsLoading(false)
        }
      }
    }

    void loadDocuments()

    return () => {
      cancelled = true
    }
  }, [hasTeamDetails, role, selectedTeamId])

  const selectedTeam = selectedTeamId ? teamDetailsMap[selectedTeamId] : undefined

  const approvedDocuments: ApprovedDocumentEntry[] = useMemo(() => {
    if (!documents.length) return []

    return documents
      .map((document) => {
        const versions = [...(document.versions ?? [])]
        if (document.latest_version && !versions.find((version) => version.id === document.latest_version?.id)) {
          versions.unshift(document.latest_version)
        }
        versions.sort((a, b) => {
          const aTime = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0
          const bTime = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0
          if (bTime !== aTime) return bTime - aTime
          return (b.version ?? 0) - (a.version ?? 0)
        })

        const approvedVersion = versions.find((version) => isApprovedStatus(version.status))
        if (!approvedVersion) return null

        return {
          documentType: document.document_type,
          version: approvedVersion,
          latestStatus: approvedVersion.status,
        }
      })
      .filter((entry): entry is ApprovedDocumentEntry => entry !== null)
  }, [documents])

  const handleTeamChange = useCallback(
    (value: string) => {
      let changed = false
      setSelectedTeamId((prev) => {
        if (prev === value) return prev
        changed = true
        return value
      })
      syncTeamParam(value)
      if (changed) {
        setDocuments([])
      }
    },
    [syncTeamParam],
  )

  const handleDownload = useCallback(
    async (versionId: string) => {
      if (!versionId) return
      setDownloadingId(versionId)
      try {
        const { download_url: downloadUrl } = await getDownloadURL(versionId)
        if (typeof window !== "undefined") {
          window.open(downloadUrl, "_blank", "noopener,noreferrer")
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to fetch download link."
        toast({
          variant: "destructive",
          title: "Download failed",
          description: message,
        })
      } finally {
        setDownloadingId(null)
      }
    },
    [toast],
  )

  const handleBulkDownload = useCallback(async () => {
    if (!selectedTeam || !approvedDocuments.length) {
      return
    }

    setBulkDownloading(true)
    try {
      const { default: JSZip } = await import("jszip")
      const zip = new JSZip()
      const nameCounter = new Map<string, number>()

      for (const entry of approvedDocuments) {
        const { download_url: downloadUrl } = await getDownloadURL(entry.version.id)
        const response = await fetch(downloadUrl)
        if (!response.ok) {
          throw new Error(`Failed to download ${entry.version.original_filename ?? entry.documentType}`)
        }

        const fileBuffer = await response.arrayBuffer()
        const sectionTitle = DOCUMENT_SECTIONS_BY_TYPE[entry.documentType]?.title ?? entry.documentType
        const fallbackName = `${sectionTitle}`
        const originalName = entry.version.original_filename?.trim() || fallbackName
        const sanitizedBase = originalName
          .replace(/[^a-zA-Z0-9._-]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .replace(/_{2,}/g, "_")
          .slice(0, 120) || "document"

        const currentCount = nameCounter.get(sanitizedBase) ?? 0
        const extensionIndex = sanitizedBase.lastIndexOf(".")
        const baseName = extensionIndex > 0 ? sanitizedBase.slice(0, extensionIndex) : sanitizedBase
        const extension = extensionIndex > 0 ? sanitizedBase.slice(extensionIndex) : ""
        const uniqueName = currentCount === 0 ? sanitizedBase : `${baseName}_${currentCount}${extension}`
        nameCounter.set(sanitizedBase, currentCount + 1)

        zip.file(uniqueName, fileBuffer)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const rawTeamName = selectedTeam.name?.trim() || "team"
      const safeTeamName = rawTeamName
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/_{2,}/g, "_")
        .slice(0, 80) || "team"
      const zipUrl = URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      link.href = zipUrl
      link.download = `${safeTeamName}_docs.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(zipUrl), 4000)

      toast({
        title: "Download ready",
        description: `Downloaded ${approvedDocuments.length} approved documents.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to download approved documents."
      toast({
        variant: "destructive",
        title: "ZIP download failed",
        description: message,
      })
    } finally {
      setBulkDownloading(false)
    }
  }, [approvedDocuments, selectedTeam, toast])

  return (
    <DashboardShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#002449" }}>
              Approved Documents
            </h1>
            <p className="text-sm text-muted-foreground">
              Review the latest approved uploads for a selected team in one place.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <Select
              value={selectedTeamId || undefined}
              onValueChange={handleTeamChange}
              disabled={loadingTeams || teams.length === 0}
            >
              <SelectTrigger className="w-full min-w-[240px] border border-[#002449]/40 focus:border-[#002449] focus:ring-[#002449]/20">
                <SelectValue placeholder={loadingTeams ? "Loading teams..." : "Select a team"} />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <span className="flex flex-col text-left">
                      <span className="font-medium">{team.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {teamError && (
          <Card className="border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">{teamError}</p>
          </Card>
        )}

        {!loadingTeams && teams.length === 0 && !teamError && (
          <Card className="border border-dashed border-gray-200 bg-muted/10 p-6 text-sm text-muted-foreground">
            <p>
              {role === "admin"
                ? "No teams are available yet. Once teams are onboarded, their approved documents will appear here."
                : role === "poc"
                  ? "You do not have any assigned teams yet. Approved documents will appear once teams are mapped to you."
                  : "No team context detected for this account."}
            </p>
          </Card>
        )}

        {selectedTeam && (
          <Card className="border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#002449]">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Team</span>
                </div>
                <h2 className="text-xl font-semibold" style={{ color: "#002449" }}>
                  {selectedTeam.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {selectedTeam.institution}
                  </span>
                  {selectedTeam.team_id && (
                    <Badge variant="outline" className="text-[11px] font-semibold text-[#f75700]">
                      Team ID • {selectedTeam.team_id}
                    </Badge>
                  )}
                  {selectedTeam.problem_statement?.id && (
                    <Badge variant="secondary" className="text-[11px] font-semibold">
                      Problem Statement • {selectedTeam.problem_statement.id}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Sections</span>
                <div className="flex flex-wrap gap-2">
                  {DOCUMENT_SECTIONS.map((section) => (
                    <Badge key={section.id} variant="outline" className="text-[11px]">
                      {section.title}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {selectedTeamId ? (
          <>
            {documentsError && (
              <Card className="border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">{documentsError}</p>
              </Card>
            )}

            {documentsLoading ? (
              <Card className="flex items-center justify-center gap-3 border border-gray-200 p-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-[#f75700]" />
                Fetching approved documents…
              </Card>
            ) : approvedDocuments.length === 0 ? (
              <Card className="border border-dashed border-gray-200 bg-muted/10 p-10 text-center text-sm text-muted-foreground">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#002449] shadow">
                  <Inbox className="h-5 w-5" />
                </div>
                <p>No approved documents found for the selected team.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {approvedDocuments.length} approved document{approvedDocuments.length === 1 ? "" : "s"} ready for download.
                  </p>
                  <Button
                    variant="default"
                    onClick={() => void handleBulkDownload()}
                    disabled={bulkDownloading}
                    aria-disabled={bulkDownloading}
                    className="w-full md:w-auto"
                  >
                    {bulkDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" />
                    )}
                    {bulkDownloading ? "Preparing ZIP…" : "Download all as ZIP"}
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {approvedDocuments.map((entry) => {
                    const section = DOCUMENT_SECTIONS_BY_TYPE[entry.documentType] ?? {
                      title: entry.documentType,
                      icon: ShieldCheck,
                    }
                    const Icon = section.icon
                    const uploadedAt = entry.version.uploaded_at
                      ? timestampFormatter.format(new Date(entry.version.uploaded_at))
                      : "—"
                    const statusLabel = formatStatusLabel(entry.version.status)
                    const badgeVariant = resolveStatusVariant(entry.version.status)

                    return (
                      <Card key={entry.version.id} className="flex h-full flex-col justify-between border border-gray-200 p-5 shadow-sm">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-[#002449]/10 p-2 text-[#002449]">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
                              <p className="text-xs text-muted-foreground">Latest approved upload available for download.</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-xs text-muted-foreground">
                            {entry.version.original_filename && (
                              <p className="font-medium text-[#002449]">{entry.version.original_filename}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={badgeVariant}>{statusLabel}</Badge>
                              <Badge variant="outline">Version {entry.version.version ?? "—"}</Badge>
                              {uploadedAt && <span>Uploaded {uploadedAt}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                          <span className="text-[11px] text-muted-foreground">Version ID: {entry.version.id}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleDownload(entry.version.id)}
                            disabled={downloadingId === entry.version.id}
                            aria-disabled={downloadingId === entry.version.id}
                          >
                            {downloadingId === entry.version.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <FileDown className="mr-2 h-4 w-4" />
                            )}
                            {downloadingId === entry.version.id ? "Preparing…" : "Download"}
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          !loadingTeams && teams.length > 0 && !teamError && (
            <Card className="border border-dashed border-[#002449]/30 bg-[#002449]/5 p-8 text-sm text-[#002449]">
              <p>Select a team from the dropdown to view its approved documents.</p>
            </Card>
          )
        )}
      </div>
    </DashboardShell>
  )
}
