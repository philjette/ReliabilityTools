"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function CSVTemplateButton() {
  const handleDownload = () => {
    // Sample data with failure times spanning 15-35 years (131,400 - 306,600 hours)
    // This produces a more realistic shape parameter in the 2-4 range for aging equipment
    const csvContent = `Asset_ID,Failure_Time_Hours,Failure_Mode,Environment
T001,157680,Insulation Breakdown,Outdoor
T002,192720,Contact Wear,Indoor
T003,140160,Cooling System Failure,Outdoor
T004,227760,Bushing Failure,Indoor
T005,166440,Tap Changer Malfunction,Outdoor
T006,183960,Oil Leak,Indoor
T007,148920,Winding Fault,Outdoor
T008,210240,Protection System Failure,Indoor
T009,175200,Corrosion,Outdoor
T010,201480,Mechanical Failure,Indoor`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "failure_data_template.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={handleDownload} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Download CSV Template
    </Button>
  )
}
