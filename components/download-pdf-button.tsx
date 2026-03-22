"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface ProcessedFailureMode {
  failureMode: string
  cause: string
  effect: string
  severity: number
  occurrence: number
  detection: number
  rpn: number
  recommendation?: string
}

interface DownloadPdfButtonProps {
  assetType: string
  voltageRating: string
  operatingEnvironment: string
  ageRange: string
  loadProfile: string
  assetCriticality: string
  additionalNotes: string
  failureModes: ProcessedFailureMode[]
  weibullParameters: Record<string, { shape: number; scale: number }>
}

export function DownloadPdfButton({
  assetType,
  voltageRating,
  operatingEnvironment,
  ageRange,
  loadProfile,
  assetCriticality,
  additionalNotes,
  failureModes,
  weibullParameters,
}: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)

    try {
      generatePdfReport({
        assetType,
        voltageRating,
        operatingEnvironment,
        ageRange,
        loadProfile,
        assetCriticality,
        additionalNotes,
        failureModes,
        weibullParameters,
      })
    } catch (error) {
      console.error("Error generating PDF report:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={isGenerating} variant="outline">
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </>
      )}
    </Button>
  )
}

function getRiskLevel(rpn: number): string {
  if (rpn >= 200) return "Critical"
  if (rpn >= 100) return "High"
  if (rpn >= 50) return "Medium"
  return "Low"
}

function getRiskColor(rpn: number): [number, number, number] {
  if (rpn >= 200) return [220, 38, 38] // red
  if (rpn >= 100) return [234, 88, 12] // orange
  if (rpn >= 50) return [202, 138, 4] // yellow/amber
  return [34, 197, 94] // green
}

function generatePdfReport(data: DownloadPdfButtonProps): void {
  const {
    assetType,
    voltageRating,
    operatingEnvironment,
    ageRange,
    loadProfile,
    assetCriticality,
    additionalNotes,
    failureModes,
    weibullParameters,
  } = data

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Title
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("FMEA Report", pageWidth / 2, yPos, { align: "center" })
  yPos += 8

  // Subtitle
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Failure Mode and Effects Analysis", pageWidth / 2, yPos, { align: "center" })
  yPos += 6

  // Generated date
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: "center" })
  doc.setTextColor(0)
  yPos += 15

  // Asset Information Section
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Asset Information", 14, yPos)
  yPos += 8

  // Asset info table
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ["Asset Type", assetType],
      ["Voltage Rating", voltageRating],
      ["Operating Environment", operatingEnvironment],
      ["Asset Age", ageRange],
      ["Load Profile", loadProfile],
      ["Asset Criticality", assetCriticality],
      ["Additional Notes", additionalNotes || "None"],
    ],
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Risk Summary Section
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Risk Summary", 14, yPos)
  yPos += 8

  const criticalCount = failureModes.filter((fm) => fm.rpn >= 200).length
  const highCount = failureModes.filter((fm) => fm.rpn >= 100 && fm.rpn < 200).length
  const mediumCount = failureModes.filter((fm) => fm.rpn >= 50 && fm.rpn < 100).length
  const lowCount = failureModes.filter((fm) => fm.rpn < 50).length

  autoTable(doc, {
    startY: yPos,
    head: [["Risk Level", "Count", "RPN Range"]],
    body: [
      ["Critical", criticalCount.toString(), "≥ 200"],
      ["High", highCount.toString(), "100 - 199"],
      ["Medium", mediumCount.toString(), "50 - 99"],
      ["Low", lowCount.toString(), "< 50"],
    ],
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 4, halign: "center" },
    headStyles: { fillColor: [41, 37, 36], textColor: [255, 255, 255] },
    bodyStyles: { halign: "center" },
    columnStyles: {
      0: { halign: "left" },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const riskLevel = data.cell.raw as string
        if (riskLevel === "Critical") data.cell.styles.textColor = [220, 38, 38]
        else if (riskLevel === "High") data.cell.styles.textColor = [234, 88, 12]
        else if (riskLevel === "Medium") data.cell.styles.textColor = [202, 138, 4]
        else if (riskLevel === "Low") data.cell.styles.textColor = [34, 197, 94]
      }
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Failure Modes Analysis Section
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Failure Modes Analysis", 14, yPos)
  yPos += 8

  // Sort failure modes by RPN (descending)
  const sortedFailureModes = [...failureModes].sort((a, b) => b.rpn - a.rpn)

  autoTable(doc, {
    startY: yPos,
    head: [["Failure Mode", "Cause", "Effect", "S", "O", "D", "RPN", "Risk"]],
    body: sortedFailureModes.map((mode) => [
      mode.failureMode,
      mode.cause,
      mode.effect,
      mode.severity.toString(),
      mode.occurrence.toString(),
      mode.detection.toString(),
      mode.rpn.toString(),
      getRiskLevel(mode.rpn),
    ]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [41, 37, 36], textColor: [255, 255, 255], fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 12, halign: "center" },
      6: { cellWidth: 15, halign: "center" },
      7: { cellWidth: 20, halign: "center" },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 7) {
        const riskLevel = data.cell.raw as string
        if (riskLevel === "Critical") data.cell.styles.textColor = [220, 38, 38]
        else if (riskLevel === "High") data.cell.styles.textColor = [234, 88, 12]
        else if (riskLevel === "Medium") data.cell.styles.textColor = [202, 138, 4]
        else if (riskLevel === "Low") data.cell.styles.textColor = [34, 197, 94]
        data.cell.styles.fontStyle = "bold"
      }
    },
  })

  // Weibull Parameters Section (if available)
  if (Object.keys(weibullParameters).length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 15

    // Check if we need a new page
    if (yPos > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Weibull Parameters", 14, yPos)
    yPos += 8

    const weibullData = Object.entries(weibullParameters).map(([mode, params]) => [
      mode,
      params.shape.toFixed(2),
      params.scale.toFixed(2),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["Failure Mode", "Shape (β)", "Scale (η)"]],
      body: weibullData,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [41, 37, 36], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    })
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128)
    doc.text(
      `Generated by ReliabilityTools.ai | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }

  // Save the PDF
  const fileName = `FMEA_${assetType.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}
