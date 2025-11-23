"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"
import { requestsService, type BOMItem, type AdditionalItem, type FabricationDetails } from "../../../lib/requests-service"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Check } from "lucide-react"

type RequestType = "BOM" | "ADDITIONAL" | "FABRICATION" | null

export default function NewRequestPage() {
  const router = useRouter()
  const [requestType, setRequestType] = useState<RequestType>(null)
  const [userTeams, setUserTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(0) // 0=type,1=details,2=items/fabrication,3=review

  // BOM/Additional state
  const [items, setItems] = useState<(BOMItem | AdditionalItem)[]>([])
  const [newItemName, setNewItemName] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState("1")

  // Fabrication state
  const [fabType, setFabType] = useState<"3D" | "LASER" | "OTHER">("3D")
  const [fabName, setFabName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const draftKey = "request_wizard_draft_v1"

  const user = authService.getCurrentUser()

  // Initial mount: auth check + draft restore (runs once)
  useEffect(() => {
    const token = authService.getAccessToken()
    if (!token) {
      router.push("/login")
      return
    }
    // Restrict POC from creating requests
    if (user?.is_poc && !user?.is_admin) {
      router.replace("/dashboard")
      return
    }
    if (user?.team_ids?.length) {
      setUserTeams(user.team_ids)
      setSelectedTeam(user.team_ids[0])
    }
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const d = JSON.parse(raw)
        if (d.requestType) setRequestType(d.requestType)
        if (d.notes) setNotes(d.notes)
        if (Array.isArray(d.items)) setItems(d.items)
        if (d.fabType) setFabType(d.fabType)
        if (d.fabName) setFabName(d.fabName)
        if (typeof d.step === "number") setStep(d.step)
        if (d.selectedTeam) setSelectedTeam(d.selectedTeam)
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const draft = { requestType, notes, items, fabType, fabName, step, selectedTeam }
    try { localStorage.setItem(draftKey, JSON.stringify(draft)) } catch {}
  }, [requestType, notes, items, fabType, fabName, step, selectedTeam])

  const addItem = () => {
    if (!newItemName.trim()) return
    setItems([...items, { item_name: newItemName, quantity: Number.parseInt(newItemQuantity) || 1 }])
    setNewItemName("")
    setNewItemQuantity("1")
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Simple per-step validation
  const canAdvance = () => {
    if (step === 0) return requestType !== null
    if (step === 1) return !!selectedTeam && notes.trim().length >= 5
    if (step === 2) {
      if (requestType === "BOM" || requestType === "ADDITIONAL") return items.length > 0
      if (requestType === "FABRICATION") {
        if (!fabName.trim()) return false
        if (fabType === "3D" && !selectedFile) return false
        return true
      }
    }
    return true
  }

  const validationMessage = () => {
    if (step === 0 && !requestType) return "Select a request type"
    if (step === 1) {
      if (!selectedTeam) return "Select a team"
      if (notes.trim().length < 5) return "Minimum 5 characters"
    }
    if (step === 2) {
      if ((requestType === "BOM" || requestType === "ADDITIONAL") && items.length === 0) return "Add at least one item"
      if (requestType === "FABRICATION") {
        if (!fabName.trim()) return "Enter model name"
        if (fabType === "3D" && !selectedFile) return "Upload STL/OBJ file"
      }
    }
    return ""
  }

  const nextStep = () => {
    if (!canAdvance()) return
    setError("")
    setStep((s) => Math.min(3, s + 1))
  }
  const prevStep = () => setStep((s) => Math.max(0, s - 1))
  const resetWizard = () => {
    setRequestType(null); setNotes(""); setItems([]); setFabName(""); setSelectedFile(null); setStep(0); try { localStorage.removeItem(draftKey) } catch {}
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError("")

      if (!selectedTeam) {
        setError("Please select a team")
        return
      }

      if (!notes.trim()) {
        setError("Please enter a description")
        return
      }

      let result

      if (requestType === "BOM") {
        if (items.length === 0) {
          setError("Please add at least one item")
          return
        }
        result = await requestsService.createBOMRequest(selectedTeam, notes, items as BOMItem[])
      } else if (requestType === "ADDITIONAL") {
        if (items.length === 0) {
          setError("Please add at least one item")
          return
        }
        result = await requestsService.createAdditionalRequest(selectedTeam, notes, items as AdditionalItem[])
      } else if (requestType === "FABRICATION") {
        if (!fabName.trim()) {
          setError("Please enter fabrication name")
          return
        }
        if (fabType === "3D" && !selectedFile) {
          setError("Please upload a file for 3D fabrication")
          return
        }

        const fabDetails: FabricationDetails = {
          fab_type: fabType,
          name: fabName,
        }

        result = await requestsService.createFabricationRequest(
          selectedTeam,
          notes,
          fabDetails,
          selectedFile || undefined,
        )
      }

      if (result) {
        router.push(`/requests/${result.id}`)
      }
    } catch (err) {
      console.error("[v0] Error submitting request:", err)
      setError(err instanceof Error ? err.message : "Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  if (user?.is_poc && !user?.is_admin) {
    return (
      <DashboardShell>
        <div className="max-w-xl mx-auto py-16">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#002449" }}>Not Allowed</h1>
          <p className="text-sm text-gray-600 mb-4">POC users cannot create requests. Please use the Virtual Queue to monitor team activity.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-white rounded-md text-sm font-medium"
            style={{ backgroundColor: '#f75700' }}
          >Return to Dashboard</button>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#002449" }}>New Request</h1>
        <p className="text-gray-600 mb-6">Multi-step creation for BOM, Additional or Fabrication requests.</p>
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {["Type","Details", requestType === "FABRICATION" ? "Fabrication" : "Items", "Review"].map((label, idx) => {
            const active = idx === step
            const done = idx < step
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${active?"bg-[#f75700] text-white border-[#f75700]":""} ${done?"bg-[#078e31] text-white border-[#078e31]":""} ${!active && !done?"bg-white text-gray-500 border-gray-300":""}`}>{idx+1}</div>
                <span className={`text-xs font-medium ${active?"text-[#f75700]":"text-gray-600"}`}>{label}</span>
                {idx < 3 && <span className="w-8 h-px bg-gray-300" />}
              </div>
            )
          })}
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        {step === 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {["BOM", "ADDITIONAL", "FABRICATION"].map((type) => {
                const isSelected = requestType === type
                return (
                  <button
                    key={type}
                    onClick={() => setRequestType(type as RequestType)}
                    className={`relative p-6 border-2 rounded-lg transition-all text-left group focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSelected ? "shadow-lg" : "hover:shadow-md"}`}
                    style={{
                      borderColor: isSelected
                        ? "#f75700"
                        : type === "BOM"
                        ? "#002449"
                        : type === "ADDITIONAL"
                        ? "#007367"
                        : "#f75700",
                      backgroundColor: isSelected ? "#fef5f1" : "white"
                    }}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-[#f75700] text-white">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                    <h3
                      className="text-lg font-bold mb-2"
                      style={{
                        color: isSelected
                          ? "#f75700"
                          : type === "BOM"
                          ? "#002449"
                          : type === "ADDITIONAL"
                          ? "#007367"
                          : "#f75700"
                      }}
                    >
                      {type === "FABRICATION" ? "3D/Laser Fabrication" : type}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {type === "BOM" && "Request Bill of Materials components"}
                      {type === "ADDITIONAL" && "Request additional materials or supplies"}
                      {type === "FABRICATION" && "Submit fabrication files for 3D printing or laser cutting"}
                    </p>
                  </button>
                )
              })}
            </div>
            {requestType && (
              <div className="mt-6 p-4 rounded-lg border bg-[#fef5f1] border-[#f75700] flex items-center gap-3">
                <Check className="w-5 h-5 text-[#f75700]" />
                <p className="text-sm">
                  <span className="font-semibold" style={{ color: "#f75700" }}>Selected:</span>{" "}
                  {requestType === "FABRICATION" ? "3D/Laser Fabrication" : requestType}
                </p>
              </div>
            )}
          </>
        )}
        {step === 1 && (
          <div className="space-y-6">
            {/* Team ID hidden (auto-selected) */}
            <input type="hidden" value={selectedTeam} readOnly />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description / Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe what you need (min 5 chars)..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none" rows={4} />
              <p className="text-[11px] mt-1 text-gray-500">{notes.length < 5 ? `Minimum 5 characters (${notes.length})` : "Looks good"}</p>
            </div>
          </div>
        )}
        {step === 2 && requestType && (
          <div className="space-y-6">
            {(requestType === "BOM" || requestType === "ADDITIONAL") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Items</label>
                <div className="space-y-3 mb-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <button onClick={() => removeItem(index)} className="px-3 py-1 text-xs font-semibold text-white rounded-lg" style={{ backgroundColor: "#f75700" }}>Remove</button>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-xs text-gray-500">No items added yet.</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" placeholder="Item name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" />
                  <input type="number" placeholder="Qty" value={newItemQuantity} onChange={(e) => setNewItemQuantity(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" min="1" />
                  <button onClick={addItem} className="px-4 py-2 text-white font-medium rounded-lg disabled:opacity-50" style={{ backgroundColor: "#078e31" }} disabled={!newItemName.trim()}>Add Item</button>
                </div>
              </div>
            )}
            {requestType === "FABRICATION" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fabrication Type</label>
                  <select value={fabType} onChange={(e) => setFabType(e.target.value as any)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2">
                    <option value="3D">3D Printing</option>
                    <option value="LASER">Laser Cutting</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Part / Model Name</label>
                  <input type="text" placeholder="e.g., Chassis, Gear A" value={fabName} onChange={(e) => setFabName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" />
                </div>
                {fabType === "3D" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload File (STL/OBJ)</label>
                    <input type="file" accept=".stl,.obj" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" />
                    {!selectedFile && <p className="text-[11px] text-gray-500 mt-1">Required for 3D prints.</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {step === 3 && requestType && (
          <div className="space-y-6 bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold" style={{ color: "#002449" }}>Review & Submit</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-md bg-gray-50"><p className="font-medium mb-1">Type</p><p className="text-gray-700">{requestType}</p></div>
              <div className="p-3 rounded-md bg-gray-50"><p className="font-medium mb-1">Team</p><p className="text-gray-700">{selectedTeam || "-"}</p></div>
              <div className="p-3 rounded-md bg-gray-50 sm:col-span-2"><p className="font-medium mb-1">Notes</p><p className="text-gray-700 whitespace-pre-line">{notes || "(none)"}</p></div>
            </div>
            {requestType !== "FABRICATION" && (
              <div>
                <p className="font-medium mb-2">Items ({items.length})</p>
                <ul className="space-y-1 text-xs">
                  {items.map((i, idx) => (
                    <li key={idx} className="flex justify-between bg-gray-50 rounded px-2 py-1"><span className="truncate max-w-[180px]" title={i.item_name}>{i.item_name}</span><span className="font-mono">x{i.quantity}</span></li>
                  ))}
                  {items.length === 0 && <li className="text-gray-500">No items.</li>}
                </ul>
              </div>
            )}
            {requestType === "FABRICATION" && (
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-md bg-gray-50"><p className="font-medium mb-1">Fabrication Type</p><p className="text-gray-700">{fabType}</p></div>
                <div className="p-3 rounded-md bg-gray-50"><p className="font-medium mb-1">Model Name</p><p className="text-gray-700">{fabName || "-"}</p></div>
                <div className="p-3 rounded-md bg-gray-50 sm:col-span-2"><p className="font-medium mb-1">File</p><p className="text-gray-700">{selectedFile ? selectedFile.name : "(none)"}</p></div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button onClick={prevStep} className="px-5 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50">Back</button>
              <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 text-white font-medium rounded-lg transition-opacity" style={{ backgroundColor: "#f75700" }}>{loading?"Submitting...":"Submit"}</button>
              <button onClick={resetWizard} disabled={loading} className="px-5 py-2 text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-50">Reset</button>
            </div>
          </div>
        )}
        {step < 3 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {step > 0 && (<button onClick={prevStep} className="px-5 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50">Back</button>)}
            {step === 0 && requestType && (
              <button onClick={() => setRequestType(null)} className="px-5 py-2 text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-50">Change Type</button>
            )}
            <div className="flex flex-col">
              <button onClick={nextStep} disabled={!canAdvance()} className="px-6 py-2 text-white font-medium rounded-lg disabled:opacity-50" style={{ backgroundColor: "#f75700" }}>Next</button>
              {!canAdvance() && (
                <span className="text-[11px] mt-1 text-red-600">{validationMessage()}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
