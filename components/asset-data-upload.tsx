"use client"

import type React from "react"

import { useState } from "react"
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { estimateWeibullParameters } from "@/lib/weibull-mle"
import { WeibullChart } from "@/components/weibull-chart"
import { CSVTemplateButton } from "@/components/csv-template-button"

interface AssetData {
  assetId: string
  timeToFailure: number
  censored: boolean
}

export function AssetDataUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{
    shape: number
    scale: number
    assetName: string
  } | null>(null)
  const [timeUnit, setTimeUnit] = useState<"hours" | "years">("hours")
  const [chartType, setChartType] = useState<"cdf" | "pdf" | "hazard">("cdf")

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Please upload a CSV file")
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
      setResults(null)
    }
  }

  const parseCSV = (text: string): AssetData[] => {
    const lines = text.trim().split("\n")
    const data: AssetData[] = []

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const [assetId, timeStr, censoredStr] = line.split(",").map((s) => s.trim())

      const timeToFailure = Number.parseFloat(timeStr)
      const censored = censoredStr?.toLowerCase() === "true" || censoredStr === "1"

      if (assetId && !Number.isNaN(timeToFailure)) {
        data.push({
          assetId,
          timeToFailure,
          censored,
        })
      }
    }

    return data
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setIsProcessing(true)
    setError(null)
    setResults(null)

    try {
      const text = await file.text()
      const data = parseCSV(text)

      if (data.length === 0) {
        throw new Error("No valid data found in the CSV file")
      }

      if (data.length < 3) {
        throw new Error("At least 3 data points are required for analysis")
      }

      // Estimate Weibull parameters
      const parameters = estimateWeibullParameters(data)

      setResults({
        shape: parameters.shape,
        scale: parameters.scale,
        assetName: file.name.replace(".csv", ""),
      })
    } catch (err) {
      console.error("Error analyzing data:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze data")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Asset Failure Data</CardTitle>
          <CardDescription>
            Upload a CSV file containing asset failure times to perform Weibull analysis and estimate reliability
            parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">CSV File</Label>
            <div className="flex gap-2">
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <CSVTemplateButton />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleAnalyze} disabled={!file || isProcessing} className="w-full">
            {isProcessing ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Analyzing Data...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Analyze Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>Choose how to display time values and chart type in the analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Time Unit</Label>
                  <RadioGroup value={timeUnit} onValueChange={(value: "hours" | "years") => setTimeUnit(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hours" id="hours" />
                      <Label htmlFor="hours" className="cursor-pointer">
                        Hours
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="years" id="years" />
                      <Label htmlFor="years" className="cursor-pointer">
                        Years (1 year = 8,760 hours)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-3 block">Chart Type</Label>
                  <RadioGroup value={chartType} onValueChange={(value: "cdf" | "pdf" | "hazard") => setChartType(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cdf" id="cdf" />
                      <Label htmlFor="cdf" className="cursor-pointer">
                        CDF (Cumulative Distribution)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pdf" id="pdf" />
                      <Label htmlFor="pdf" className="cursor-pointer">
                        PDF (Probability Density)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hazard" id="hazard" />
                      <Label htmlFor="hazard" className="cursor-pointer">
                        Hazard Rate
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Analysis completed successfully! Review the Weibull parameters and charts below.
            </AlertDescription>
          </Alert>

          <WeibullChart 
            type={chartType} 
            shape={results.shape} 
            scale={results.scale} 
            timeUnit={timeUnit} 
          />
        </>
      )}
    </div>
  )
}
