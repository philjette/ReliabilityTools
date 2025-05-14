"use client"

import { useState } from "react"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CSVTemplateButton() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateTemplate = () => {
    setIsGenerating(true)

    try {
      // Create CSV content
      const headers = "asset_id,install_date,retirement_date"
      const sampleData = [
        "A001,2020-01-15,2022-06-30",
        "A002,2020-02-01,",
        "A003,2019-11-10,2023-03-15",
        "A004,2021-05-22,",
        "A005,2018-07-01,2022-12-10",
      ].join("\n")

      const csvContent = `${headers}\n${sampleData}`

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "asset_data_template.csv")
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error generating template:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={generateTemplate} disabled={isGenerating}>
      <FileDown className="h-4 w-4 mr-2" />
      {isGenerating ? "Generating..." : "Download CSV Template"}
    </Button>
  )
}
