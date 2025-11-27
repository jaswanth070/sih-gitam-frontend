"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { authService, type TeamDetails } from "@/lib/auth-service"

export default function ConfirmTeamPage() {
  const router = useRouter()
  const [team, setTeam] = useState<TeamDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        const teamData = await authService.getTeamDetails(true)
        setTeam(teamData)
      } catch (err: any) {
        setError(err.message || "Failed to load team details")
      } finally {
        setLoading(false)
      }
    }

    fetchTeamDetails()
  }, [])

  const handleConfirm = async () => {
    setConfirming(true)

    try {
      await authService.confirmTeamDetails()
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to confirm team details")
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading team details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with brand strip */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
            <Image
              src="/sih_banner.png"
              alt="Smart India Hackathon banner"
              width={320}
              height={90}
              className="h-20 w-auto"
              priority
            />
            <div className="h-16 w-px bg-gray-300" aria-hidden="true" />
            <Image src="/gitam_logo.png" alt="GITAM" width={240} height={90} className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-center md:text-right" style={{ color: "#002449" }}>
            Team Confirmation
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#002449" }}>
              Confirm Team Details
            </h2>
            <p className="text-gray-600">Please verify your team information before proceeding to the dashboard</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {team && (
            <>
              {/* Team Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-md">
                <h3 className="text-2xl font-bold mb-6" style={{ color: "#f75700" }}>
                  Team Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Team Name</p>
                    <p className="text-lg font-semibold text-gray-900">{team.name}</p>
                  </div>

                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Institution</p>
                    <p className="text-lg font-semibold text-gray-900">{team.institution}</p>
                  </div>

                  {team.problem_statement && (
                    <div className="pb-4 border-b border-gray-200 md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Problem Statement</p>
                      <p className="text-lg font-semibold text-gray-900">{team.problem_statement.title}</p>
                      <p className="text-sm font-medium mt-2" style={{ color: "#f75700" }}>
                        ID: {team.problem_statement.id}
                      </p>
                    </div>
                  )}

                  {team.faculty_mentor && (
                    <div className="pb-4 border-b border-gray-200">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Faculty Mentor</p>
                      <p className="text-lg font-semibold text-gray-900">{team.faculty_mentor.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Members */}
              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-md">
                <h3 className="text-2xl font-bold mb-6" style={{ color: "#f75700" }}>
                  Team Members ({team.members?.length || 0})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {team.members?.map((member, idx) => (
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

              {/* Confirmation Actions */}
              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-md">
                <div className="space-y-6">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: "#f0e0c1" }}>
                    <p className="text-sm font-medium text-gray-900">
                      Please review all information above carefully. Once confirmed, you will be redirected to your
                      dashboard.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleConfirm}
                      disabled={confirming}
                      className="flex-1 py-3 text-white font-semibold rounded-lg transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: "#f75700" }}
                      onMouseEnter={(e) => !confirming && (e.currentTarget.style.opacity = "0.9")}
                      onMouseLeave={(e) => !confirming && (e.currentTarget.style.opacity = "1")}
                    >
                      {confirming ? "Confirming..." : "Confirm & Continue"}
                    </button>
                    <button
                      onClick={() => router.push("/")}
                      className="flex-1 py-3 text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
