"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/navigation/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Printer } from "lucide-react"

const JURY_PDF_SRC = "/Jury_Judge_Honorarium_TA.pdf"

export default function JuryFormsPage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [printError, setPrintError] = useState<string | null>(null)

  useEffect(() => {
    const loadPdf = () => {
      setLoading(true)
      setPdfUrl(JURY_PDF_SRC)
    }

    loadPdf()
  }, [])

  const handlePrint = () => {
    setPrintError(null)
    const frameWindow = iframeRef.current?.contentWindow
    if (!frameWindow) {
      setPrintError("Unable to access the PDF viewer. Try reloading the page and printing again.")
      return
    }
    try {
      frameWindow.focus()
      frameWindow.print()
    } catch (error) {
      setPrintError("Printing was blocked by the browser. Please retry after allowing pop-ups.")
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#002449" }}>
              Jury Forms
            </h1>
            
          </div>
          <div className="flex flex-wrap items-center gap-2">
            
            <Button size="sm" variant="secondary" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" /> Print Form
            </Button>
          </div>
        </header>

        <Card className="p-4 md:p-6 border border-[#d9e2f2] bg-[#f9fbff]">
          <div className="relative w-full rounded-lg border border-[#c7d4ec] bg-white shadow-sm">
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-[#f75700]" />
                Loading PDF viewer…
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={pdfUrl ?? JURY_PDF_SRC}
              title="Jury / Judge Honorarium TA Form"
              className="h-[70vh] min-h-[520px] w-full rounded-lg"
              onLoad={() => setLoading(false)}
            />
          </div>
          {printError && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {printError}
            </p>
          )}
        </Card>
      </div>
    </DashboardShell>
  )
}
