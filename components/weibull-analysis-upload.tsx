"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Upload, Loader2, Save, TrendingUp, Clock, BarChart3, Database } from "lucide-react"
import { WeibullChart } from "@/components/weibull-chart"
import { uploadAssetDataClient, fitWeibullParametersClient, saveWeibullCurveClient, type WeibullAnalysisResult } from "@/lib/weibull-analysis-client"
import { useToast } from "@/hooks/use-toast"

export function WeibullAnalysisUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<WeibullAnalysisResult | null>(null)
  const [timeUnit, setTimeUnit] = useState<"hours" | "years">("hours")
  const [chartType, setChartType] = useState<"cdf" | "pdf" | "hazard">("cdf")
  const [curveName, setCurveName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
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
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n")
    const data: Array<{ assetId: string; timeToFailure: number; censored: boolean }> = []
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const columns = line.split(",")
      if (columns.length < 2) continue
      
      const assetId = columns[0].trim()
      const timeToFailure = parseFloat(columns[1].trim())
      const censored = columns[2]?.trim().toLowerCase() === "true" || false
      
      if (!isNaN(timeToFailure) && timeToFailure > 0) {
        data.push({ assetId, timeToFailure, censored })
      }
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

      // Convert to the format expected by server actions
      const assetData = data.map((d) => ({
        asset_name: d.assetId,
        installation_date: new Date(Date.now() - d.timeToFailure * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        failure_date: new Date().toISOString().split('T')[0],
        failure_time_hours: d.timeToFailure
      }))

      // Upload data to temporary table
      const uploadResult = await uploadAssetDataClient(assetData)
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload data")
      }

      // Fit Weibull parameters
      const analysisResult = await fitWeibullParametersClient(uploadResult.tempDataId || "")
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || "Failed to fit Weibull parameters")
      }

      setResults(analysisResult.result || null)
      setCurveName(analysisResult.result?.curve_name || "")
      
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
            <div className="flex gap-2">
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
            <p className="text-sm text-gray-600">
              CSV format: Asset ID, Time to Failure (hours), Censored (true/false)
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
              </div>
            </CardContent>
          </Card>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Analysis completed successfully! Review the Weibull parameters and charts below.
            </AlertDescription>
          </Alert>

          {/* Analysis Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Overview</CardTitle>
              <CardDescription>Key parameters and statistics from the Weibull analysis</CardDescription>
            </CardHeader>
            <CardContent>
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
                  <div className="text-2xl font-bold">{results.scale_parameter.toFixed(0)}</div>
                  <div className="text-sm text-gray-600">Scale Parameter (η)</div>
                  <div className="text-xs text-gray-500 mt-1">hours</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold">{formatMTTF(results.mttf)}</div>
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
            </CardContent>
          </Card>
          
          <WeibullChart 
            type={chartType} 
            shape={results.shape_parameter} 
            scale={results.scale_parameter} 
            timeUnit={timeUnit} 
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
