"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Check,
  Eye,
  FileArchive,
  FileCheck2,
  FileWarning,
  Filter,
  History,
  Loader2,
  Search,
  ShieldCheck,
  X as XIcon,
} from "lucide-react"

import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  approveDocument,
  getDocumentDashboardOverview,
  getDownloadURL,
  getTeamDocumentHistory,
  rejectDocument,
  type DocumentOverviewItem,
  type DocumentType,
  type TeamDocumentHistoryItem,
} from "@/utils/upload"
import { authService } from "@/lib/auth-service"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface RejectContext {
  versionId: string
  teamName: string
  documentLabel: string
}

type QuickViewFilter = "all" | "pending" | "approved" | "rejected" | "needs_upload"

function formatDocumentType(type?: DocumentType) {
  if (!type) return "Unknown"
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatStatusLabel(status?: string) {
  if (!status) return "Unknown"
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((segment) => (segment ? segment[0].toUpperCase() + segment.slice(1) : segment))
    .join(" ")
}

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed)
}

function formatFileSize(size?: number | null) {
  if (!size || size <= 0) return "—"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = size
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  const precision = value >= 10 || index === 0 ? 0 : 1
  return `${value.toFixed(precision)} ${units[index]}`
}

function statusBadgeClasses(status?: string) {
  switch (status) {
    case "approved":
      return "border-green-500 bg-green-50 text-green-700"
    case "pending":
    case "pending_review":
      return "border-amber-500 bg-amber-50 text-amber-700"
    case "rejected":
    case "changes_requested":
      return "border-destructive/60 bg-destructive/10 text-destructive"
    default:
      return "border-muted text-muted-foreground"
  }
}

export default function DocumentsVerificationPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [documents, setDocuments] = useState<DocumentOverviewItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectContext, setRejectContext] = useState<RejectContext | null>(null)
  const [rejectRemarks, setRejectRemarks] = useState("")
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [quickView, setQuickView] = useState<QuickViewFilter>("pending")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyDoc, setHistoryDoc] = useState<DocumentOverviewItem | null>(null)
  const [historyItem, setHistoryItem] = useState<TeamDocumentHistoryItem | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const loadOverview = useCallback(async () => {
    setError(null)
    setRefreshing(true)
    try {
      const currentUser = authService.getCurrentUser()
      if (!currentUser?.is_admin) {
        setAuthorized(false)
        setDocuments([])
        setLoading(false)
        return
      }

      setAuthorized(true)
      const overview = await getDocumentDashboardOverview()
      setDocuments(overview)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load documents overview."
      setError(message)
      toast({ variant: "destructive", title: "Failed to load", description: message })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const stats = useMemo(() => {
    return documents.reduce(
      (acc, doc) => {
        const statusKey = doc.latest_status || "unknown"
        acc.total += 1
        acc.byStatus[statusKey] = (acc.byStatus[statusKey] ?? 0) + 1
        if (doc.pending_review) acc.pending += 1
        if (doc.requires_upload) acc.needsUpload += 1
        if (statusKey === "approved") acc.approved += 1
        if (statusKey === "rejected") acc.rejected += 1
        return acc
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        needsUpload: 0,
        byStatus: {} as Record<string, number>,
      },
    )
  }, [documents])

  const statusOptions = useMemo(() => {
    return Object.keys(stats.byStatus)
      .filter((status) => status && status !== "unknown")
      .sort((a, b) => a.localeCompare(b))
  }, [stats.byStatus])

  const documentTypes = useMemo(() => {
    const unique = new Set(documents.map((doc) => doc.document_type).filter(Boolean))
    return Array.from(unique).sort((a, b) => formatDocumentType(a).localeCompare(formatDocumentType(b)))
  }, [documents])

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return documents.filter((doc) => {
      const status = doc.latest_status || ""
      const type = doc.document_type || ""

      if (quickView === "pending" && !doc.pending_review) return false
      if (quickView === "approved" && status !== "approved") return false
      if (quickView === "rejected" && status !== "rejected") return false
      if (quickView === "needs_upload" && !doc.requires_upload) return false

      if (statusFilter !== "all" && status !== statusFilter) return false
      if (typeFilter !== "all" && type !== typeFilter) return false

      if (query) {
        const haystack = `${doc.team_name ?? ""} ${doc.team_id} ${formatDocumentType(type)} ${status}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })
  }, [documents, quickView, searchTerm, statusFilter, typeFilter])

  const sortedDocuments = useMemo(() => {
    return filteredDocuments.slice().sort((a, b) => {
      const aPending = a.pending_review ? 1 : 0
      const bPending = b.pending_review ? 1 : 0
      if (bPending !== aPending) return bPending - aPending

      const aTime = a.latest_version?.uploaded_at ? new Date(a.latest_version.uploaded_at).getTime() : 0
      const bTime = b.latest_version?.uploaded_at ? new Date(b.latest_version.uploaded_at).getTime() : 0
      return bTime - aTime
    })
  }, [filteredDocuments])

  const quickViewFilters: Array<{ key: QuickViewFilter; label: string; count: number }> = useMemo(
    () => [
      { key: "pending", label: "Pending review", count: stats.pending },
      { key: "approved", label: "Approved", count: stats.approved },
      { key: "rejected", label: "Rejected", count: stats.rejected },
      { key: "needs_upload", label: "Needs upload", count: stats.needsUpload },
      { key: "all", label: "All documents", count: stats.total },
    ],
    [stats],
  )

  const resetFilters = useCallback(() => {
    setQuickView("all")
    setSearchTerm("")
    setStatusFilter("all")
    setTypeFilter("all")
  }, [])

  const fetchHistory = useCallback(
    async (doc: DocumentOverviewItem) => {
      setHistoryLoading(true)
      setHistoryError(null)
      try {
        const teamHistory = await getTeamDocumentHistory(doc.team_id)
        const match = teamHistory.find((item) => item.document_type === doc.document_type)
        setHistoryItem(match ?? null)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load document history."
        setHistoryError(message)
        toast({ variant: "destructive", title: "History unavailable", description: message })
      } finally {
        setHistoryLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    if (historyOpen && historyDoc) {
      void fetchHistory(historyDoc)
    }
  }, [fetchHistory, historyDoc, historyOpen])

  const handleHistoryOpenChange = useCallback((open: boolean) => {
    setHistoryOpen(open)
    if (!open) {
      setHistoryDoc(null)
      setHistoryItem(null)
      setHistoryError(null)
    }
  }, [])

  const handleDownload = useCallback(
    async (versionId: string) => {
      setDownloadingId(versionId)
      try {
        const { download_url: downloadUrl } = await getDownloadURL(versionId)
        if (typeof window !== "undefined") {
          window.open(downloadUrl, "_blank", "noopener,noreferrer")
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to generate download link."
        toast({ variant: "destructive", title: "Download failed", description: message })
      } finally {
        setDownloadingId(null)
      }
    },
    [toast],
  )

  const handleApprove = useCallback(
    async (versionId: string) => {
      setProcessingId(versionId)
      try {
        await approveDocument(versionId)
        toast({ title: "Document approved", description: "Team has been notified." })
        await loadOverview()
        if (historyOpen && historyDoc) {
          void fetchHistory(historyDoc)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to approve document."
        toast({ variant: "destructive", title: "Action failed", description: message })
      } finally {
        setProcessingId(null)
      }
    },
    [fetchHistory, historyDoc, historyOpen, loadOverview, toast],
  )

  const handleReject = useCallback(async () => {
    if (!rejectContext) return
    const { versionId } = rejectContext
    setProcessingId(versionId)
    try {
      await rejectDocument(versionId, rejectRemarks)
      toast({
        variant: "destructive",
        title: "Document rejected",
        description: rejectRemarks.trim() ? "Remarks shared with the team." : "Team has been notified.",
      })
      setRejectContext(null)
      setRejectRemarks("")
      await loadOverview()
      if (historyOpen && historyDoc) {
        void fetchHistory(historyDoc)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reject document."
      toast({ variant: "destructive", title: "Action failed", description: message })
    } finally {
      setProcessingId(null)
    }
  }, [fetchHistory, historyDoc, historyOpen, loadOverview, rejectContext, rejectRemarks, toast])

  const closeRejectDialog = useCallback((open: boolean) => {
    if (!open) {
      setRejectContext(null)
      setRejectRemarks("")
    }
  }, [])

  const header = (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#002449" }}>
          Documents Verification
        </h1>
        <p className="text-sm text-muted-foreground">
          Review submissions across teams, approve instantly, or request fixes with remarks.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={loadOverview} disabled={refreshing} className="gap-2">
        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Refresh data
      </Button>
    </header>
  )

  if (authorized === false) {
    return (
      <DashboardShell>
        <div className="space-y-8">
          {header}
          <Card className="border border-destructive/30 bg-destructive/5 text-destructive" role="alert">
            <div className="flex items-start gap-3 p-4">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Access restricted</p>
                <p className="text-xs">Only admin users can review documents pending verification.</p>
              </div>
            </div>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  const historyVersions = historyItem?.versions ?? []

  return (
    <DashboardShell>
      <div className="space-y-8">
        {header}

        {error && (
          <Card className="border border-destructive/30 bg-destructive/5 text-destructive" role="alert">
            <div className="flex items-start gap-3 p-4">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">{error}</p>
                <p className="text-xs">Try refreshing or check your network connection.</p>
              </div>
            </div>
          </Card>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending review</p>
                <p className="text-2xl font-bold" style={{ color: "#002449" }}>{stats.pending}</p>
              </div>
              <FileCheck2 className="h-8 w-8 text-[#002449]" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Documents awaiting an approval or rejection decision.</p>
          </Card>
          <Card className="p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Need upload</p>
                <p className="text-2xl font-bold" style={{ color: "#002449" }}>{stats.needsUpload}</p>
              </div>
              <FileWarning className="h-8 w-8 text-[#002449]" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Teams still preparing their first submission.</p>
          </Card>
          <Card className="p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approved so far</p>
                <p className="text-2xl font-bold" style={{ color: "#002449" }}>{stats.approved}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-[#002449]" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Successful reviews that have been cleared by admins.</p>
          </Card>
          <Card className="p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total monitored</p>
                <p className="text-2xl font-bold" style={{ color: "#002449" }}>{stats.total}</p>
              </div>
              <FileArchive className="h-8 w-8 text-[#002449]" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">All required documents tracked across registered teams.</p>
          </Card>
        </section>

        <section className="space-y-4 rounded-md border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {quickViewFilters.map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant={quickView === filter.key ? "default" : "outline"}
                className="gap-2"
                onClick={() => setQuickView(filter.key)}
              >
                {filter.key === "pending" && <FileCheck2 className="h-4 w-4" aria-hidden="true" />}
                {filter.key === "approved" && <Check className="h-4 w-4" aria-hidden="true" />}
                {filter.key === "rejected" && <XIcon className="h-4 w-4" aria-hidden="true" />}
                {filter.key === "needs_upload" && <FileWarning className="h-4 w-4" aria-hidden="true" />}
                {filter.key === "all" && <History className="h-4 w-4" aria-hidden="true" />}
                <span className="whitespace-nowrap">{filter.label}</span>
                <Badge variant="secondary" className="ml-1 h-5 min-w-[2rem] justify-center">
                  {filter.count}
                </Badge>
              </Button>
            ))}
          </div>

          <Separator />

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by team name, team ID, or document type"
                className="pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Filter by document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All documents</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatDocumentType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              className="gap-2 md:ml-auto"
              onClick={resetFilters}
              disabled={quickView === "all" && !searchTerm && statusFilter === "all" && typeFilter === "all"}
            >
              <Filter className="h-4 w-4" aria-hidden="true" /> Reset filters
            </Button>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading documents overview…
            </div>
          </div>
        ) : sortedDocuments.length ? (
          <Card className="border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Team</TableHead>
                  <TableHead className="min-w-[180px]">Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead>Last uploaded</TableHead>
                  <TableHead>Latest decision</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDocuments.map((doc) => {
                  const version = doc.latest_version
                  const versionId = version?.id || ""
                  const isBusy = processingId === versionId
                  const statusLabel = formatStatusLabel(version?.status || doc.latest_status)
                  const decisionText = (() => {
                    if (!version) {
                      return doc.requires_upload ? "Waiting for first upload" : "—"
                    }
                    if (doc.latest_status === "approved") {
                      return `Approved ${formatDateTime(version.approved_at)}`
                    }
                    if (doc.latest_status === "rejected") {
                      return version.rejection_reason
                        ? `Rejected • ${version.rejection_reason}`
                        : `Rejected ${formatDateTime(version.approved_at || version.uploaded_at)}`
                    }
                    if (doc.pending_review) {
                      return "Awaiting admin decision"
                    }
                    return "—"
                  })()
                  const canTakeAction = Boolean(doc.pending_review && versionId)

                  return (
                    <TableRow key={`${doc.team_id}-${doc.document_type}`}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold" style={{ color: "#002449" }}>
                            {doc.team_name || doc.team_id}
                          </span>
                          <span className="text-xs text-muted-foreground">{doc.team_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-[#002449]">
                            {formatDocumentType(doc.document_type)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Version {version?.version ?? doc.versions_count ?? 0}
                          </span>
                          {doc.requires_upload && (
                            <span className="text-xs text-destructive">Awaiting first upload</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusBadgeClasses(version?.status || doc.latest_status)}`}
                        >
                          {statusLabel}
                        </Badge>
                        {doc.pending_review && (
                          <Badge variant="secondary" className="ml-2 text-xs uppercase">
                            Pending review
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.versions_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(version?.uploaded_at)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{decisionText}</TableCell>
                      <TableCell className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => versionId && void handleDownload(versionId)}
                          disabled={!versionId || downloadingId === versionId || isBusy}
                        >
                          {downloadingId === versionId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => versionId && void handleApprove(versionId)}
                          disabled={!canTakeAction || isBusy}
                          className="bg-[#007367] hover:bg-[#005a52]"
                        >
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/60 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            versionId &&
                            setRejectContext({
                              versionId,
                              teamName: doc.team_name || doc.team_id,
                              documentLabel: formatDocumentType(doc.document_type),
                            })
                          }
                          disabled={!canTakeAction || isBusy}
                        >
                          <XIcon className="h-4 w-4" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#002449] hover:bg-[#002449]/10"
                          onClick={() => {
                            setHistoryDoc(doc)
                            setHistoryOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" /> View history
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="border border-dashed border-muted/50">
            <div className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
              <History className="h-8 w-8" />
              <p className="text-sm font-medium">
                {documents.length
                  ? "No documents match the current filters. Try adjusting them."
                  : "No documents are being tracked yet."}
              </p>
              {documents.length ? (
                <Button size="sm" variant="outline" onClick={resetFilters} className="gap-2">
                  <Filter className="h-4 w-4" /> Reset filters
                </Button>
              ) : null}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={Boolean(rejectContext)} onOpenChange={closeRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject document</DialogTitle>
            <DialogDescription>
              Provide an optional note for <strong>{rejectContext?.teamName}</strong> about why <strong>{rejectContext?.documentLabel}</strong> is being sent back.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="reject-remarks" className="text-xs font-semibold text-muted-foreground">
              Remarks (optional)
            </Label>
            <Textarea
              id="reject-remarks"
              placeholder="Highlight missing details or required fixes for the team."
              value={rejectRemarks}
              onChange={(event) => setRejectRemarks(event.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => closeRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleReject()}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={processingId === rejectContext?.versionId}
            >
              {processingId === rejectContext?.versionId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XIcon className="h-4 w-4" />
              )}
              Reject document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={historyOpen} onOpenChange={handleHistoryOpenChange}>
        <SheetContent side="right" className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold" style={{ color: "#002449" }}>
              Document history
            </SheetTitle>
            <SheetDescription>
              {historyDoc ? (
                <div className="space-y-1 text-left text-sm">
                  <p className="font-medium">{historyDoc.team_name ?? historyDoc.team_id}</p>
                  <p className="text-muted-foreground">{historyDoc.team_id}</p>
                  <p className="text-muted-foreground">{formatDocumentType(historyDoc.document_type)}</p>
                </div>
              ) : (
                "Select a document to inspect its past submissions."
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {historyLoading ? (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : historyError ? (
              <Card className="border border-destructive/30 bg-destructive/5 text-destructive">
                <div className="flex items-start gap-3 p-4">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">{historyError}</p>
                    <p className="text-xs">Try closing and reopening the history panel.</p>
                  </div>
                </div>
              </Card>
            ) : historyItem ? (
              <>
                <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/40 p-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Latest status</span>
                    <p className="font-medium">{formatStatusLabel(historyItem.latest_status)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Versions submitted</span>
                    <p className="font-medium">{historyVersions.length}</p>
                  </div>
                  {historyItem.pending_review && (
                    <div>
                      <span className="text-muted-foreground">Action required</span>
                      <p className="font-medium text-amber-700">Pending admin decision</p>
                    </div>
                  )}
                  {historyItem.requires_upload && (
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <p className="font-medium text-destructive">Awaiting initial upload</p>
                    </div>
                  )}
                </div>

                <ScrollArea className="h-[60vh] rounded-md border border-border">
                  <div className="space-y-3 p-4 pr-6">
                    {historyVersions
                      .slice()
                      .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
                      .map((version) => {
                        const versionStatus = formatStatusLabel(version.status)
                        return (
                          <Card key={version.id} className="border border-border/60">
                            <div className="flex flex-col gap-3 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold" style={{ color: "#002449" }}>
                                    Version {version.version}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Uploaded {formatDateTime(version.uploaded_at)}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${statusBadgeClasses(version.status)}`}
                                >
                                  {versionStatus}
                                </Badge>
                              </div>
                              <div className="grid gap-2 text-xs sm:grid-cols-2">
                                <div>
                                  <span className="text-muted-foreground">File name</span>
                                  <p className="font-medium">{version.original_filename ?? "—"}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">File size</span>
                                  <p className="font-medium">{formatFileSize(version.size_bytes)}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Approved on</span>
                                  <p className="font-medium">{formatDateTime(version.approved_at)}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Approved by</span>
                                  <p className="font-medium">{version.approved_by ?? "—"}</p>
                                </div>
                              </div>
                              {version.rejection_reason ? (
                                <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                                  {version.rejection_reason}
                                </p>
                              ) : null}
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => version.id && void handleDownload(version.id)}
                                  disabled={downloadingId === version.id}
                                  className="gap-2"
                                >
                                  {downloadingId === version.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="h-4 w-4" />
                                  )}
                                  Download
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <History className="mr-2 h-4 w-4" /> Select a document row to view detailed version history.
              </div>
            )}
          </div>

          <SheetFooter>
            <div className="text-xs text-muted-foreground">
              Version history reflects submissions received from the team along with admin decisions.
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </DashboardShell>
  )
}
