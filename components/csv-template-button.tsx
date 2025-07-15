"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function CSVTemplateButton() {
  const handleDownload = () => {
    const csvContent = `Asset_ID,Failure_Time_Hours,Failure_Mode,Environment
T001,8760,Insulation Breakdown,Outdoor
T002,12450,Contact Wear,Indoor
T003,6890,Cooling System Failure,Outdoor
T004,15670,Bushing Failure,Indoor
T005,9340,Tap Changer Malfunction,Outdoor
T006,11200,Oil Leak,Indoor
T007,7650,Winding Fault,Outdoor
T008,13890,Protection System Failure,Indoor
T009,10450,Corrosion,Outdoor
T010,14230,Mechanical Failure,Indoor`

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
