"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Building2,
  Check,
  Download as DownloadIcon,
  Layers,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Users,
  X as XIcon,
} from "lucide-react"

import { authService, type AdminTeamSummary } from "@/lib/auth-service"
import { requestsService, type RequestData } from "@/lib/requests-service"
import {
  approveDocument,
  getDocumentDashboardOverview,
  getDownloadURL,
  rejectDocument,
  type DocumentOverviewItem,
  type DocumentType,
} from "@/utils/upload"
import { useToast } from "@/components/ui/use-toast"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AdminDashboardProps {
  user: Record<string, any> | null
}

interface QueueSummary {
  results: RequestData[]
  count: number
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [teams, setTeams] = useState<AdminTeamSummary[]>([])
  const [queue, setQueue] = useState<QueueSummary>({ results: [], count: 0 })
  const [documents, setDocuments] = useState<DocumentOverviewItem[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [docActionId, setDocActionId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setErrors([])
    setRefreshing(true)
    try {
      const [teamsResult, queueResult, documentsResult] = await Promise.allSettled([
        authService.getAdminTeams(),
        requestsService.getFilteredQueueSnapshot({ include_positions: true, page: 1, page_size: 12 }),
        getDocumentDashboardOverview(),
      ])

      if (teamsResult.status === "fulfilled") {
        setTeams(teamsResult.value || [])
      } else {
        console.error("Admin teams load failed", teamsResult.reason)
        setErrors((prev) => [...prev, "Unable to load teams."])
      }

      if (queueResult.status === "fulfilled") {
        setQueue({ results: queueResult.value.results || [], count: queueResult.value.count || 0 })
      } else {
        console.error("Queue snapshot load failed", queueResult.reason)
        setErrors((prev) => [...prev, "Unable to load virtual queue data."])
      }

      if (documentsResult.status === "fulfilled") {
        setDocuments(documentsResult.value || [])
      } else {
        console.error("Pending documents load failed", documentsResult.reason)
        setErrors((prev) => [...prev, "Unable to load pending documents."])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const totalMembers = useMemo(() => {
    return teams.reduce((acc, team) => acc + (team.members?.length || 0), 0)
  }, [teams])

  const queuePreview = useMemo(() => queue.results.slice(0, 6), [queue.results])
  const pendingDocuments = useMemo(() => documents.filter((doc) => doc.pending_review), [documents])
  const actionablePendingDocuments = useMemo(
    () => pendingDocuments.filter((doc) => doc.latest_version?.id),
    [pendingDocuments],
  )
  const documentsNeedingUpload = useMemo(
    () => documents.filter((doc) => doc.requires_upload),
    [documents],
  )
  const requiresUploadCount = documentsNeedingUpload.length

  const formatDocumentType = useCallback((type?: DocumentType) => {
    if (!type) return "Unknown"
    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }, [])

  const formatStatusLabel = useCallback((status?: string) => {
    if (!status) return "Unknown"
    return status
      .replace(/_/g, " ")
      .split(" ")
      .map((segment) => (segment ? segment[0].toUpperCase() + segment.slice(1) : segment))
      .join(" ")
  }, [])

  const resolveStatusVariant = useCallback((status?: string): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return "outline"
    const normalized = status.toLowerCase()
    if (["approved", "verified", "accepted"].includes(normalized)) return "default"
    if (["rejected", "declined", "invalid"].includes(normalized)) return "destructive"
    if (["pending", "submitted", "in_review", "processing", "awaiting_review", "pending_review"].includes(normalized)) {
      return "secondary"
    }
    return "outline"
  }, [])

  const handleDocumentDecision = async (versionId: string, action: "approve" | "reject") => {
    setDocActionId(versionId)
    try {
      if (action === "approve") {
        await approveDocument(versionId)
        toast({ title: "Document approved", description: "The team has been notified about the approval." })
      } else {
        await rejectDocument(versionId)
        toast({
          variant: "destructive",
          title: "Document rejected",
          description: "The team has been notified to re-upload the document.",
        })
      }
      await loadDashboard()
    } catch (error) {
      console.error(`Document ${action} failed`, error)
      const message = error instanceof Error ? error.message : `Unable to ${action} document.`
      toast({ variant: "destructive", title: "Action failed", description: message })
    } finally {
      setDocActionId(null)
    }
  }

  const handleDownload = async (versionId: string) => {
    setDownloadingId(versionId)
    try {
      const { download_url } = await getDownloadURL(versionId)
      if (typeof window !== "undefined") {
        window.open(download_url, "_blank", "noopener,noreferrer")
      }
    } catch (error) {
      console.error("Download link error", error)
      const message = error instanceof Error ? error.message : "Unable to fetch download link."
      toast({ variant: "destructive", title: "Download failed", description: message })
    } finally {
      setDownloadingId(null)
    }
  }

  const pageTitle = useMemo(() => {
    const name = user?.name?.split(" ")[0] || "Admin"
    return `Welcome, ${name}`
  }, [user?.name])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2" style={{ color: "#002449" }}>
            <ShieldCheck className="h-6 w-6 text-[#002449]" /> {pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground">Comprehensive view of teams, requests, and document verifications.</p>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={loadDashboard} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Refresh data
        </Button>
      </header>

      {(loading || errors.length > 0) && (
        <div className="space-y-3">
          {errors.map((error, idx) => (
            <Card key={idx} className="p-4 border border-destructive/20 bg-destructive/5 flex items-start gap-3" role="alert">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </Card>
          ))}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Teams</p>
              <p className="text-2xl font-bold" style={{ color: "#002449" }}>{teams.length}</p>
            </div>
            <Users className="h-8 w-8 text-[#002449]" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Aggregated across all POCs. {totalMembers} participants tracked.</p>
          <Button asChild variant="link" className="px-0 text-xs text-[#002449]">
            <Link href="/dashboard">Manage teams</Link>
          </Button>
        </Card>
        <Card className="p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Virtual Queue</p>
              <p className="text-2xl font-bold" style={{ color: "#002449" }}>{queue.count}</p>
            </div>
            <Layers className="h-8 w-8 text-[#002449]" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Requests awaiting processing across all categories.</p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/queue">View queue</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/requests">All requests</Link>
            </Button>
          </div>
        </Card>
        <Card className="p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending Documents</p>
              <p className="text-2xl font-bold" style={{ color: "#002449" }}>{pendingDocuments.length}</p>
            </div>
            <FileStackIcon />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Awaiting verification before disbursements and onboarding.
            {requiresUploadCount > 0 &&
              ` ${requiresUploadCount} document${requiresUploadCount === 1 ? " requires" : "s require"} an initial upload.`}
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "#002449" }}>All Teams</h2>
          <Badge variant="secondary">{teams.length} teams</Badge>
        </div>
        <Card className="border border-gray-200">
          {loading && teams.length === 0 ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#002449]" />
            </div>
          ) : teams.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No teams available.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Problem Statement</TableHead>
                  <TableHead>POC</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => {
                  const leader = team.members?.find((member) => member.role?.toLowerCase().includes("leader"))
                  const pocName = team.poc?.name || team.poc?.email || "-"
                  const psLabel = team.problem_statement?.id
                    ? `${team.problem_statement.id}${team.problem_statement.title ? ` · ${team.problem_statement.title}` : ""}`
                    : "Not assigned"

                  return (
                    <TableRow key={team.id} className="align-top">
                      <TableCell className="font-medium" style={{ color: "#002449" }}>{team.name}</TableCell>
                      <TableCell className="max-w-[220px] truncate" title={team.institution}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{team.institution}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[260px]">
                        {psLabel}
                      </TableCell>
                      <TableCell className="text-xs">
                        {pocName}
                        {team.poc?.email && <div className="text-muted-foreground">{team.poc.email}</div>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {leader?.user?.name || leader?.user?.email || "-"}
                        {leader?.user?.email && <div className="text-muted-foreground">{leader.user.email}</div>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {team.members?.length ?? 0}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableCaption>Snapshot of every registered team under the current cohort.</TableCaption>
            </Table>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "#002449" }}>Virtual Queue Overview</h2>
          <Badge variant="outline">{queue.count} total</Badge>
        </div>
        <Card className="border border-gray-200">
          {loading && queuePreview.length === 0 ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#002449]" />
            </div>
          ) : queuePreview.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Queue is currently empty.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queuePreview.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium" style={{ color: "#002449" }}>{req.team_name || req.team_id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{req.category}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={req.status === "Submitted" ? "secondary" : "outline"}>{req.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Showing latest submissions. Visit the queue page for full controls.</TableCaption>
            </Table>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "#002449" }}>Pending Document Verification</h2>
          <Badge variant="outline">{pendingDocuments.length} awaiting review</Badge>
        </div>
        <Card className="border border-gray-200">
          {loading && documents.length === 0 ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#002449]" />
            </div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No documents need attention right now.</div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionablePendingDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        No documents awaiting review. Monitor the upload reminders below.
                      </TableCell>
                    </TableRow>
                  ) : (
                    actionablePendingDocuments.map((doc) => {
                      const latestVersion = doc.latest_version
                      const uploadedAt = latestVersion?.uploaded_at
                        ? new Date(latestVersion.uploaded_at).toLocaleString()
                        : "—"
                      const versionId = latestVersion?.id || doc.document_id || ""
                      const isProcessing = docActionId === versionId
                      const isDownloading = downloadingId === versionId
                      const statusLabel = formatStatusLabel(doc.latest_status)
                      const statusVariant = resolveStatusVariant(doc.latest_status)

                      return (
                        <TableRow key={versionId || `${doc.team_id}-${doc.document_type}`}>
                          <TableCell>
                            <div className="font-medium" style={{ color: "#002449" }}>{doc.team_name || doc.team_id}</div>
                            <div className="text-xs text-muted-foreground">Version: {latestVersion?.version ?? "—"}</div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDocumentType(doc.document_type)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{uploadedAt}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => handleDownload(versionId)}
                                disabled={isDownloading || isProcessing}
                              >
                                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadIcon className="h-4 w-4" />}
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-xs"
                                onClick={() => handleDocumentDecision(versionId, "approve")}
                                disabled={isProcessing}
                              >
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs"
                                onClick={() => handleDocumentDecision(versionId, "reject")}
                                disabled={isProcessing}
                              >
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XIcon className="h-4 w-4" />}
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
                <TableCaption>Use approve or reject to notify teams instantly.</TableCaption>
              </Table>
              {requiresUploadCount > 0 && (
                <div className="rounded-md border border-dashed border-[#002449]/30 bg-[#002449]/5 p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm font-medium" style={{ color: "#002449" }}>
                      Awaiting initial upload ({requiresUploadCount})
                    </p>
                    <span className="text-xs text-muted-foreground">
                      Share reminders with POCs so teams can submit the missing files.
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {documentsNeedingUpload.slice(0, 6).map((doc) => (
                      <div
                        key={`${doc.team_id}-${doc.document_type}`}
                        className="rounded-lg border border-[#002449]/20 bg-white px-3 py-2 text-xs text-muted-foreground"
                      >
                        <div className="font-medium text-[#002449]">{doc.team_name || doc.team_id}</div>
                        <div>{formatDocumentType(doc.document_type)}</div>
                      </div>
                    ))}
                  </div>
                  {documentsNeedingUpload.length > 6 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      And {documentsNeedingUpload.length - 6} more document
                      {documentsNeedingUpload.length - 6 === 1 ? "" : "s"} waiting for an upload.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}

function FileStackIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-[#002449]"
    >
      <path
        d="M6 3h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 7h3m-3 4h6m-6 4h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default AdminDashboard
