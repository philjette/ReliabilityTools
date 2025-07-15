"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { CSVTemplateButton } from "@/components/csv-template-button"
import { WeibullChart } from "@/components/weibull-chart"
import { WeibullParameters } from "@/components/weibull-parameters"
import { estimateWeibullParameters } from "@/lib/weibull-mle"
import { Upload, BarChart3, FileSpreadsheet, TrendingUp } from "lucide-react"

interface AnalysisData {
  failureTimes: number[]
  weibullParams: {
    shape: number
    scale: number
    reliability: Array<{ time: number; reliability: number }>
    hazardRate: Array<{ time: number; hazardRate: number }>
  }
  statistics: {
    meanTime: number
    medianTime: number
    totalFailures: number
    dataPoints: number
  }
}

export default function AnalyzePage() {
  const { toast } = useToast()
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      // Skip header row and parse failure times
      const failureTimes = lines
        .slice(1)
        .map((line) => {
          const columns = line.split(",")
          return Number.parseFloat(columns[1]) // Assuming failure time is in second column
        })
        .filter((time) => !isNaN(time) && time > 0)

      if (failureTimes.length < 3) {
        throw new Error("Need at least 3 valid failure time data points")
      }

      // Calculate Weibull parameters
      const weibullParams = estimateWeibullParameters(failureTimes)

      // Generate reliability and hazard rate curves
      const maxTime = Math.max(...failureTimes) * 1.5
      const timePoints = Array.from({ length: 100 }, (_, i) => (i + 1) * (maxTime / 100))

      const reliability = timePoints.map((t) => ({
        time: t,
        reliability: Math.exp(-Math.pow(t / weibullParams.scale, weibullParams.shape)),
      }))

      const hazardRate = timePoints.map((t) => ({
        time: t,
        hazardRate:
          (weibullParams.shape / weibullParams.scale) * Math.pow(t / weibullParams.scale, weibullParams.shape - 1),
      }))

      // Calculate statistics
      const meanTime = failureTimes.reduce((sum, time) => sum + time, 0) / failureTimes.length
      const sortedTimes = [...failureTimes].sort((a, b) => a - b)
      const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)]

      setAnalysisData({
        failureTimes,
        weibullParams: {
          ...weibullParams,
          reliability,
          hazardRate,
        },
        statistics: {
          meanTime,
          medianTime,
          totalFailures: failureTimes.length,
          dataPoints: failureTimes.length,
        },
      })

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${failureTimes.length} failure data points`,
      })
    } catch (error) {
      console.error("Error analyzing data:", error)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the data",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reliability Data Analysis</h1>
          <p className="text-gray-600">
            Upload failure data to perform Weibull distribution analysis and reliability modeling
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Data Upload
                </CardTitle>
                <CardDescription>Upload your failure time data for analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dataFile">CSV Data File</Label>
                  <Input id="dataFile" type="file" accept=".csv" onChange={handleFileUpload} disabled={isAnalyzing} />
                  <p className="text-xs text-gray-500 mt-1">Upload a CSV file with failure time data</p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Need a template?</h4>
                  <CSVTemplateButton />
                  <p className="text-xs text-gray-500 mt-2">Download a sample CSV template with the correct format</p>
                </div>

                {analysisData && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Data Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data Points:</span>
                        <span className="font-medium">{analysisData.statistics.dataPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mean Time:</span>
                        <span className="font-medium">{analysisData.statistics.meanTime.toFixed(1)} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Median Time:</span>
                        <span className="font-medium">{analysisData.statistics.medianTime.toFixed(1)} hrs</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {analysisData ? (
              <div className="space-y-6">
                {/* Weibull Parameters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Weibull Parameters
                    </CardTitle>
                    <CardDescription>Estimated distribution parameters from your failure data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WeibullParameters
                      shape={analysisData.weibullParams.shape}
                      scale={analysisData.weibullParams.scale}
                    />
                  </CardContent>
                </Card>

                {/* Charts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Reliability Analysis
                    </CardTitle>
                    <CardDescription>Reliability and hazard rate curves based on Weibull distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WeibullChart
                      reliabilityData={analysisData.weibullParams.reliability}
                      hazardRateData={analysisData.weibullParams.hazardRate}
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Uploaded</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Upload a CSV file with failure time data to begin your reliability analysis
                  </p>
                  <CSVTemplateButton />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
