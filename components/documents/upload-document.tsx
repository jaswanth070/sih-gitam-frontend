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

  const currentMessage = useMemo(() => {
    if (effectiveDisabled) {
      return "Select a team to enable document uploads."
    }
    return STAGE_MESSAGE[stage]
  }, [effectiveDisabled, stage])

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
          <Badge
            variant={STAGE_BADGE_VARIANT[stage]}
            className={cn(stage === "success" ? "bg-[#007367] text-white" : "")}
          >
            {stage === "idle" && effectiveDisabled ? "Select a team" : STAGE_LABEL[stage]}
          </Badge>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Input
            key={inputKey}
            type="file"
            accept={accept}
            disabled={effectiveDisabled || isUploading}
            onChange={handleFileChange}
            className="sm:max-w-md"
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
