"use client"

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Layers,
  Mail,
  Phone,
  ShieldCheck,
  User2,
  UserCheck,
  Users,
} from "lucide-react"

import { authService, type TeamDetails, type TeamContact } from "@/lib/auth-service"
import { getStoredPOCTeamDetail } from "@/lib/session-store"
import { requestsService, type RequestData } from "@/lib/requests-service"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { RequestProgress } from "@/components/requests/request-progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatusChangeModal } from "@/components/modals/status-change-modal"

const ACTIVE_REQUEST_STATUSES = new Set(["Submitted", "Processing"])

export default function POCTeamDetailsPage() {
  const params = useParams()
  const teamRouteId = params.id as string

  const cachedTeamDetail = getStoredPOCTeamDetail(teamRouteId) ?? null
  const [team, setTeam] = useState<TeamDetails | null>(cachedTeamDetail)
  const [requests, setRequests] = useState<RequestData[]>([])
  const [teamError, setTeamError] = useState<string | null>(null)
  const [requestsError, setRequestsError] = useState<string | null>(null)
  const [loadingTeam, setLoadingTeam] = useState<boolean>(!cachedTeamDetail)
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    request: RequestData
    nextStatus: string
  } | null>(null)
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null)

  const timestampFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [],
  )

  useEffect(() => {
    if (!teamRouteId) return

    let cancelled = false
    const fetchTeamDetails = async () => {
      if (!getStoredPOCTeamDetail(teamRouteId)) {
        setLoadingTeam(true)
      }
      setTeamError(null)
      try {
        const teamData = await authService.getPOCTeamDetail(teamRouteId)
        if (!cancelled) {
          setTeam(teamData)
        }
      } catch (err) {
        console.error("[team] Failed to load team details", err)
        const message = err instanceof Error ? err.message : "Failed to load team details"
        if (!cancelled) {
          setTeamError(message)
        }
      } finally {
        if (!cancelled) {
          setLoadingTeam(false)
        }
      }
    }

    fetchTeamDetails()
    return () => {
      cancelled = true
    }
  }, [teamRouteId])

  const teamIdentifiers = useMemo(() => {
    const ids = new Set<string>()
    if (teamRouteId) ids.add(String(teamRouteId))
    if (team?.id) ids.add(String(team.id))
    if (team?.team_id) ids.add(String(team.team_id))
    return Array.from(ids)
  }, [team?.id, team?.team_id, teamRouteId])

  useEffect(() => {
    const candidates = team ? teamIdentifiers : teamRouteId ? [teamRouteId] : []
    if (candidates.length === 0) return

    let cancelled = false

    const fetchRequests = async () => {
      setRequestsError(null)
      let lastError: Error | null = null

      for (const candidate of candidates) {
        if (!candidate) continue
        try {
          const response = await requestsService.listTeamRequests(candidate, {
            ordering: "created_at",
            page_size: 100,
          })
          if (cancelled) return
          const ordered = [...response.results].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          )
          setRequests(ordered)
          return
        } catch (err) {
          lastError = err instanceof Error ? err : new Error("Unable to load team requests")
        }
      }

      if (!cancelled && lastError) {
        console.error("[team] Error fetching team requests snapshot", lastError)
        setRequestsError(lastError.message)
      }
    }

    fetchRequests()
    const interval = setInterval(fetchRequests, 300000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [team, teamIdentifiers, teamRouteId])

  const totalMembers = useMemo(() => team?.members?.length ?? 0, [team?.members])
  const leader = useMemo(
    () => team?.members?.find((member) => member.role?.toLowerCase().includes("leader")),
    [team?.members],
  )
  const mentors = useMemo(() => {
    const list: TeamContact[] = []
    if (Array.isArray(team?.mentors)) {
      team?.mentors.forEach((mentor) => {
        if (mentor && !list.find((existing) => existing.id === mentor.id)) {
          list.push(mentor)
        }
      })
    }
    const fallbacks = [team?.faculty_mentor, team?.faculty_mentor_1, team?.faculty_mentor_2]
    fallbacks.forEach((mentor) => {
      if (mentor && !list.find((existing) => existing.id === mentor.id)) {
        list.push(mentor)
      }
    })
    return list
  }, [team?.faculty_mentor, team?.faculty_mentor_1, team?.faculty_mentor_2, team?.mentors])

  const activeRequests = useMemo(
    () => requests.filter((request) => ACTIVE_REQUEST_STATUSES.has(request.status)).length,
    [requests],
  )
  const issuedRequests = useMemo(
    () => requests.filter((request) => request.status === "Issued").length,
    [requests],
  )
  const rejectedRequests = useMemo(
    () => requests.filter((request) => request.status === "Cannot be Processed").length,
    [requests],
  )

  const latestUpdate = useMemo(() => {
    if (requests.length === 0) return null
    const latest = requests.reduce((acc, request) => {
      const updatedAt = new Date(request.updated_at).getTime()
      return updatedAt > acc ? updatedAt : acc
    }, 0)
    return latest ? new Date(latest) : null
  }, [requests])

  const shouldCollectRemarks = useCallback((currentStatus: string, nextStatus: string) => {
    if (nextStatus === "Cannot be Processed") return true
    return currentStatus === "Processing" && nextStatus === "Issued"
  }, [])

  const handleStatusChange = useCallback(
    async (requestId: number, newStatus: string, remarks?: string) => {
      setUpdatingRequestId(requestId)
      const noteToSend = `Status changed to ${newStatus}`

      try {
        const updated = await requestsService.changeRequestStatus(requestId, newStatus, noteToSend, remarks)
        setRequests((prev) => prev.map((request) => (request.id === updated.id ? updated : request)))
        setRequestsError(null)
        setPendingStatusChange(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update request status"
        setRequestsError(message)
      } finally {
        setUpdatingRequestId(null)
      }
    },
    [],
  )

  const initiateStatusChange = useCallback(
    (request: RequestData, newStatus: string) => {
      if (shouldCollectRemarks(request.status, newStatus)) {
        setPendingStatusChange({ request, nextStatus: newStatus })
        return
      }

      void handleStatusChange(request.id, newStatus)
    },
    [handleStatusChange, shouldCollectRemarks],
  )

  const goToDocumentSubmissionHref = useMemo(() => {
    if (!team) return "#"
    const params = new URLSearchParams()
    if (team.id) params.set("teamId", team.id)
    if (team.team_id) params.set("teamCode", team.team_id)
    return `/poc/document-submission?${params.toString()}`
  }, [team])

  return (
    <>
      <DashboardShell>
        <div className="space-y-8">
        {teamError && (
          <Card className="border border-destructive/30 bg-destructive/10 text-destructive">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4" /> Unable to load team details
              </CardTitle>
              <CardDescription className="text-xs text-destructive/90">{teamError}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {loadingTeam ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-muted border-t-[#f75700] rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground font-medium">Fetching the latest team profile…</p>
            </div>
          </div>
        ) : team ? (
          <>
            <section className="rounded-2xl border border-[#002449]/15 bg-gradient-to-br from-[#002449] via-[#012e66] to-[#00152d] text-white shadow-lg">
              <div className="px-6 py-8 md:px-10 md:py-10 space-y-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-4 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
                      <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
                        Team Code • {team.team_id ?? "—"}
                      </Badge>
                      {team.problem_statement?.id && (
                        <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
                          Problem Statement • {team.problem_statement.id}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{team.name}</h1>
                      <p className="flex items-center gap-2 text-sm text-white/80">
                        <Building2 className="h-4 w-4" /> {team.institution}
                      </p>
                    </div>
                    {team.problem_statement?.title && (
                      <p className="text-sm md:text-base text-white/90 flex items-start gap-2">
                        <Layers className="h-4 w-4 mt-0.5 shrink-0" /> {team.problem_statement.title}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      asChild
                      size="sm"
                      className="bg-white text-[#002449] hover:bg-white/90"
                    >
                      <Link href={goToDocumentSubmissionHref} className="flex items-center gap-2">
                        Manage Documents <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    {leader && (
                      <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-xs text-white/80">
                        <p className="uppercase tracking-wide text-[11px] text-white/60">Team Leader</p>
                        <p className="text-sm font-semibold text-white">{leader.user?.name || leader.user?.email}</p>
                        <p className="text-xs text-white/80 break-all">{leader.user?.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryStat
                    icon={Users}
                    label="Total Members"
                    value={totalMembers.toString()}
                    helper={leader ? `${leader.user?.name ?? leader.user?.email} leads the team` : undefined}
                  />
                  <SummaryStat
                    icon={ClipboardList}
                    label="Active Requests"
                    value={activeRequests.toString()}
                    helper={activeRequests === 0 ? "Nothing pending" : "Awaiting fulfilment"}
                  />
                  <SummaryStat
                    icon={CheckCircle2}
                    label="Issued"
                    value={issuedRequests.toString()}
                    helper={issuedRequests ? "Completed successfully" : "No issues yet"}
                  />
                  <SummaryStat
                    icon={AlertCircle}
                    label="Rejected"
                    value={rejectedRequests.toString()}
                    helper={rejectedRequests ? "Needs attention" : "All good"}
                  />
                </div>

                {latestUpdate && (
                  <p className="text-xs text-white/70">
                    Last request update: {timestampFormatter.format(latestUpdate)}
                  </p>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg" style={{ color: "#002449" }}>
                    <ShieldCheck className="h-5 w-5 text-[#002449]" /> Primary Contacts
                  </CardTitle>
                  <CardDescription>POC and mentor details for quick coordination.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ContactCard
                    title="Point of Contact"
                    contact={team.poc}
                    highlight={team.poc?.is_verified_poc}
                    badgeLabel={team.poc?.is_verified_poc ? "Verified" : undefined}
                  />
                  <ContactCard
                    title="Faculty Mentor"
                    contact={mentors[0]}
                    fallbackMessage="Mentor details have not been added."
                  />
                </CardContent>
                {mentors.length > 1 && (
                  <CardFooter className="flex flex-col gap-3 border-t border-border/60 pt-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Additional Mentors</p>
                    <div className="flex flex-wrap gap-3">
                      {mentors.slice(1).map((mentor) => (
                        <Badge key={mentor.id} variant="outline" className="gap-2 text-xs">
                          <UserCheck className="h-3.5 w-3.5" /> {mentor.name ?? "Mentor"}
                        </Badge>
                      ))}
                    </div>
                  </CardFooter>
                )}
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg" style={{ color: "#002449" }}>
                    <FileText className="h-5 w-5 text-[#002449]" /> Quick Actions
                  </CardTitle>
                  <CardDescription>Handy shortcuts for POC operations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ActionLink href={goToDocumentSubmissionHref} label="Document Submission" description="Upload and review mandatory documents." />
                  <ActionLink href={`/my-requests?team_id=${team.team_id ?? teamRouteId}`} label="View All Requests" description="Open the central request queue filtered to this team." />
                  <ActionLink
                    href={`/poc/ta-form?teamId=${team.id ?? teamRouteId}`}
                    label="TA & Mandate Form"
                    description="Open the combined TA and mandate workflow with this team selected."
                  />
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4 xl:space-y-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg" style={{ color: "#002449" }}>
                    <Users className="h-5 w-5 text-[#002449]" /> Team Members
                  </CardTitle>
                  <CardDescription>
                    Full roster of participants. Highlighted entries denote leadership roles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {team.members?.length ? (
                    <div className="space-y-3">
                      {team.members.map((member) => {
                        const isLeader = member.role?.toLowerCase().includes("leader")
                        return (
                          <div
                            key={member.id}
                            className="rounded-lg border border-border/60 bg-white px-4 py-3 shadow-sm"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold" style={{ color: "#002449" }}>
                                  {member.user?.name || member.user?.email}
                                </p>
                                <Badge
                                  variant={isLeader ? "secondary" : "outline"}
                                  className="text-[11px] uppercase tracking-wide"
                                >
                                  {member.role?.replace(/_/g, " ") || "Member"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground break-all">{member.user?.email}</p>
                              <p className="text-xs text-muted-foreground break-all">{member.phone}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No members have been synced for this team yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg" style={{ color: "#002449" }}>
                    <ClipboardList className="h-5 w-5 text-[#002449]" /> Request Activity
                  </CardTitle>
                  <CardDescription>
                    All submissions made by this team across fabrication, BOM, and additional requests.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requestsError && (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                      {requestsError}
                    </div>
                  )}

                  {requests.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20 py-10 text-center">
                      <ClipboardList className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">This team has not raised any requests yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {requests.map((request) => (
                        <TeamRequestCard
                          key={request.id}
                          request={request}
                          onStatusChange={initiateStatusChange}
                          disabled={updatingRequestId === request.id}
                          timestampFormatter={timestampFormatter}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        ) : (
          <Card className="border border-dashed border-border/60 bg-muted/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Team not found</CardTitle>
              <CardDescription>The selected team could not be located. Please return to the dashboard and try again.</CardDescription>
            </CardHeader>
          </Card>
        )}
        </div>
      </DashboardShell>

      {pendingStatusChange && (
        <StatusChangeModal
          open={!!pendingStatusChange}
          currentStatus={pendingStatusChange.request.status}
          targetStatus={pendingStatusChange.nextStatus}
          loading={updatingRequestId === pendingStatusChange.request.id}
          onClose={() => setPendingStatusChange(null)}
          onConfirm={async (remarks) => {
            if (!pendingStatusChange) return
            await handleStatusChange(
              pendingStatusChange.request.id,
              pendingStatusChange.nextStatus,
              remarks,
            )
          }}
        />
      )}
    </>
  )
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-white shadow-inner">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-white/80">{label}</p>
        <Icon className="h-5 w-5 text-white/70" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {helper && <p className="text-xs text-white/70 mt-1">{helper}</p>}
    </div>
  )
}

function ContactCard({
  title,
  contact,
  highlight,
  badgeLabel,
  fallbackMessage = "Details not provided yet.",
}: {
  title: string
  contact?: TeamContact | null
  highlight?: boolean
  badgeLabel?: string
  fallbackMessage?: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: "#002449" }}>
            {contact?.name || contact?.email || "Not assigned"}
          </p>
        </div>
        {highlight && (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[11px]">
            <UserCheck className="mr-1 h-3.5 w-3.5" /> {badgeLabel ?? "Verified"}
          </Badge>
        )}
      </div>

      {contact ? (
        <div className="mt-4 space-y-3 text-xs">
          {contact.email && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <Mail className="mt-0.5 h-3.5 w-3.5" />
              <span className="break-all">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <Phone className="mt-0.5 h-3.5 w-3.5" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.designation && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <User2 className="mt-0.5 h-3.5 w-3.5" />
              <span>{contact.designation}</span>
            </div>
          )}
          {typeof contact.first_login === "boolean" && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5" />
              <span>
                {contact.first_login ? "First login pending" : "Credentials activated"}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">{fallbackMessage}</p>
      )}
    </div>
  )
}

function ActionLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm transition hover:border-[#002449] hover:bg-[#002449]/10"
    >
      <div className="space-y-1">
        <p className="font-medium" style={{ color: "#002449" }}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowUpRight className="mt-1 h-4 w-4 text-muted-foreground" />
    </Link>
  )
}

interface TeamRequestCardProps {
  request: RequestData
  onStatusChange: (request: RequestData, newStatus: string) => void
  timestampFormatter: Intl.DateTimeFormat
  disabled?: boolean
}

function TeamRequestCard({ request, onStatusChange, timestampFormatter, disabled = false }: TeamRequestCardProps) {
  const nextStatuses = request.status === "Submitted"
    ? ["Processing", "Cannot be Processed"]
    : request.status === "Processing"
      ? ["Issued", "Cannot be Processed"]
      : []

  const accent = request.status === "Issued"
    ? "text-emerald-600"
    : request.status === "Cannot be Processed"
      ? "text-destructive"
      : "text-[#002449]"

  const requestTitle = request.notes?.trim() || request.description?.trim() || "Untitled request"

  return (
    <Card className="border border-border/70 shadow-sm hover:shadow-md transition">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="outline"
            className="border-[#002449]/40 text-[11px] font-semibold uppercase tracking-wide text-[#002449]"
          >
            {request.category}
          </Badge>
          <RequestProgress status={request.status} />
        </div>
        <CardTitle className="text-base font-semibold" style={{ color: "#002449" }}>
          {requestTitle}
        </CardTitle>
        <CardDescription className={`${accent} text-xs font-medium capitalize`}>{request.status.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        {request.fabrication && (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/30 px-3 py-2">
            <Layers className="h-3.5 w-3.5 text-[#002449]" />
            <span className="font-medium text-[#002449]">{request.fabrication.fab_type}</span>
            <Separator orientation="vertical" className="h-3/4" />
            <span>{request.fabrication.name}</span>
          </div>
        )}

        {(request.bom_items?.length ?? 0) > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">BOM Items</p>
            <div className="space-y-1 max-h-24 overflow-auto pr-0.5">
              {request.bom_items!.map((item) => (
                <div
                  key={item.id || item.item_name}
                  className="flex items-center justify-between rounded-md border border-border/60 bg-background px-2 py-1 text-[11px]"
                >
                  <span className="truncate pr-2 font-medium" style={{ color: "#002449" }}>
                    {item.item_name}
                  </span>
                  <span className="font-mono">×{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(request.additional_items?.length ?? 0) > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Additional Items</p>
            <div className="space-y-1 max-h-24 overflow-auto pr-0.5">
              {request.additional_items!.map((item) => (
                <div
                  key={item.id || item.item_name}
                  className="flex items-center justify-between rounded-md border border-border/60 bg-background px-2 py-1 text-[11px]"
                >
                  <span className="truncate pr-2 font-medium" style={{ color: "#002449" }}>
                    {item.item_name}
                  </span>
                  <span className="font-mono">×{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide">Submitted</span>
            <time title={request.created_at}>{timestampFormatter.format(new Date(request.created_at))}</time>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] uppercase tracking-wide">Updated</span>
            <time title={request.updated_at}>{timestampFormatter.format(new Date(request.updated_at))}</time>
          </div>
        </div>
        {request.remarks && (
          <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#002449]">Remarks</p>
            <p className="whitespace-pre-line text-xs text-muted-foreground">{request.remarks}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild size="sm" variant="outline" className="text-xs">
          <Link href={`/my-requests/${request.id}`}>
            View Details
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={status === "Cannot be Processed" ? "destructive" : "secondary"}
              className="text-xs"
              disabled={disabled}
              onClick={() => onStatusChange(request, status)}
            >
              {status === "Cannot be Processed" ? "Reject" : status === "Processing" ? "Accept" : "Issue"}
            </Button>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}

