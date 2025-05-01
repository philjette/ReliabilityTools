"use server"

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { FailureMode } from "@/lib/actions"

// Helper function to get asset type label
function getAssetTypeLabel(assetType: string): string {
  const assetTypes = [
    { value: "transformer", label: "Power Transformer" },
    { value: "circuit_breaker", label: "Circuit Breaker" },
    { value: "switchgear", label: "Switchgear" },
    { value: "overhead_line", label: "Overhead Transmission Line" },
    { value: "underground_cable", label: "Underground Cable" },
    { value: "capacitor_bank", label: "Capacitor Bank" },
    { value: "reactor", label: "Shunt Reactor" },
    { value: "disconnect_switch", label: "Disconnect Switch" },
    { value: "surge_arrester", label: "Surge Arrester" },
    { value: "insulator", label: "Insulator" },
  ]
  return assetTypes.find((type) => type.value === assetType)?.label || assetType
}

// Helper function to get voltage rating label
function getVoltageRatingLabel(voltageRating: string): string {
  const voltageRatings = [
    { value: "lv", label: "Low Voltage (< 1kV)" },
    { value: "mv", label: "Medium Voltage (1kV - 35kV)" },
    { value: "hv", label: "High Voltage (36kV - 230kV)" },
    { value: "ehv", label: "Extra High Voltage (> 230kV)" },
  ]
  return voltageRatings.find((rating) => rating.value === voltageRating)?.label || voltageRating
}

// Helper function to get operating environment label
function getOperatingEnvironmentLabel(environment: string): string {
  const environments = [
    { value: "indoor", label: "Indoor" },
    { value: "outdoor", label: "Outdoor" },
    { value: "coastal", label: "Coastal/High Salinity" },
    { value: "extreme_climate", label: "Extreme Hot/Cold Climate" },
  ]
  return environments.find((env) => env.value === environment)?.label || environment
}

// Helper function to get age range label
function getAgeRangeLabel(ageRange: string): string {
  const ageRanges = [
    { value: "new", label: "New (< 5 years)" },
    { value: "mid_life", label: "Mid-life (5-15 years)" },
    { value: "mature", label: "Mature (16-30 years)" },
    { value: "end_of_life", label: "End of Life (> 30 years)" },
  ]
  return ageRanges.find((age) => age.value === ageRange)?.label || ageRange
}

// Helper function to get criticality label
function getCriticalityLabel(criticality: string): string {
  const criticalityLevels = [
    { value: "high", label: "High Criticality" },
    { value: "medium", label: "Medium Criticality" },
    { value: "low", label: "Low Criticality" },
  ]
  return criticalityLevels.find((level) => level.value === criticality)?.label || criticality
}

interface GeneratePdfParams {
  title: string
  assetType: string
  voltageRating: string
  operatingEnvironment: string
  ageRange: string
  loadProfile: string
  assetCriticality: string
  additionalNotes?: string
  failureModes: FailureMode[]
  weibullParameters: Record<string, { shape: number; scale: number }>
  createdAt?: string
}

export async function generateFmeaPdf(params: GeneratePdfParams): Promise<Uint8Array> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Set document properties
  doc.setProperties({
    title: `FMEA Report - ${params.title}`,
    subject: "Failure Mode and Effects Analysis",
    author: "ReliabilityTools.ai",
    creator: "ReliabilityTools.ai",
  })

  // Add header with logo and title
  doc.setFontSize(22)
  doc.setTextColor(44, 62, 80) // Dark blue color
  doc.text("ReliabilityTools.ai", 15, 20)

  doc.setFontSize(18)
  doc.text("Failure Mode and Effects Analysis (FMEA)", 15, 30)

  doc.setFontSize(14)
  doc.text(params.title, 15, 40)

  // Add creation date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100) // Gray color
  const creationDate = params.createdAt
    ? new Date(params.createdAt).toLocaleDateString()
    : new Date().toLocaleDateString()
  doc.text(`Generated on: ${creationDate}`, 15, 48)

  // Add asset information section
  doc.setFontSize(12)
  doc.setTextColor(44, 62, 80)
  doc.text("Asset Information", 15, 60)

  // Asset information table
  autoTable(doc, {
    startY: 65,
    head: [["Parameter", "Value"]],
    body: [
      ["Asset Type", getAssetTypeLabel(params.assetType)],
      ["Voltage Rating", getVoltageRatingLabel(params.voltageRating)],
      ["Operating Environment", getOperatingEnvironmentLabel(params.operatingEnvironment)],
      ["Asset Age", getAgeRangeLabel(params.ageRange)],
      ["Load Profile", params.loadProfile],
      ["Asset Criticality", getCriticalityLabel(params.assetCriticality)],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185], // Blue header
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 50 },
    },
    margin: { left: 15, right: 15 },
  })

  // Add additional notes if provided
  if (params.additionalNotes) {
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.text("Additional Notes:", 15, finalY)
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)

    // Split long text into multiple lines
    const splitNotes = doc.splitTextToSize(params.additionalNotes, 180)
    doc.text(splitNotes, 15, finalY + 7)
  }

  // Add failure modes section
  let startY = params.additionalNotes
    ? (doc as any).lastAutoTable.finalY + 20 + Math.min(doc.splitTextToSize(params.additionalNotes, 180).length * 5, 30)
    : (doc as any).lastAutoTable.finalY + 15

  doc.setFontSize(12)
  doc.setTextColor(44, 62, 80)
  doc.text("Failure Modes Analysis", 15, startY)

  // Add each failure mode
  params.failureModes.forEach((mode, index) => {
    // Check if we need a new page
    if (startY > 250) {
      doc.addPage()
      startY = 20
    }

    // Calculate RPN
    const rpn = mode.severity * mode.occurrence * mode.detection

    // Failure mode header
    startY += 10
    doc.setFontSize(11)
    doc.setTextColor(41, 128, 185)
    doc.text(`${index + 1}. ${mode.name}`, 15, startY)

    // RPN indicator
    let rpnColor = [243, 156, 18] // Yellow (medium)
    if (rpn > 150)
      rpnColor = [231, 76, 60] // Red (high)
    else if (rpn < 100) rpnColor = [46, 204, 113] // Green (low)

    doc.setFillColor(rpnColor[0], rpnColor[1], rpnColor[2])
    doc.roundedRect(170, startY - 4, 25, 7, 1, 1, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text(`RPN: ${rpn}`, 172, startY)

    // Description
    startY += 7
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    const splitDesc = doc.splitTextToSize(mode.description, 180)
    doc.text(splitDesc, 15, startY)
    startY += splitDesc.length * 5

    // Severity, Occurrence, Detection table
    autoTable(doc, {
      startY: startY,
      head: [["Severity", "Occurrence", "Detection"]],
      body: [[mode.severity, mode.occurrence, mode.detection]],
      theme: "grid",
      headStyles: {
        fillColor: [189, 195, 199], // Light gray header
        textColor: [44, 62, 80],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      margin: { left: 15, right: 15 },
    })

    startY = (doc as any).lastAutoTable.finalY + 5

    // Causes, Effects, Recommendations
    const causesEffectsData = [
      ["Causes", mode.causes?.join("\n") || ""],
      ["Effects", mode.effects?.join("\n") || ""],
      ["Recommendations", mode.recommendations?.join("\n") || ""],
    ]

    autoTable(doc, {
      startY: startY,
      body: causesEffectsData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: "bold" },
      },
      margin: { left: 15, right: 15 },
    })

    startY = (doc as any).lastAutoTable.finalY + 5

    // Maintenance Actions
    if (mode.maintenanceActions && mode.maintenanceActions.length > 0) {
      // Check if we need a new page
      if (startY > 230) {
        doc.addPage()
        startY = 20
      }

      doc.setFontSize(10)
      doc.setTextColor(44, 62, 80)
      doc.text("Preventative Maintenance Plan:", 15, startY)
      startY += 5

      autoTable(doc, {
        startY: startY,
        head: [["Action", "Frequency", "Cost (USD)", "Annual Cost", "Description"]],
        body: mode.maintenanceActions.map((action) => [
          action.action,
          action.frequency,
          `$${action.estimatedCost?.toLocaleString() || "N/A"}`,
          `$${action.annualCost?.toLocaleString() || "N/A"}/year`,
          action.description,
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [52, 152, 219], // Blue header
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
        },
        margin: { left: 15, right: 15 },
      })

      // Calculate total annual maintenance cost for this failure mode
      if (mode.maintenanceActions && mode.maintenanceActions.length > 0) {
        const totalAnnualCost = mode.maintenanceActions.reduce((sum, action) => sum + (action.annualCost || 0), 0)

        startY = (doc as any).lastAutoTable.finalY + 5

        autoTable(doc, {
          startY: startY,
          body: [["Total Annual Maintenance Cost", `$${totalAnnualCost.toLocaleString()} per year`]],
          theme: "grid",
          styles: {
            fontSize: 10,
            cellPadding: 3,
            fontStyle: "bold",
          },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { fontStyle: "bold", textColor: [41, 128, 185] },
          },
          margin: { left: 15, right: 15 },
        })

        startY = (doc as any).lastAutoTable.finalY + 10
      }
    } else {
      startY += 10
    }

    // Add Weibull parameters if available
    if (params.weibullParameters[mode.name]) {
      const weibullParams = params.weibullParameters[mode.name]
      doc.setFontSize(10)
      doc.setTextColor(44, 62, 80)
      doc.text("Weibull Parameters:", 15, startY)
      startY += 5

      autoTable(doc, {
        startY: startY,
        head: [["Parameter", "Value", "Interpretation"]],
        body: [
          [
            "Shape (β)",
            weibullParams.shape.toFixed(2),
            weibullParams.shape < 1
              ? "Decreasing failure rate (early failures)"
              : weibullParams.shape === 1
                ? "Constant failure rate (random failures)"
                : "Increasing failure rate (wear-out failures)",
          ],
          [
            "Scale (η)",
            `${weibullParams.scale.toFixed(0)} hours`,
            "Characteristic life (63.2% of units will fail by this time)",
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [52, 152, 219], // Blue header
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        margin: { left: 15, right: 15 },
      })

      startY = (doc as any).lastAutoTable.finalY + 20
    } else {
      startY += 10
    }
  })

  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `ReliabilityTools.ai - FMEA Report - Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    )
  }

  // Return the PDF as a Uint8Array
  return doc.output("arraybuffer")
}
