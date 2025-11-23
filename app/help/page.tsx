"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function HelpPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-700">Help & Support</h1>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#f75700" }}>
              Getting Started
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>Welcome to the Smart India Hackathon 2025 Portal. This guide will help you navigate the platform.</p>
              <h3 className="font-semibold text-blue-700">For Team Leaders:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Login with your GITAM email and temporary password</li>
                <li>Complete OTP verification on first login</li>
                <li>Confirm your team details</li>
                <li>Submit BOMs, Additional Materials, and 3D/Laser requests within specified time windows</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#f75700" }}>
              Submission Guidelines
            </h2>
            <div className="space-y-3 text-gray-700">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="font-semibold text-blue-900 mb-2">📋 BOM (Bill of Materials)</p>
                <p className="text-sm">
                  Available: 05:00 - 08:00 IST daily. Submit itemized list with quantities and justifications.
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="font-semibold text-blue-900 mb-2">📦 Additional Materials</p>
                <p className="text-sm">Must be submitted before 00:00 IST of the requested day.</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="font-semibold text-blue-900 mb-2">🔧 3D & Laser Cutting</p>
                <p className="text-sm">Upload TSV files with specifications. Format details available in dashboard.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#f75700" }}>
              Contact Support
            </h2>
            <div className="p-4 bg-green-50 border border-green-200 rounded text-gray-700">
              <p className="mb-2">
                <strong>Email:</strong> support@sih.gitam.edu
              </p>
              <p className="mb-2">
                <strong>Office:</strong> GITAM Nodal Center, Visakhapatnam
              </p>
              <p>
                <strong>Hours:</strong> 09:00 - 18:00 IST (Monday - Friday)
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Button onClick={() => router.push("/dashboard")} className="bg-blue-600 hover:bg-blue-700">
            Go to Dashboard
          </Button>
        </div>
      </main>
    </div>
  )
}
