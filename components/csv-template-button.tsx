"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function CSVTemplateButton() {
  const downloadTemplate = () => {
    const csvContent = [
      "Asset Name,Failure Time,Failure Mode,Operating Hours,Environment,Voltage Rating",
      "Transformer A,2160,Insulation Breakdown,8760,Outdoor,138kV",
      "Transformer A,4320,Cooling System,17520,Outdoor,138kV",
      "Transformer A,6480,Tap Changer,26280,Outdoor,138kV",
      "Circuit Breaker B,1440,Contact Wear,5840,Indoor,69kV",
      "Circuit Breaker B,2880,Arc Chamber,11680,Indoor,69kV",
      "Circuit Breaker B,4320,Operating Mechanism,17520,Indoor,69kV",
      "Cable C,8760,Insulation Degradation,35040,Underground,25kV",
      "Cable C,17520,Water Ingress,70080,Underground,25kV",
      "Switch D,720,Contact Corrosion,2920,Outdoor,12kV",
      "Switch D,1440,Mechanical Wear,5840,Outdoor,12kV",
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "asset_failure_data_template.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={downloadTemplate} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Download CSV Template
    </Button>
  )
}
