"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Upload, Loader2, Save, TrendingUp, Clock, BarChart3, Database, Download, CircleDot } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { WeibullChart } from "@/components/weibull-chart"
import { uploadAssetDataClient, fitWeibullFromAssetData, saveWeibullCurveClient } from "@/lib/weibull-analysis-client"
import type { WeibullAnalysisResult } from "@/lib/weibull-analysis-actions"
import { useToast } from "@/hooks/use-toast"

interface WeibullAnalysisUploadProps {
  onResultsChange?: (hasResults: boolean) => void
}

export function WeibullAnalysisUpload({ onResultsChange }: WeibullAnalysisUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<WeibullAnalysisResult | null>(null)
  const [timeUnit, setTimeUnit] = useState<"hours" | "years">("years")
  const [chartType, setChartType] = useState<"cdf" | "pdf" | "hazard">("cdf")
  const [curveName, setCurveName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showDataPoints, setShowDataPoints] = useState(true)
  const { toast } = useToast()

  const formatMTTF = (mttf: number) => {
    if (mttf >= 8760) {
      return `${(mttf / 8760).toFixed(1)} years`
    } else if (mttf >= 24) {
      return `${(mttf / 24).toFixed(1)} days`
    } else {
      return `${mttf.toFixed(0)} hours`
    }
  }

  const getShapeInterpretation = (shape: number) => {
    if (shape < 1) return "Early failures (infant mortality)"
    if (shape === 1) return "Random failures (exponential)"
    if (shape > 1 && shape < 2) return "Wear-out failures"
    return "Rapid wear-out failures"
  }

  const getShapeColor = (shape: number) => {
    if (shape < 1) return "bg-blue-100 text-blue-800"
    if (shape === 1) return "bg-green-100 text-green-800"
    if (shape > 1 && shape < 2) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

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
      onResultsChange?.(false)
    }
  }

  const MS_PER_HOUR = 60 * 60 * 1000

  function getTemplateCSV(): string {
    const header = "Asset ID,Install date,Failure date"
    const rows: string[] = [header]
    const now = new Date()
    const baseYear = 2010
    for (let i = 1; i <= 100; i++) {
      const assetId = `Asset-${i}`
      const installYear = baseYear + Math.floor((i * 17) % 14)
      const installMonth = 1 + (i % 12)
      const installDay = 1 + (i % 28)
      const installDate = new Date(installYear, installMonth - 1, installDay)
      const installStr = installDate.toISOString().slice(0, 10)
      const isCensored = (i - 1) % 4 === 0
      let failureStr = ""
      if (!isCensored) {
        const maxYearsToNow = (now.getTime() - installDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        const yearsToFailure = Math.min(0.8 + (i % 100) / 100 * 8, Math.max(0.5, maxYearsToNow - 0.1))
        const failureDate = new Date(installDate.getTime() + yearsToFailure * 365.25 * 24 * 60 * 60 * 1000)
        failureStr = failureDate.toISOString().slice(0, 10)
      }
      rows.push(`${assetId},${installStr},${failureStr}`)
    }
    return rows.join("\n")
  }

  const handleDownloadTemplate = () => {
    const csv = getTemplateCSV()
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "weibull-upload-template.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Template downloaded", description: "weibull-upload-template.csv" })
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n")
    const data: Array<{ assetId: string; installDate: string; failureDate: string | null }> = []
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const columns = line.split(",")
      if (columns.length < 2) continue
      
      const assetId = columns[0].trim()
      const installDate = columns[1].trim()
      const failureDateRaw = columns[2]?.trim()
      const failureDate =
        !failureDateRaw || failureDateRaw.toLowerCase() === "null" || failureDateRaw === ""
          ? null
          : failureDateRaw
      
      const installParsed = new Date(installDate)
      if (isNaN(installParsed.getTime())) continue
      if (failureDate) {
        const failureParsed = new Date(failureDate)
        if (isNaN(failureParsed.getTime()) || failureParsed.getTime() < installParsed.getTime()) continue
      }
      
      data.push({ assetId, installDate, failureDate })
    }
    
    return data
  }

  const handleAnalysis = async () => {
    if (!file) return

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

      // Compute time in hours from dates. Missing failure date = right-censored (survived at least to now).
      const now = Date.now()
      const assetData = data.map((d) => {
        const installMs = new Date(d.installDate).getTime()
        const endMs = d.failureDate ? new Date(d.failureDate).getTime() : now
        const timeInHours = (endMs - installMs) / MS_PER_HOUR
        const installation_date = new Date(installMs).toISOString().split("T")[0]
        const failure_date = d.failureDate
          ? new Date(d.failureDate).toISOString().split("T")[0]
          : null
        return {
          asset_name: d.assetId,
          installation_date,
          failure_date,
          failure_time_hours: Math.max(timeInHours, 0)
        }
      })

      // Upload data to temporary table (for persistence / save flow)
      const uploadResult = await uploadAssetDataClient(assetData)
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload data")
      }

      // Fit on the same in-memory data so the chart reflects this CSV exactly
      const analysisResult = fitWeibullFromAssetData(assetData)
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || "Failed to fit Weibull parameters")
      }

      setResults(analysisResult.result || null)
      setCurveName(analysisResult.result?.curve_name || "")
      onResultsChange?.(!!analysisResult.result)
      
      toast({
        title: "Analysis Complete",
        description: "Weibull parameters have been successfully fitted to your data.",
      })
    } catch (err) {
      console.error("Error analyzing data:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze data")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveCurve = async () => {
    if (!results || !curveName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the curve",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const saveResult = await saveWeibullCurveClient(curveName.trim(), results)
      if (saveResult.success) {
        toast({
          title: "Curve Saved",
          description: "Your Weibull curve has been saved successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: saveResult.error || "Failed to save curve",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save curve: " + (err as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Asset Failure Data</CardTitle>
          <CardDescription>
            Upload a CSV file containing asset failure times to perform Weibull analysis and estimate reliability parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">CSV File</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleDownloadTemplate} className="shrink-0">
                <Download className="mr-2 h-4 w-4" />
                Download template
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              CSV format: Asset ID, Install date, Failure date. Use YYYY-MM-DD for dates. If Failure date is empty or &quot;null&quot;, the asset is right-censored (has not yet failed; time under observation is from install to now). The template has 100 sample records you can replace with your own data.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleAnalysis}
            disabled={!file || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                
                {chartType === "cdf" && results.raw_data_points && results.raw_data_points.length > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <CircleDot className="h-4 w-4 text-orange-500" />
                      <Label htmlFor="show-data-points" className="cursor-pointer">
                        Show Data Points
                      </Label>
                    </div>
                    <Switch
                      id="show-data-points"
                      checked={showDataPoints}
                      onCheckedChange={setShowDataPoints}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Analysis completed successfully! Review the Weibull parameters and charts below.
              {results.with_censored && " The overview below uses the fit that includes right-censored data (less biased). The chart shows both series for comparison."}
            </AlertDescription>
          </Alert>

          {/* Analysis Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Overview</CardTitle>
              <CardDescription>Key parameters and statistics from the Weibull analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {results.with_censored ? (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Complete (failures only)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-blue-50/50">
                        <div className="text-xl font-bold">{results.complete_only!.shape_parameter.toFixed(3)}</div>
                        <div className="text-xs text-gray-600">Shape (β)</div>
                        <Badge className={`mt-1 text-xs ${getShapeColor(results.complete_only!.shape_parameter)}`}>
                          {getShapeInterpretation(results.complete_only!.shape_parameter)}
                        </Badge>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-blue-50/50">
                        <div className="text-xl font-bold">
                          {timeUnit === "years"
                            ? (results.complete_only!.scale_parameter / 8760).toFixed(2)
                            : results.complete_only!.scale_parameter.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-gray-600">Scale (η)</div>
                        <div className="text-xs text-gray-500">{timeUnit}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-purple-50/50">
                        <div className="text-xl font-bold">
                          {timeUnit === "years"
                            ? `${(results.mttf / 8760).toFixed(2)} years`
                            : formatMTTF(results.mttf)}
                        </div>
                        <div className="text-xs text-gray-600">Mean Time to Failure</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-orange-50/50">
                        <div className="text-xl font-bold">{results.complete_only!.total_failures}</div>
                        <div className="text-xs text-gray-600">Failures</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">With right-censored</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-green-50/50">
                        <div className="text-xl font-bold">{results.with_censored.shape_parameter.toFixed(3)}</div>
                        <div className="text-xs text-gray-600">Shape (β)</div>
                        <Badge className={`mt-1 text-xs ${getShapeColor(results.with_censored.shape_parameter)}`}>
                          {getShapeInterpretation(results.with_censored.shape_parameter)}
                        </Badge>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-50/50">
                        <div className="text-xl font-bold">
                          {timeUnit === "years"
                            ? (results.with_censored.scale_parameter / 8760).toFixed(2)
                            : results.with_censored.scale_parameter.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-gray-600">Scale (η)</div>
                        <div className="text-xs text-gray-500">{timeUnit}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-purple-50/50">
                        <div className="text-xl font-bold">
                          {timeUnit === "years"
                            ? `${(results.mttf / 8760).toFixed(2)} years`
                            : formatMTTF(results.mttf)}
                        </div>
                        <div className="text-xs text-gray-600">Mean Time to Failure</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-orange-50/50">
                        <div className="text-xl font-bold">{results.with_censored.data_points}</div>
                        <div className="text-xs text-gray-600">Total (failures + censored)</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold">{results.shape_parameter.toFixed(3)}</div>
                    <div className="text-sm text-gray-600">Shape Parameter (β)</div>
                    <Badge className={`mt-2 ${getShapeColor(results.shape_parameter)}`}>
                      {getShapeInterpretation(results.shape_parameter)}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold">
                      {timeUnit === "years"
                        ? (results.scale_parameter / 8760).toFixed(2)
                        : results.scale_parameter.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-gray-600">Scale Parameter (η)</div>
                    <div className="text-xs text-gray-500 mt-1">{timeUnit}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold">
                      {timeUnit === "years"
                        ? `${(results.mttf / 8760).toFixed(2)} years`
                        : formatMTTF(results.mttf)}
                    </div>
                    <div className="text-sm text-gray-600">Mean Time to Failure</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
                      <Database className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold">{results.data_points}</div>
                    <div className="text-sm text-gray-600">Data Points</div>
                    <div className="text-xs text-gray-500 mt-1">failures analyzed</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {results.with_censored && (
            <p className="text-sm text-muted-foreground mb-2">
              Including right-censored data (units that haven’t failed yet) uses the fact that they survived at least until their observation time. That usually increases the estimated scale and <strong>lowers</strong> the cumulative probability of failure at a given time, so the green curve (“With right-censored”) typically sits at or below the blue curve (“Complete (failures only)”). Use the green curve for less biased estimates.
            </p>
          )}
          
          <WeibullChart
            type={chartType}
            shape={results.shape_parameter}
            scale={results.scale_parameter}
            timeUnit={timeUnit}
            failureModes={results.with_censored ? [
              { name: "Complete (failures only)", shape: results.complete_only!.shape_parameter, scale: results.complete_only!.scale_parameter, color: "#0ea5e9" },
              { name: "With right-censored", shape: results.with_censored.shape_parameter, scale: results.with_censored.scale_parameter, color: "#22c55e" }
            ] : []}
            rawDataPoints={results.raw_data_points}
            showDataPoints={showDataPoints}
          />

          <Card>
            <CardHeader>
              <CardTitle>Save Analysis</CardTitle>
              <CardDescription>
                Save this Weibull analysis with a custom name for future reference.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="curve-name">Curve Name</Label>
                <Input
                  id="curve-name"
                  value={curveName}
                  onChange={(e) => setCurveName(e.target.value)}
                  placeholder="Enter a name for this analysis"
                />
              </div>
              <Button
                onClick={handleSaveCurve}
                disabled={!curveName.trim() || isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
