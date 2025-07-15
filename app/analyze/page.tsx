"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Download, BarChart3, FileSpreadsheet, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WeibullChart } from "@/components/weibull-chart"
import { WeibullParameters } from "@/components/weibull-parameters"
import { CSVTemplateButton } from "@/components/csv-template-button"
import { useToast } from "@/components/ui/use-toast"

interface AnalysisResult {
  assetName: string
  totalFailures: number
  meanTimeBetweenFailures: number
  weibullShape: number
  weibullScale: number
  reliability90Days: number
  reliability1Year: number
  failureData: number[]
}

export default function AnalyzePage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const parseCSV = (csvText: string) => {
    const lines = csvText.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim())

    const data: Record<string, any>[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      const row: Record<string, any> = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      data.push(row)
    }

    return data
  }

  const calculateWeibullParameters = (failureTimes: number[]) => {
    // Simple method of moments estimation for Weibull parameters
    const sortedTimes = failureTimes.sort((a, b) => a - b)
    const n = sortedTimes.length

    if (n < 2) return { shape: 2, scale: 1000 }

    const mean = sortedTimes.reduce((sum, t) => sum + t, 0) / n
    const variance = sortedTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / (n - 1)

    // Rough approximation for Weibull parameters
    const cv = Math.sqrt(variance) / mean
    let shape = 1 / (cv * cv)
    if (shape < 0.5) shape = 0.5
    if (shape > 5) shape = 5

    const scale = mean / Math.pow(0.8862, 1 / shape) // Gamma function approximation

    return { shape, scale }
  }

  const calculateReliability = (t: number, shape: number, scale: number) => {
    return Math.exp(-Math.pow(t / scale, shape))
  }

  const analyzeData = async () => {
    if (!file) return

    setIsAnalyzing(true)
    setUploadProgress(0)

    try {
      const text = await file.text()
      setUploadProgress(30)

      const data = parseCSV(text)
      setUploadProgress(60)

      // Group data by asset
      const assetGroups: Record<string, any[]> = {}
      data.forEach((row) => {
        const assetName = row["Asset Name"] || row["asset_name"] || "Unknown Asset"
        if (!assetGroups[assetName]) {
          assetGroups[assetName] = []
        }
        assetGroups[assetName].push(row)
      })

      const results: AnalysisResult[] = []

      Object.entries(assetGroups).forEach(([assetName, assetData]) => {
        // Extract failure times (assuming column names like "Failure Time", "Time to Failure", etc.)
        const failureTimes = assetData
          .map((row) => {
            const timeValue =
              row["Failure Time"] ||
              row["Time to Failure"] ||
              row["failure_time"] ||
              row["time_to_failure"] ||
              row["Hours"] ||
              row["Days"]
            return Number.parseFloat(timeValue)
          })
          .filter((time) => !isNaN(time) && time > 0)

        if (failureTimes.length > 0) {
          const { shape, scale } = calculateWeibullParameters(failureTimes)
          const mtbf = failureTimes.reduce((sum, t) => sum + t, 0) / failureTimes.length

          results.push({
            assetName,
            totalFailures: failureTimes.length,
            meanTimeBetweenFailures: mtbf,
            weibullShape: shape,
            weibullScale: scale,
            reliability90Days: calculateReliability(90 * 24, shape, scale), // 90 days in hours
            reliability1Year: calculateReliability(365 * 24, shape, scale), // 1 year in hours
            failureData: failureTimes,
          })
        }
      })

      setAnalysisResults(results)
      setUploadProgress(100)

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${results.length} asset(s)`,
      })
    } catch (error) {
      console.error("Error analyzing data:", error)
      toast({
        title: "Analysis Failed",
        description: "Error processing the CSV file. Please check the format.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const exportResults = () => {
    if (analysisResults.length === 0) return

    const csvContent = [
      "Asset Name,Total Failures,MTBF (hours),Weibull Shape,Weibull Scale,Reliability (90 days),Reliability (1 year)",
      ...analysisResults.map((result) =>
        [
          result.assetName,
          result.totalFailures,
          result.meanTimeBetweenFailures.toFixed(2),
          result.weibullShape.toFixed(3),
          result.weibullScale.toFixed(2),
          (result.reliability90Days * 100).toFixed(2) + "%",
          (result.reliability1Year * 100).toFixed(2) + "%",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `reliability_analysis_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header activePath="/analyze" />
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold">Reliability Data Analysis</h1>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Upload your asset failure data to perform comprehensive reliability analysis including Weibull
                distribution fitting and reliability predictions.
              </p>
            </div>

            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Data Upload
                </CardTitle>
                <CardDescription>Upload a CSV file containing your asset failure data for analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <CSVTemplateButton />
                  <Badge variant="outline" className="text-xs">
                    CSV Format Required
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Select CSV File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>

                  {file && (
                    <Alert>
                      <FileSpreadsheet className="h-4 w-4" />
                      <AlertDescription>
                        Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </AlertDescription>
                    </Alert>
                  )}

                  {uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}

                  <Button onClick={analyzeData} disabled={!file || isAnalyzing} className="w-full">
                    {isAnalyzing ? "Analyzing Data..." : "Analyze Data"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {analysisResults.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Analysis Results
                      </CardTitle>
                      <CardDescription>Reliability analysis for {analysisResults.length} asset(s)</CardDescription>
                    </div>
                    <Button onClick={exportResults} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Results
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="weibull">Weibull Analysis</TabsTrigger>
                      <TabsTrigger value="parameters">Parameters</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="space-y-4">
                      <div className="grid gap-4">
                        {analysisResults.map((result, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-3">{result.assetName}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Total Failures:</span>
                                <div className="text-lg font-bold text-red-600">{result.totalFailures}</div>
                              </div>
                              <div>
                                <span className="font-medium">MTBF (hours):</span>
                                <div className="text-lg font-bold text-blue-600">
                                  {result.meanTimeBetweenFailures.toFixed(0)}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">90-Day Reliability:</span>
                                <div className="text-lg font-bold text-green-600">
                                  {(result.reliability90Days * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">1-Year Reliability:</span>
                                <div className="text-lg font-bold text-orange-600">
                                  {(result.reliability1Year * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="weibull" className="space-y-4">
                      {analysisResults.map((result, index) => (
                        <div key={index} className="space-y-4">
                          <h3 className="font-semibold text-lg">{result.assetName}</h3>
                          <div className="grid gap-4 lg:grid-cols-3">
                            <WeibullChart
                              type="cdf"
                              shape={result.weibullShape}
                              scale={result.weibullScale}
                              failureModes={[
                                {
                                  name: result.assetName,
                                  shape: result.weibullShape,
                                  scale: result.weibullScale,
                                  color: "#0ea5e9",
                                },
                              ]}
                              showCombined={false}
                            />
                            <WeibullChart
                              type="pdf"
                              shape={result.weibullShape}
                              scale={result.weibullScale}
                              failureModes={[
                                {
                                  name: result.assetName,
                                  shape: result.weibullShape,
                                  scale: result.weibullScale,
                                  color: "#10b981",
                                },
                              ]}
                              showCombined={false}
                            />
                            <WeibullChart
                              type="hazard"
                              shape={result.weibullShape}
                              scale={result.weibullScale}
                              failureModes={[
                                {
                                  name: result.assetName,
                                  shape: result.weibullShape,
                                  scale: result.weibullScale,
                                  color: "#f59e0b",
                                },
                              ]}
                              showCombined={false}
                            />
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="parameters" className="space-y-4">
                      <WeibullParameters
                        failureModes={analysisResults.map((result) => ({
                          name: result.assetName,
                          description: `Analysis of ${result.totalFailures} failures`,
                          severity: 5,
                          occurrence: 5,
                          detection: 5,
                        }))}
                        weibullParameters={Object.fromEntries(
                          analysisResults.map((result) => [
                            result.assetName,
                            { shape: result.weibullShape, scale: result.weibullScale },
                          ]),
                        )}
                        onParameterChange={() => {}} // Read-only for analysis results
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
