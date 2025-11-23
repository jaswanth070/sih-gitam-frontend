"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { requestsService, type RequestData } from "@/lib/requests-service"
import { useRequestsWS } from "@/hooks/use-requests-ws"

export function TeamLeaderDashboard() {
  const router = useRouter()
  const [team, setTeam] = useState<any>(null)
  const [requests, setRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userTeams, setUserTeams] = useState<string[]>([])

  const user = authService.getCurrentUser()

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const teamData = await authService.getTeamDetails()
        setTeam(teamData)
        if (user?.team_ids) {
          setUserTeams(user.team_ids)
        }
      } catch (err: any) {
        setError(err.message || "Failed to load team")
      } finally {
        setLoading(false)
      }
    }

    fetchTeam()
  }, [user])

  const handleWsEvent = (message: any) => {
    if (message.event === "request_created" || message.event === "request_updated") {
      if (userTeams.includes(message.request?.team_id)) {
        setRequests((prev) => {
          const filtered = prev.filter((r) => r.id !== message.request?.id)
          return [message.request, ...filtered].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )
        })
      }
    } else if (message.event === "state_transition") {
      setRequests((prev) => prev.map((r) => (r.id === message.request_id ? { ...r, status: message.to as any } : r)))
    }
  }

  useRequestsWS(handleWsEvent)

  useEffect(() => {
    if (userTeams.length === 0) return

    const fetchRequests = async () => {
      try {
        const response = await requestsService.listRequests({
          ordering: "-created_at",
        })
        const filtered = response.results.filter((r) => userTeams.includes(r.team_id))
        setRequests(filtered.slice(0, 5)) // Show recent 5
      } catch (err) {
        console.error("Error fetching requests:", err)
      }
    }

    fetchRequests()
  }, [userTeams])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  const bomCount = requests.filter((r) => r.category === "BOM").length
  const additionalCount = requests.filter((r) => r.category === "ADDITIONAL").length
  const fabricationCount = requests.filter((r) => r.category === "FABRICATION").length
  const submittedCount = requests.filter((r) => r.status === "Submitted").length

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2" style={{ color: "#002449" }}>
          Welcome, Team Leader
        </h2>
        <p className="text-gray-600">Manage your team's submissions and track real-time status</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {team ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Team Members</p>
              <p className="text-3xl font-bold" style={{ color: "#002449" }}>
                {team.members?.length || 0}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">BOM Requests</p>
              <p className="text-3xl font-bold" style={{ color: "#f75700" }}>
                {bomCount}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Additional Items</p>
              <p className="text-3xl font-bold" style={{ color: "#078e31" }}>
                {additionalCount}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">3D/Laser Requests</p>
              <p className="text-3xl font-bold" style={{ color: "#007367" }}>
                {fabricationCount}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Pending Review</p>
              <p className="text-3xl font-bold" style={{ color: "#f75700" }}>
                {submittedCount}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-6" style={{ color: "#f75700" }}>
                Team Details
              </h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Team Name</p>
                  <p className="font-semibold text-gray-900">{team.name}</p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Institution</p>
                  <p className="font-semibold text-gray-900">{team.institution}</p>
                </div>
                {team.problem_statement && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Problem Statement</p>
                    <p className="font-semibold text-gray-900">{team.problem_statement.title}</p>
                    <p className="text-sm font-medium mt-2" style={{ color: "#f75700" }}>
                      ID: {team.problem_statement.id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Windows */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-6" style={{ color: "#f75700" }}>
                Submission Windows
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#f0e0c1" }}>
                  <p className="text-sm font-medium text-gray-900">📋 BOM Submissions</p>
                  <p className="text-xs font-medium text-gray-600 mt-1">05:00 - 08:00 IST daily</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#e8f5e9" }}>
                  <p className="text-sm font-medium text-gray-900">📦 Additional Materials</p>
                  <p className="text-xs font-medium text-gray-600 mt-1">Before 00:00 IST of the day</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#e0f2f1" }}>
                  <p className="text-sm font-medium text-gray-900">🔧 3D/Laser Requests</p>
                  <p className="text-xs font-medium text-gray-600 mt-1">Anytime during event</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-6" style={{ color: "#f75700" }}>
              Team Members ({team.members?.length || 0})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.members?.map((member: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <p className="font-semibold text-gray-900">{member.user.name}</p>
                  <p className="text-sm text-gray-600 mt-2 break-all">{member.user.email}</p>
                  <p className="text-xs font-bold mt-3 uppercase" style={{ color: "#f75700" }}>
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Requests */}
          {requests.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold" style={{ color: "#f75700" }}>
                  Recent Requests
                </h3>
                <Link href="/requests" className="text-sm font-medium" style={{ color: "#002449" }}>
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {requests.map((req) => (
                  <Link key={req.id} href={`/requests/${req.id}`}>
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{req.notes || "Untitled"}</p>
                          <p className="text-sm text-gray-600 mt-1">{req.category}</p>
                        </div>
                        <span
                          className="px-3 py-1 text-xs font-semibold text-white rounded-full"
                          style={{
                            backgroundColor:
                              req.status === "Submitted"
                                ? "#f75700"
                                : req.status === "Processing"
                                  ? "#002449"
                                  : req.status === "Issued"
                                    ? "#078e31"
                                    : "#999",
                          }}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600">No team data available</p>
        </div>
      )}
    </div>
  )
}
