"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import UploadDocument from "@/components/documents/upload-document"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { authService, type POCTeam, type TeamDetails } from "@/lib/auth-service"
import { getStoredPOCTeams } from "@/lib/session-store"
import { Loader2, Users, CheckCircle2 } from "lucide-react"
import type { TeamDocumentHistoryItem, DocumentVersionDetail } from "@/utils/upload"
import { getTeamDocumentHistory, getDownloadURL } from "@/utils/upload"
import { DOCUMENT_SECTIONS, isApprovedStatus } from "@/lib/document-metadata"

function orderMembers(team: TeamDetails | null) {
  if (!team?.members) return []
  const members = [...team.members]
  return members.sort((a, b) => {
    const roleWeight = (role?: string) => {
      if (!role) return 5
      const normalized = role.toLowerCase()
      if (normalized.includes("leader")) return 0
      if (normalized.includes("mentor")) return 1
      if (normalized.includes("faculty")) return 2
      return 3
    }
    return roleWeight(a.role) - roleWeight(b.role)
  })
}

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

function DocumentSubmissionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teamId = searchParams.get("teamId")
  const initialTeamsRef = useRef<POCTeam[]>(getStoredPOCTeams())
  const [teams, setTeams] = useState<POCTeam[]>(initialTeamsRef.current)
  const [teamsLoading, setTeamsLoading] = useState(initialTeamsRef.current.length === 0)
  const [teamsError, setTeamsError] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teamId)
  const [team, setTeam] = useState<TeamDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentHistory, setDocumentHistory] = useState<TeamDocumentHistoryItem[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [versionDownloadId, setVersionDownloadId] = useState<string | null>(null)
  const initialTeamsAvailable = useRef(initialTeamsRef.current.length > 0)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    const loadTeams = async () => {
      const shouldShowLoader = !initialTeamsAvailable.current
      if (shouldShowLoader) {
        setTeamsLoading(true)
      }
      setTeamsError(null)
      try {
        const pocTeams = await authService.getPOCTeams()
        if (cancelled) return
        setTeams(pocTeams)
        setSelectedTeamId((prev) => {
          if (!prev) return prev
          return pocTeams.some((team) => String(team.id) === prev) ? prev : null
        })
        initialTeamsAvailable.current = pocTeams.length > 0
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "Unable to load assigned teams."
        setTeamsError(message)
      } finally {
        if (!cancelled) {
          setTeamsLoading(false)
        }
      }
    }

    loadTeams()
    return () => {
      cancelled = true
    }
  }, [])

  const timestampFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [],
  )

  useEffect(() => {
    if (teamId && teamId !== selectedTeamId) {
      setSelectedTeamId(teamId)
    }
  }, [teamId, selectedTeamId])

  const handleTeamSelection = useCallback(
    (nextTeamId: string) => {
      if (nextTeamId === selectedTeamId) return
      setSelectedTeamId(nextTeamId)
      const params = new URLSearchParams(searchParams.toString())
      params.set("teamId", nextTeamId)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, selectedTeamId],
  )

  const activeTeamId = selectedTeamId ?? team?.id ?? undefined

  const fetchTeamDocuments = useCallback(
    async (targetTeamId: string) => {
      setDocumentsLoading(true)
      setDocumentsError(null)
      try {
        const documents = await getTeamDocumentHistory(targetTeamId)
        setDocumentHistory(documents)
      } catch (err) {
        console.error("Team document history error", err)
        const message = err instanceof Error ? err.message : "Unable to load document history."
        setDocumentsError(message)
      } finally {
        setDocumentsLoading(false)
      }
    },
    [],
  )

  const handleUploadComplete = useCallback(() => {
    if (activeTeamId) {
      fetchTeamDocuments(activeTeamId)
    }
  }, [activeTeamId, fetchTeamDocuments])

  const handleVersionDownload = useCallback(
    async (versionId: string) => {
      if (!versionId) return
      setVersionDownloadId(versionId)
      try {
        const { download_url } = await getDownloadURL(versionId)
        if (typeof window !== "undefined") {
          window.open(download_url, "_blank", "noopener,noreferrer")
        }
      } catch (err) {
        console.error("Document download failed", err)
        const message = err instanceof Error ? err.message : "Unable to fetch download link."
        toast({
          variant: "destructive",
          title: "Download failed",
          description: message,
        })
      } finally {
        setVersionDownloadId(null)
      }
    },
    [toast],
  )

  useEffect(() => {
    let isMounted = true
    if (!selectedTeamId) {
      setTeam(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchTeam = async () => {
      setLoading(true)
      setError(null)
      try {
        const details = await authService.getPOCTeamDetail(selectedTeamId)
        if (isMounted) {
          setTeam(details)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Unable to load team information")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTeam()
    return () => {
      isMounted = false
    }
  }, [selectedTeamId])

  useEffect(() => {
    if (!activeTeamId) {
      setDocumentHistory([])
      return
    }
    fetchTeamDocuments(activeTeamId)
  }, [activeTeamId, fetchTeamDocuments])

  const orderedMembers = useMemo(() => orderMembers(team), [team])
  const mentorCard = team?.faculty_mentor
  const leader = orderedMembers.find((member) => member.role?.toLowerCase().includes("leader"))

  return (
    <DashboardShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#002449" }}>
              Document Submission
            </h1>
            <p className="text-sm text-muted-foreground">
              Upload mandatory documentation for verification ahead of the Grand Finale.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="w-full min-w-[220px] sm:w-64">
                <Select
                  value={selectedTeamId ?? undefined}
                  onValueChange={handleTeamSelection}
                  disabled={teamsLoading || teams.length === 0}
                >
                  <SelectTrigger className="w-full border border-[#002449]/40 focus:border-[#002449] focus:ring-[#002449]/20">
                    <SelectValue placeholder={teamsLoading ? "Loading teams..." : "Select a team"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {teams.map((teamOption) => (
                        <SelectItem key={teamOption.id} value={teamOption.id}>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-gray-900">{teamOption.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        
                {selectedTeamId && (
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/poc/teams/${selectedTeamId}`}>View Team Details</Link>
                  </Button>
                )}
              </div>
            </div>
            {teamsError && (
              <p className="text-xs font-medium text-destructive">{teamsError}</p>
            )}
          </div>
        </header>

        {!selectedTeamId && !teamsLoading && !teamsError && teams.length > 0 && (
          <Card className="p-6 border-dashed border-[#f75700] bg-[#f75700]/5">
            <p className="text-sm text-gray-700">
              Select a team using the dropdown above to manage document submissions. Once chosen, you can upload and review
              files for that team here.
            </p>
          </Card>
        )}

        {error && (
          <Card className="border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        )}

        {loading && (
          <Card className="p-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-[#f75700]" />
            <p className="text-sm text-muted-foreground">Loading team information...</p>
          </Card>
        )}

        {team && !loading && (
          <div className="space-y-6">
            <Card className="p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold" style={{ color: "#002449" }}>{team.name}</h2>
                  <p className="text-sm text-muted-foreground">{team.institution}</p>
                  {team.problem_statement && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#002449]/10 text-[#002449]">
                      Problem Statement ID: {team.problem_statement.id}
                    </span>
                  )}
                </div>
                {leader && (
                  <div className="bg-[#f75700]/10 border border-[#f75700]/30 rounded-lg p-4 min-w-[220px]">
                    <p className="text-[11px] uppercase tracking-wide text-[#f75700] font-semibold">Team Leader</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{leader.user?.name || leader.user?.email}</p>
                    <p className="text-xs text-muted-foreground break-all">{leader.user?.email}</p>
                  </div>
                )}
              </div>
            </Card>

            {documentsError && (
              <Card className="border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-xs text-destructive">{documentsError}</p>
              </Card>
            )}

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#002449]" />
                <h3 className="text-lg font-semibold" style={{ color: "#002449" }}>
                  Mentor & Team Members
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {mentorCard && (
                  <Card className="p-4 border border-[#002449]/20 bg-[#002449]/5">
                    <p className="text-[11px] uppercase tracking-wide text-[#002449] font-semibold">Faculty Mentor</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{mentorCard.name}</p>
                    <p className="text-xs text-muted-foreground mt-2">Official contact shared during onboarding.</p>
                  </Card>
                )}
                {orderedMembers.map((member) => (
                  <Card key={member.user.email} className="p-4 border border-gray-200">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{member.role}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{member.user.name || member.user.email}</p>
                    <p className="text-xs text-muted-foreground break-all">{member.user.email}</p>
                  </Card>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: "#002449" }}>
                Document Categories
              </h3>
              <Accordion type="multiple" className="space-y-3">
                {DOCUMENT_SECTIONS.map(({ id, title, icon: Icon, description, requirements, documentType, accept }) => {
                  const docInfo = documentHistory.find((doc) => doc.document_type === documentType)
                  const sortedVersions: DocumentVersionDetail[] = docInfo?.versions
                    ? [...docInfo.versions].sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
                    : []
                  const latestVersion = docInfo?.latest_version ?? sortedVersions[0]
                  const latestStatus = docInfo?.latest_status ?? latestVersion?.status
                  const isApproved = isApprovedStatus(latestStatus)
                  const requiresUpload = docInfo?.requires_upload ?? (!latestVersion && !docInfo?.pending_review)
                  const pendingReview = docInfo?.pending_review ?? false
                  const statusLabel = requiresUpload && !latestVersion ? "Awaiting Upload" : formatStatusLabel(latestStatus)
                  const statusVariant = requiresUpload && !latestVersion ? "outline" : resolveStatusVariant(latestStatus)
                  const uploadedAtLabel = latestVersion?.uploaded_at
                    ? timestampFormatter.format(new Date(latestVersion.uploaded_at))
                    : null
                  const rejectionNote = latestVersion?.rejection_reason
                  const uploadDisabled = isApproved

                  return (
                    <AccordionItem key={id} value={id} className="border border-gray-200 rounded-lg">
                      <AccordionTrigger className="px-4 py-3 text-left items-center">
                        <div className="flex flex-1 items-center gap-3">
                          <Icon className="w-5 h-5 text-[#f75700]" />
                          <span className="font-semibold text-sm md:text-base text-gray-900">{title}</span>
                        </div>
                        {isApproved && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Document approved" />
                        )}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-3">{description}</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                            {requirements.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <UploadDocument
                            teamId={activeTeamId}
                            documentType={documentType}
                            label={title}
                            accept={accept}
                            onUploaded={handleUploadComplete}
                            disabled={uploadDisabled}
                            disabledReason={isApproved ? "This document is already approved. Uploading a new file is disabled." : undefined}
                          />
                          <div className="space-y-2 text-xs">
                            {documentsLoading ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" /> Updating status...
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={statusVariant}>{statusLabel}</Badge>
                                {pendingReview && <Badge variant="secondary">Pending Review</Badge>}
                                {!isApproved && requiresUpload && (
                                  <span className="text-muted-foreground">Upload required</span>
                                )}
                                {uploadedAtLabel && <span className="text-muted-foreground">Last update: {uploadedAtLabel}</span>}
                              </div>
                            )}
                            {rejectionNote && !documentsLoading && (
                              <p className="text-xs text-destructive">Rejection note: {rejectionNote}</p>
                            )}
                            {!documentsLoading && sortedVersions.length === 0 && !requiresUpload && (
                              <p className="text-muted-foreground">No previous uploads recorded.</p>
                            )}
                          </div>
                          {!documentsLoading && sortedVersions.length > 0 && (
                            <div className="rounded-lg border border-dashed border-[#002449]/15 bg-white/60">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[70px]">Version</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>File</TableHead>
                                    <TableHead>Uploaded</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sortedVersions.map((version) => {
                                    const versionUploaded = version.uploaded_at
                                      ? timestampFormatter.format(new Date(version.uploaded_at))
                                      : "—"
                                    const versionStatus = formatStatusLabel(version.status)
                                    const variant = resolveStatusVariant(version.status)
                                    const isDownloading = versionDownloadId === version.id

                                    return (
                                      <TableRow key={version.id}>
                                        <TableCell className="font-mono text-xs">{version.version ?? "—"}</TableCell>
                                        <TableCell>
                                          <Badge variant={variant}>{versionStatus}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                          {version.original_filename || "—"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{versionUploaded}</TableCell>
                                        <TableCell className="text-right">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs"
                                            onClick={() => handleVersionDownload(version.id)}
                                            disabled={isDownloading}
                                          >
                                            {isDownloading ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                              "View"
                                            )}
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </section>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

export default function DocumentSubmissionPage() {
  return (
    <Suspense
      fallback={(
        <DashboardShell>
          <div className="flex h-full items-center justify-center py-20">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#f75700]" />
            <span className="text-sm text-muted-foreground">Loading document submission…</span>
          </div>
        </DashboardShell>
      )}
    >
      <DocumentSubmissionContent />
    </Suspense>
  )
}
