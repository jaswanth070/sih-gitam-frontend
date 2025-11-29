"use client"

import { useCallback, useMemo, useState } from "react"
import { Loader2, Upload, X, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  type DocumentType,
  getDownloadURL,
  notifyUploaded,
  prepareUpload,
  type NotifyUploadResponse,
  type PrepareUploadResponse,
  uploadToGCS,
} from "@/utils/upload"

export interface UploadDocumentSuccess {
  versionId: string
  storagePath?: string
  notifyPayload?: NotifyUploadResponse | null
  preparePayload: PrepareUploadResponse
}

export interface UploadDocumentProps {
  teamId?: string
  documentType: DocumentType
  label: string
  disabled?: boolean
  accept?: string
  onUploaded?: (payload: UploadDocumentSuccess) => void
  disabledReason?: string
}

type UploadStage = "idle" | "ready" | "preparing" | "uploading" | "notifying" | "success" | "error"

const STAGE_MESSAGE: Record<UploadStage, string> = {
  idle: "Select a file to begin the upload process.",
  ready: "File selected. Click Upload to continue.",
  preparing: "Requesting a secure upload URL...",
  uploading: "Uploading file to cloud storage...",
  notifying: "Finalising upload with the backend...",
  success: "Upload complete. Awaiting admin approval.",
  error: "Upload failed. Please try again.",
}

const STAGE_LABEL: Record<UploadStage, string> = {
  idle: "Idle",
  ready: "Ready",
  preparing: "Preparing",
  uploading: "Uploading",
  notifying: "Notifying",
  success: "Success",
  error: "Error",
}

const STAGE_BADGE_VARIANT: Record<UploadStage, "default" | "secondary" | "destructive"> = {
  idle: "secondary",
  ready: "secondary",
  preparing: "secondary",
  uploading: "secondary",
  notifying: "secondary",
  success: "default",
  error: "destructive",
}

export function UploadDocument({
  teamId,
  documentType,
  label,
  disabled = false,
  accept = "application/pdf,image/*",
  onUploaded,
  disabledReason,
}: UploadDocumentProps) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState(0)
  const [stage, setStage] = useState<UploadStage>("idle")
  const [isUploading, setIsUploading] = useState(false)
  const [lastVersionId, setLastVersionId] = useState<string | null>(null)
  const [storagePath, setStoragePath] = useState<string | undefined>()
  const [isDownloading, setIsDownloading] = useState(false)

  const effectiveDisabled = disabled || !teamId
  const isLocked = effectiveDisabled && !!teamId

  const currentMessage = useMemo(() => {
    if (effectiveDisabled) {
      if (!teamId) {
        return "Select a team to enable document uploads."
      }
      return disabledReason ?? "Uploads are locked for this document."
    }
    return STAGE_MESSAGE[stage]
  }, [disabledReason, effectiveDisabled, stage, teamId])

  const fileInputClasses = useMemo(
    () =>
      cn(
        "sm:max-w-md cursor-pointer border-2 border-dashed border-[#f75700] bg-white/95 shadow-[0_0_0_1px_rgba(247,87,0,0.18)] transition focus-visible:border-[#f75700] focus-visible:ring-[#f75700]/50 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#f75700] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white file:tracking-wide file:uppercase file:transition-colors hover:border-[#d94f00] file:hover:bg-[#d94f00]",
        file && !effectiveDisabled ? "border-solid border-[#078e31] shadow-[0_0_0_1px_rgba(7,142,49,0.2)]" : null,
        effectiveDisabled || isUploading
          ? "cursor-not-allowed border-gray-300 bg-gray-100 shadow-none file:bg-gray-300 file:text-gray-600 hover:border-gray-300"
          : null,
      ),
    [effectiveDisabled, file, isUploading],
  )

  const badgeLabel = isLocked
    ? "Approved"
    : effectiveDisabled && !teamId
      ? "Select Team"
      : STAGE_LABEL[stage]

  const badgeVariant: "default" | "secondary" | "destructive" = isLocked
    ? "default"
    : effectiveDisabled && !teamId
      ? "secondary"
      : STAGE_BADGE_VARIANT[stage]

  const badgeClassName = cn(
    !isLocked && stage === "success" ? "bg-[#007367] text-white" : null,
    isLocked ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : null,
  )

  const resetFileInput = useCallback(() => {
    setFile(null)
    setInputKey((prev) => prev + 1)
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0]
    setFile(nextFile ?? null)
    setStage(nextFile ? "ready" : "idle")
  }

  const handleClear = () => {
    resetFileInput()
    setStage("idle")
  }

  const handleUpload = async () => {
    if (effectiveDisabled) {
      toast({
        variant: "destructive",
        title: "Select a team first",
        description: "Choose a team from the dashboard to upload documents.",
      })
      return
    }

    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Pick a file before starting the upload.",
      })
      return
    }

    setIsUploading(true)
    setStage("preparing")

    try {
      const prep = await prepareUpload(teamId!, file, documentType)

      setStage("uploading")
      await uploadToGCS(prep.upload_url, file)

      setStage("notifying")
      const notifyPayload = await notifyUploaded(prep.version_id)

      setStage("success")
      setLastVersionId(prep.version_id)
      setStoragePath(prep.storage_path)

      toast({
        title: `${label} uploaded`,
        description: "Upload successful. The document is pending administrator review.",
      })

      onUploaded?.({
        versionId: prep.version_id,
        storagePath: prep.storage_path,
        notifyPayload,
        preparePayload: prep,
      })

      resetFileInput()
    } catch (error) {
      console.error("Document upload failed", error)
      const message = error instanceof Error ? error.message : "The upload failed."
      setStage("error")
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: message,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!lastVersionId) return

    setIsDownloading(true)
    try {
      const { download_url: downloadUrl } = await getDownloadURL(lastVersionId)
      if (typeof window !== "undefined") {
        window.open(downloadUrl, "_blank", "noopener,noreferrer")
      }
    } catch (error) {
      console.error("Download link error", error)
      const message = error instanceof Error ? error.message : "Unable to fetch download URL."
      toast({
        variant: "destructive",
        title: "Download failed",
        description: message,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-[#002449]/20 bg-[#002449]/5 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[#002449]">
            <Upload className="h-4 w-4" />
            <span className="text-sm font-semibold">{label}</span>
          </div>
          <Badge variant={badgeVariant} className={badgeClassName}>
            {badgeLabel}
          </Badge>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Input
            key={inputKey}
            type="file"
            accept={accept}
            disabled={effectiveDisabled || isUploading}
            onChange={handleFileChange}
            className={fileInputClasses}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={effectiveDisabled || !file || isUploading}
              aria-disabled={effectiveDisabled || !file || isUploading}
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            {file && !isUploading && (
              <Button size="sm" variant="ghost" onClick={handleClear} disabled={effectiveDisabled}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
            {lastVersionId && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
                aria-disabled={isDownloading}
              >
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{currentMessage}</p>

        {lastVersionId && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-semibold text-[#002449]">Latest version:</span>
            <Badge variant="outline" className="font-mono">{lastVersionId}</Badge>
            {storagePath && <span className="truncate">Path: {storagePath}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadDocument
