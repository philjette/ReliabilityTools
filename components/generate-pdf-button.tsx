"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { generatePdf } from "@/lib/fmea-actions"
import type { FailureMode } from "@/lib/actions"

interface GeneratePdfButtonProps {
  size?: "sm" | "default" | "lg"
  fmeaData: {
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
  fileName: string
  children: React.ReactNode
}

export function GeneratePdfButton({ size = "default", fmeaData, fileName, children }: GeneratePdfButtonProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGeneratePdf = async () => {
    if (!fmeaData.failureModes || fmeaData.failureModes.length === 0) {
      toast({
        title: "No failure modes",
        description: "Please generate failure modes before creating a PDF",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)

      const pdfData = await generatePdf({
        title: fmeaData.title,
        assetType: fmeaData.assetType,
        voltageRating: fmeaData.voltageRating,
        operatingEnvironment: fmeaData.operatingEnvironment,
        ageRange: fmeaData.ageRange,
        loadProfile: fmeaData.loadProfile,
        assetCriticality: fmeaData.assetCriticality,
        additionalNotes: fmeaData.additionalNotes,
        failureModes: fmeaData.failureModes,
        weibullParameters: fmeaData.weibullParameters,
      })

      // Create blob and download
      const blob = new Blob([pdfData], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "PDF Generated",
        description: "Your FMEA report has been downloaded successfully",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleGeneratePdf} disabled={isGenerating} variant="outline" size={size}>
      {isGenerating ? "Generating PDF..." : children}
    </Button>
  )
}
