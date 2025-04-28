"use client"

import { useState } from "react"
import { FileText, Loader2 } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { generatePdf, generatePdfFromSaved } from "@/lib/fmea-actions"
import type { FailureMode } from "@/lib/actions"

interface DownloadPdfButtonProps extends Omit<ButtonProps, "onClick"> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  // For generated but not saved FMEAs
  fmeaData?: {
    title: string
    assetType: string
    voltageRating: string
    operatingEnvironment: string
    ageRange: string
    loadProfile: string
    assetCriticality: string
    additionalNotes: string
    failureModes: FailureMode[]
    weibullParameters: Record<string, { shape: number; scale: number }>
  }
  // For saved FMEAs
  fmeaId?: string
  fileName?: string
}

export function DownloadPdfButton({
  variant = "outline",
  size = "sm",
  fmeaData,
  fmeaId,
  fileName,
  children,
  ...props
}: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    try {
      setIsGenerating(true)

      let pdfData: Uint8Array

      if (fmeaId) {
        // Generate PDF from saved FMEA
        pdfData = await generatePdfFromSaved(fmeaId)
      } else if (fmeaData) {
        // Generate PDF from unsaved FMEA data
        pdfData = await generatePdf(fmeaData)
      } else {
        throw new Error("Either fmeaId or fmeaData must be provided")
      }

      // Convert the Uint8Array to a Blob
      const blob = new Blob([pdfData], { type: "application/pdf" })

      // Create a URL for the Blob
      const url = URL.createObjectURL(blob)

      // Create a link element and trigger the download
      const link = document.createElement("a")
      link.href = url
      link.download = fileName || `FMEA_Report_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload} disabled={isGenerating} {...props}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          {children || (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </>
          )}
        </>
      )}
    </Button>
  )
}
