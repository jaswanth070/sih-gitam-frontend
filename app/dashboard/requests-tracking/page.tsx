"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Loader2,
  RefreshCcw,
  Search,
  Eye,
} from "lucide-react"

import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { RequestCategoryBadge } from "@/components/request-category-badge"
import { RequestStatusBadge } from "@/components/request-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { authService, type AdminTeamSummary } from "@/lib/auth-service"
import { requestsService, type RequestData, type RequestsListResponse } from "@/lib/requests-service"

const REQUESTS_ORDERING = "-created_at"

function formatDate(timestamp?: string | null) {
  if (!timestamp) return "—"
  try {
    const value = new Date(timestamp)
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(value)
  } catch (error) {
    return "—"
  }
}

function derivePageSize(response: RequestsListResponse, fallback: number) {
  if (response.results?.length) return response.results.length
  return fallback
}

export default function RequestsTrackingPage() {
  const { toast } = useToast()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [teams, setTeams] = useState<AdminTeamSummary[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [teamError, setTeamError] = useState<string | null>(null)

  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")

  const [requestsPage, setRequestsPage] = useState(1)
  const [requests, setRequests] = useState<RequestData[]>([])
  const [requestsMeta, setRequestsMeta] = useState<{ count: number; next: string | null; previous: string | null }>(
    { count: 0, next: null, previous: null },
  )
  const [pageSize, setPageSize] = useState(10)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestsError, setRequestsError] = useState<string | null>(null)

  const loadTeams = useCallback(async () => {
    setLoadingTeams(true)
    setTeamError(null)
    try {
      const currentUser = authService.getCurrentUser()
      if (!currentUser?.is_admin) {
        setAuthorized(false)
        setTeams([])
        return
      }

      setAuthorized(true)
      const data = await authService.getAdminTeams()
      setTeams(data)
      setSelectedTeamId((previous) => (previous && data.some((team) => team.id === previous) ? previous : ""))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load teams."
      setTeamError(message)
      toast({ variant: "destructive", title: "Failed to load teams", description: message })
    } finally {
      setLoadingTeams(false)
    }
  }, [toast])

  const loadRequests = useCallback(
    async (teamId: string, page = 1, search = "") => {
      if (!teamId) {
        setRequests([])
        setRequestsMeta({ count: 0, next: null, previous: null })
        return
      }

      setRequestsLoading(true)
      setRequestsError(null)
      try {
        const response = await requestsService.listTeamRequests(teamId, {
          page,
          ordering: REQUESTS_ORDERING,
          search: search.trim() ? search.trim() : undefined,
        })
        setRequests(response.results)
        setRequestsMeta({ count: response.count, next: response.next, previous: response.previous })
        setPageSize((prev) => derivePageSize(response, prev))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load requests."
        setRequestsError(message)
        toast({ variant: "destructive", title: "Failed to load requests", description: message })
      } finally {
        setRequestsLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    void loadTeams()
  }, [loadTeams])

  useEffect(() => {
    setRequestsPage(1)
    if (selectedTeamId) {
      void loadRequests(selectedTeamId, 1, searchTerm)
    } else {
      setRequests([])
      setRequestsMeta({ count: 0, next: null, previous: null })
    }
  }, [selectedTeamId, loadRequests, searchTerm])

  const teamOptions = useMemo(
    () => teams.map((team) => ({ id: team.id, label: team.name, subtitle: team.institution })),
    [teams],
  )

  const selectedTeam = useMemo(
    () => (selectedTeamId ? teams.find((team) => team.id === selectedTeamId) ?? null : null),
    [selectedTeamId, teams],
  )

  const totalPages = useMemo(() => {
    if (!requestsMeta.count) return 1
    return Math.max(1, Math.ceil(requestsMeta.count / Math.max(pageSize, 1)))
  }, [pageSize, requestsMeta.count])

  const handlePagination = useCallback(
    (direction: "previous" | "next") => {
      setRequestsPage((previous) => {
        const next = direction === "previous" ? previous - 1 : previous + 1
        const clamped = Math.min(Math.max(next, 1), totalPages)
        if (clamped !== previous && selectedTeamId) {
          void loadRequests(selectedTeamId, clamped, searchTerm)
        }
        return clamped
      })
    },
    [loadRequests, selectedTeamId, totalPages, searchTerm],
  )

  const resetFilters = useCallback(() => {
    setRequestsPage(1)
    setSearchTerm("")
  }, [])

  const header = (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#002449" }}>
          Requests Tracking
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor every supply and fabrication request raised by teams and keep tabs on their latest status updates.
        </p>
      </div>
      <div className="flex flex-col gap-2 md:items-end">
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => selectedTeamId && void loadRequests(selectedTeamId, requestsPage, searchTerm)}
          disabled={!selectedTeamId || requestsLoading}
        >
          {requestsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Refresh
        </Button>
        <p className="text-xs text-muted-foreground">
          {requestsMeta.count
            ? `${requestsMeta.count} request${requestsMeta.count === 1 ? "" : "s"} tracked`
            : "No requests yet"}
        </p>
      </div>
    </header>
  )

  if (authorized === false) {
    return (
      <DashboardShell>
        <div className="space-y-8">
          {header}
          <Card className="border border-destructive/30 bg-destructive/5 text-destructive">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4" /> Access restricted
              </CardTitle>
              <CardDescription className="text-xs text-destructive/90">
                Only admin users can review team-wide request history.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        {header}

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold" style={{ color: "#002449" }}>
              Select team
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Choose a team to view every request they raised along with status, notes, and timestamps.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2 md:w-64">
              <Select
                value={selectedTeamId || undefined}
                onValueChange={(value) => setSelectedTeamId(value)}
                disabled={loadingTeams || !teams.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingTeams ? "Loading teams…" : "Pick a team"} />
                </SelectTrigger>
                <SelectContent>
                  {teamOptions.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex flex-col text-sm">
                        <span className="font-semibold" style={{ color: "#002449" }}>
                          {team.label}
                        </span>
                       
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{teams.length} team{teams.length === 1 ? "" : "s"} available.</p>
            </div>

            <div className="flex flex-col gap-2 md:flex-1">
              <label htmlFor="requests-search" className="text-xs font-semibold text-muted-foreground">
                Search within requests
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="requests-search"
                  placeholder="Search by item, note, or description"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  disabled={!selectedTeamId}
                  className="pl-10"
                />
              </div>
              {searchTerm && (
                <Button variant="link" size="sm" className="self-start px-0" onClick={resetFilters}>
                  Clear search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {teamError && (
          <Card className="border border-destructive/30 bg-destructive/5 text-destructive">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4" /> Unable to load teams
              </CardTitle>
              <CardDescription className="text-xs text-destructive/90">{teamError}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {requestsError && (
          <Card className="border border-destructive/30 bg-destructive/5 text-destructive">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4" /> {requestsError}
              </CardTitle>
              <CardDescription className="text-xs text-destructive/90">
                Try refreshing the list or adjust your filters.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {requestsLoading ? (
          <div className="flex min-h-[35vh] items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Pulling the latest requests…
            </div>
          </div>
        ) : !selectedTeamId ? (
          <Card className="border border-dashed border-muted/50">
            <CardHeader className="pb-5 text-center">
              <CardTitle className="flex flex-col items-center gap-2 text-base font-semibold" style={{ color: "#002449" }}>
                <ClipboardList className="h-6 w-6 text-muted-foreground" /> Select a team to begin
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pick a team above to review every request and stay on top of their requirements.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : requests.length ? (
          <Card className="border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[110px]">Request</TableHead>
                  <TableHead className="min-w-[120px]">Category</TableHead>
                  <TableHead className="min-w-[130px]">Status</TableHead>
                  <TableHead className="min-w-[160px]">Submitted</TableHead>
                  <TableHead className="min-w-[180px]">Notes</TableHead>
                  <TableHead className="min-w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-[#002449]">#{request.id}</span>
                        <span className="text-xs text-muted-foreground">{selectedTeam?.team_id ?? request.team_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RequestCategoryBadge category={request.category} />
                    </TableCell>
                    <TableCell>
                      <RequestStatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-4 w-4" /> {formatDate(request.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {request.description || request.notes ? (
                          <span className="line-clamp-3 leading-relaxed">{request.description || request.notes}</span>
                        ) : (
                          <span>No notes provided.</span>
                        )}
                        {request.remarks && (
                          <Badge variant="outline" className="w-fit text-[10px] text-destructive border-destructive/40">
                            Remarks: {request.remarks}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="h-4 w-4" /> {formatDate(request.updated_at)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 text-xs"
                          asChild
                        >
                          <a href={`/my-requests/${request.id}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" /> View request
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-2 border-t border-gray-200 p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div>
                Page {requestsPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePagination("previous")}
                  disabled={requestsPage <= 1 || requestsLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePagination("next")}
                  disabled={requestsPage >= totalPages || requestsLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border border-dashed border-muted/50">
            <CardHeader className="pb-5 text-center">
              <CardTitle className="flex flex-col items-center gap-2 text-base font-semibold" style={{ color: "#002449" }}>
                <ClipboardList className="h-6 w-6 text-muted-foreground" /> No requests yet
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                This team has not raised any requests. Once they do, entries will appear here automatically.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
