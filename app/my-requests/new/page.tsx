"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"
import { requestsService, type BOMItem, type AdditionalItem, type FabricationDetails } from "@/lib/requests-service"
import { formatFileSize } from "@/lib/utils"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Check, Loader2 } from "lucide-react"

type RequestType = "BOM" | "ADDITIONAL" | "FABRICATION" | null

export default function NewRequestPage() {
  const router = useRouter()
  const [requestType, setRequestType] = useState<RequestType>(null)
  const [userTeams, setUserTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(0)

  const [items, setItems] = useState<(BOMItem | AdditionalItem)[]>([])
  const [newItemName, setNewItemName] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState("1")

  const [fabType, setFabType] = useState<"3D" | "LASER" | "OTHER">("3D")
  const [customFabType, setCustomFabType] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const draftKey = "request_wizard_draft_v1"

  const stepLabels = useMemo(
    () => ["Type", "Details", requestType === "FABRICATION" ? "Fabrication" : "Items", "Review"],
    [requestType],
  )

  const user = authService.getCurrentUser()

  useEffect(() => {
    const token = authService.getAccessToken()
    if (!token) {
      router.push("/login")
      return
    }
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
        if (d.customFabType) setCustomFabType(d.customFabType)
        else if (d.fabName) setCustomFabType(d.fabName)
        if (typeof d.step === "number") setStep(d.step)
        if (d.selectedTeam) setSelectedTeam(d.selectedTeam)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const draft = { requestType, notes, items, fabType, customFabType, step, selectedTeam }
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft))
    } catch {}
  }, [requestType, notes, items, fabType, customFabType, step, selectedTeam])

  useEffect(() => {
    if (!selectedFile) {
      setFilePreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(selectedFile)
    setFilePreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [selectedFile])

  const addItem = () => {
    if (!newItemName.trim()) return
    setItems([...items, { item_name: newItemName, quantity: Number.parseInt(newItemQuantity) || 1 }])
    setNewItemName("")
    setNewItemQuantity("1")
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const canAdvance = () => {
    if (step === 0) return requestType !== null
    if (step === 1) return !!selectedTeam && notes.trim().length >= 5
    if (step === 2) {
      if (requestType === "BOM" || requestType === "ADDITIONAL") return items.length > 0
      if (requestType === "FABRICATION") {
        if (fabType === "OTHER") {
          return customFabType.trim().length > 0
        }
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
        if (fabType === "OTHER" && !customFabType.trim()) return "Name your fabrication type"
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
    setRequestType(null)
    setNotes("")
    setItems([])
    setFabType("3D")
    setCustomFabType("")
    setSelectedFile(null)
    setNewItemName("")
    setNewItemQuantity("1")
    setStep(0)
    try {
      localStorage.removeItem(draftKey)
    } catch {}
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
        if (fabType === "OTHER" && !customFabType.trim()) {
          setError("Please name the fabrication type")
          return
        }

        const trimmedCustom = customFabType.trim()
        const fallbackName =
          fabType === "OTHER"
            ? trimmedCustom
            : selectedFile?.name || (fabType === "3D" ? "3D Fabrication" : "Laser Fabrication")
        const fabDetails: FabricationDetails = {
          fab_type: fabType,
          ...(fabType === "OTHER" ? { custom_type: trimmedCustom } : {}),
          ...(fallbackName ? { name: fallbackName } : {}),
        }

        result = await requestsService.createFabricationRequest(
          selectedTeam,
          notes,
          fabDetails,
          selectedFile || undefined,
        )
      }

      if (result) {
        resetWizard()
        router.push(`/my-requests/${result.id}`)
      }
    } catch (err) {
      console.error("[v0] Error submitting request:", err)
      setError(err instanceof Error ? err.message : "Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  const openFilePreview = () => {
    if (!filePreviewUrl) return
    window.open(filePreviewUrl, "_blank", "noopener,noreferrer")
  }

  if (user?.is_poc && !user?.is_admin) {
    return (
      <DashboardShell>
        <div className="max-w-xl mx-auto py-16">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#002449" }}>Not Allowed</h1>
          <p className="text-sm text-gray-600 mb-4">POC users cannot create requests. Please use the Virtual Queue to monitor team activity.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-white rounded-md text-sm font-medium"
            style={{ backgroundColor: "#f75700" }}
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
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {stepLabels.map((label, idx) => {
              const active = idx === step
              const done = idx < step
              return (
                <div key={label} className="flex items-center gap-3 text-xs font-medium">
                  <span
                    aria-current={active ? "step" : undefined}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-200 ${
                      active
                        ? "border-[#f75700] bg-gradient-to-br from-[#f75700] to-[#f98b42] text-white shadow"
                        : done
                          ? "border-[#078e31] bg-gradient-to-br from-[#078e31] to-[#0ba06f] text-white shadow"
                          : "border-gray-300 bg-white text-gray-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className={`uppercase tracking-wide ${active ? "text-[#f75700]" : done ? "text-[#078e31]" : "text-gray-500"}`}>
                    {label}
                  </span>
                  {idx < stepLabels.length - 1 && (
                    <span className="hidden h-px w-12 shrink-0 bg-gradient-to-r from-[#002449]/20 via-[#f75700]/30 to-[#078e31]/20 sm:block" />
                  )}
                </div>
              )
            })}
          </div>
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
                    className={`relative rounded-2xl border-2 bg-white p-6 text-left shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                      isSelected ? "-translate-y-0.5 shadow-lg" : "hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                    style={{
                      borderColor: isSelected
                        ? "#f75700"
                        : type === "BOM"
                          ? "#002449"
                          : type === "ADDITIONAL"
                            ? "#007367"
                            : "#f75700",
                      backgroundColor: isSelected ? "#fef5f1" : "white",
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
                              : "#f75700",
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
            <input type="hidden" value={selectedTeam} readOnly />
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="mb-2 block text-sm font-semibold text-[#002449]">Description / Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what you need (min 5 chars)..."
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm transition focus:border-[#f75700] focus:outline-none focus:ring-2 focus:ring-[#f75700]/30"
                rows={4}
              />
              <p className="mt-2 text-[11px] text-gray-500">{notes.length < 5 ? `Minimum 5 characters (${notes.length})` : "Looks good"}</p>
            </div>
          </div>
        )}
        {step === 2 && requestType && (
          <div className="space-y-6">
            {(requestType === "BOM" || requestType === "ADDITIONAL") && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <label className="mb-4 block text-sm font-semibold text-[#002449]">Items</label>
                <div className="mb-4 space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="rounded-lg px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "#f75700" }}
                      >Remove</button>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-xs text-gray-500">No items added yet.</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-[#f75700] focus:outline-none focus:ring-2 focus:ring-[#f75700]/30"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-[#f75700] focus:outline-none focus:ring-2 focus:ring-[#f75700]/30"
                    min="1"
                  />
                  <button
                    onClick={addItem}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: "#078e31" }}
                    disabled={!newItemName.trim()}
                  >
                    Add Item
                  </button>
                </div>
              </div>
            )}
            {requestType === "FABRICATION" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <label className="mb-2 block text-sm font-semibold text-[#002449]">Fabrication Type</label>
                  <select
                    value={fabType}
                    onChange={(e) => setFabType(e.target.value as typeof fabType)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-[#f75700] focus:outline-none focus:ring-2 focus:ring-[#f75700]/30"
                  >
                    <option value="3D">3D Printing</option>
                    <option value="LASER">Laser Cutting</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                {fabType === "OTHER" && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <label className="mb-2 block text-sm font-semibold text-[#002449]">Custom Fabrication Type</label>
                    <input
                      type="text"
                      placeholder="e.g., CNC Milling"
                      value={customFabType}
                      onChange={(e) => setCustomFabType(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-[#f75700] focus:outline-none focus:ring-2 focus:ring-[#f75700]/30"
                    />
                  </div>
                )}
                {fabType === "3D" && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <label className="mb-2 block text-sm font-semibold text-[#002449]">Upload File (Optional)</label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#f75700] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#f96e1f] focus:border-[#f75700] focus:outline-none focus:ring-2 focus:ring-[#f75700]/30"
                    />
                    {selectedFile ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                        <span className="truncate" title={selectedFile.name}>
                          {selectedFile.name}
                          {selectedFile.size ? ` (${formatFileSize(selectedFile.size)})` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={openFilePreview}
                          disabled={!filePreviewUrl}
                          className="rounded-md px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ backgroundColor: "#f75700" }}
                        >Preview</button>
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] text-gray-500">Attach STL, OBJ, or any supporting file if available.</p>
                    )}
                  </div>
                )}
                {fabType === "LASER" && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <label className="mb-2 block text-sm font-semibold text-[#002449]">Upload File (Optional)</label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#f75700] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#f96e1f] focus:border-[#f75700] focus:outline-none focus:ring-2 focus:ring-[#f75700]/30"
                    />
                    {selectedFile ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                        <span className="truncate" title={selectedFile.name}>
                          {selectedFile.name}
                          {selectedFile.size ? ` (${formatFileSize(selectedFile.size)})` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={openFilePreview}
                          disabled={!filePreviewUrl}
                          className="rounded-md px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ backgroundColor: "#f75700" }}
                        >Preview</button>
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] text-gray-500">Upload your cutting drawing or any reference file.</p>
                    )}
                  </div>
                )}
                {fabType === "OTHER" && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <label className="mb-2 block text-sm font-semibold text-[#002449]">Upload Reference File (Optional)</label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#f75700] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#f96e1f] focus:border-[#f75700] focus:outline-none focus:ring-2 focus:ring-[#f75700]/30"
                    />
                    {selectedFile ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                        <span className="truncate" title={selectedFile.name}>
                          {selectedFile.name}
                          {selectedFile.size ? ` (${formatFileSize(selectedFile.size)})` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={openFilePreview}
                          disabled={!filePreviewUrl}
                          className="rounded-md px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ backgroundColor: "#f75700" }}
                        >Preview</button>
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] text-gray-500">Optional but helpful to guide the fabrication team.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {step === 3 && requestType && (
          <div className="space-y-6 rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <h2 className="text-xl font-semibold" style={{ color: "#002449" }}>Review & Submit</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-gray-50/80 p-3"><p className="mb-1 font-medium">Type</p><p className="text-gray-700">{requestType}</p></div>
              <div className="rounded-xl bg-gray-50/80 p-3"><p className="mb-1 font-medium">Team</p><p className="text-gray-700">{selectedTeam || "-"}</p></div>
              <div className="rounded-xl bg-gray-50/80 p-3 sm:col-span-2"><p className="mb-1 font-medium">Notes</p><p className="whitespace-pre-line text-gray-700">{notes || "(none)"}</p></div>
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
                <div className="p-3 rounded-md bg-gray-50"><p className="font-medium mb-1">Fabrication Type</p><p className="text-gray-700">{fabType === "OTHER" ? customFabType || "(unspecified)" : fabType}</p></div>
                <div className="p-3 rounded-md bg-gray-50 sm:col-span-2">
                  <p className="font-medium mb-1">File</p>
                  <p className="text-gray-700">{selectedFile ? `${selectedFile.name}${selectedFile.size ? ` (${formatFileSize(selectedFile.size)})` : ""}` : "(none)"}</p>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={openFilePreview}
                      disabled={!filePreviewUrl}
                      className="mt-3 inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ backgroundColor: "#f75700" }}
                    >Preview</button>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={prevStep}
                className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >Back</button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
                style={{ backgroundColor: "#f75700" }}
              >{loading ? "Submitting..." : "Submit"}</button>
              <button
                onClick={resetWizard}
                disabled={loading}
                className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
              >Reset</button>
            </div>
          </div>
        )}
        {step < 3 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {step > 0 && (
              <button
                onClick={prevStep}
                className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >Back</button>
            )}
            {step === 0 && requestType && (
              <button
                onClick={() => setRequestType(null)}
                className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >Change Type</button>
            )}
            <div className="flex flex-col">
              <button
                onClick={nextStep}
                disabled={!canAdvance()}
                className="rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                style={{ backgroundColor: "#f75700" }}
              >Next</button>
              {!canAdvance() && <span className="text-[11px] mt-1 text-red-600">{validationMessage()}</span>}
            </div>
          </div>
        )}
      </div>
      {loading && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-[#f75700]" />
        </div>
      )}
    </DashboardShell>
  )
}
