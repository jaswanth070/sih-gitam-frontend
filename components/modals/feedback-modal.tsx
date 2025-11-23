"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

export type FeedbackType = "success" | "error" | "warning" | "info"

interface FeedbackModalProps {
  open: boolean
  type: FeedbackType
  title: string
  message: string
  onClose: () => void
  autoClose?: boolean
  autoCloseDuration?: number
}

export function FeedbackModal({
  open,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDuration = 3000,
}: FeedbackModalProps) {
  useEffect(() => {
    if (open && autoClose && type !== "error") {
      const timer = setTimeout(onClose, autoCloseDuration)
      return () => clearTimeout(timer)
    }
  }, [open, autoClose, autoCloseDuration, onClose, type])

  const icons = {
    success: <CheckCircle className="w-6 h-6 text-green-600" />,
    error: <AlertCircle className="w-6 h-6 text-red-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
  }

  const bgColors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className={`p-6 rounded-lg border ${bgColors[type]}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">{icons[type]}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{message}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
