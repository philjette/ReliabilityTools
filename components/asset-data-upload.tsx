"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileText, AlertCircle, X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WeibullChart } from "@/components/weibull-chart"
import { assetTypes } from "@/lib/electrical-assets"
import { Progress } from "@/components/ui/progress"

// Asset data interface
interface AssetData {
  id: string
  assetType: string
  installDate: Date
  retirementDate: Date | null
}

// Weibull parameters interface
interface WeibullParams {
  shape: number // β (beta) parameter
  scale: number // η (eta) parameter in hours
}

// Constants
const HOURS_IN_YEAR = 8760

export function AssetDataUpload() {
  const [assetType, setAssetType] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assetData, setAssetData] = useState<AssetData[]>([])
  const [weibullParams, setWeibullParams] = useState<WeibullParams>({ shape: 0, scale: 0 })
  const [goodnessOfFit, setGoodnessOfFit] = useState<{ r2: number; aic: number } | null>(null)
  const [activeTab, setActiveTab] = useState("cdf")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [validationResults, setValidationResults] = useState<{
    totalRows: number
    validRows: number
    invalidRows: number
    warnings: string[]
    preview: AssetData[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setIsAnalyzed(false)
      setError(null)
      setValidationResults(null)
    }
  }

  const validateAndParseCSV = async (file: File): Promise<AssetData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split("\n")
          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

          // Check required headers
          const requiredHeaders = ["asset_id", "install_date"]
          const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))

          if (missingHeaders.length > 0) {
            reject(`Missing required headers: ${missingHeaders.join(", ")}`)
            return
          }

          const assetIdIndex = headers.indexOf("asset_id")
          const installDateIndex = headers.indexOf("install_date")
          const retirementDateIndex = headers.indexOf("retirement_date")

          const parsedData: AssetData[] = []
          const warnings: string[] = []
          let invalidRows = 0

          // Parse data rows
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue // Skip empty lines

            const values = lines[i].split(",").map((v) => v.trim())

            try {
              const assetId = values[assetIdIndex]
              const installDateStr = values[installDateIndex]
              const retirementDateStr = retirementDateIndex >= 0 ? values[retirementDateIndex] : ""

              // Validate asset ID
              if (!assetId) {
                warnings.push(`Row ${i}: Missing asset ID`)
                invalidRows++
                continue
              }

              // Parse and validate install date
              const installDate = new Date(installDateStr)
              if (isNaN(installDate.getTime())) {
                warnings.push(`Row ${i}: Invalid install date format for asset ${assetId}`)
                invalidRows++
                continue
              }

              // Parse retirement date if present
              let retirementDate: Date | null = null
              if (retirementDateStr) {
                retirementDate = new Date(retirementDateStr)
                if (isNaN(retirementDate.getTime())) {
                  warnings.push(`Row ${i}: Invalid retirement date format for asset ${assetId}`)
                  invalidRows++
                  continue
                }

                // Check if retirement date is after install date
                if (retirementDate < installDate) {
                  warnings.push(`Row ${i}: Retirement date is before install date for asset ${assetId}`)
                  invalidRows++
                  continue
                }
              }

              parsedData.push({
                id: assetId,
                assetType: "", // Will be set from dropdown
                installDate,
                retirementDate,
              })
            } catch (err) {
              warnings.push(`Row ${i}: Failed to parse data - ${err}`)
              invalidRows++
            }
          }

          // Set validation results
          setValidationResults({
            totalRows: lines.length - 1,
            validRows: parsedData.length,
            invalidRows,
            warnings,
            preview: parsedData.slice(0, 5), // First 5 rows for preview
          })

          resolve(parsedData)
        } catch (err) {
          reject(`Failed to parse CSV file: ${err}`)
        }
      }

      reader.onerror = () => {
        reject("Error reading file")
      }

      reader.readAsText(file)
    })
  }

  // Function to fit Weibull distribution using MLE
  const fitWeibullMLE = (data: AssetData[]): WeibullParams => {
    // Convert dates to operating hours
    const operatingHours = data.map((asset) => {
      const installDate = new Date(asset.installDate)
      const endDate = asset.retirementDate ? new Date(asset.retirementDate) : new Date()
      // Calculate difference in hours
      const diffTime = Math.abs(endDate.getTime() - installDate.getTime())
      const hours = Math.ceil(diffTime / (1000 * 60 * 60))
      return {
        hours,
        failed: asset.retirementDate !== null,
      }
    })

    // Initial parameter guesses
    let shape = 2.0 // Initial shape parameter guess
    let scale = 10000 // Initial scale parameter guess

    // Maximum iterations for optimization
    const maxIterations = 100
    // Convergence tolerance
    const tolerance = 1e-6

    // Newton-Raphson method for MLE
    let iteration = 0
    let converged = false

    while (!converged && iteration < maxIterations) {
      // Calculate first and second derivatives of log-likelihood with respect to shape
      let firstDerivShape = 0
      let secondDerivShape = 0
      let sumLogT = 0
      let sumTPowBeta = 0
      let sumTPowBetaLogT = 0
      let sumLogTFailed = 0
      let r = 0 // Number of failures

      // Process each data point
      for (const item of operatingHours) {
        const t = item.hours
        const logT = Math.log(t)
        const tPowBeta = Math.pow(t / scale, shape)

        if (item.failed) {
          r++
          sumLogTFailed += logT
          firstDerivShape += logT
        }

        sumLogT += logT
        sumTPowBeta += tPowBeta
        sumTPowBetaLogT += tPowBeta * logT

        firstDerivShape -= (t / scale) ** shape * logT * (t / scale)
      }

      firstDerivShape += r / shape
      secondDerivShape = -r / (shape * shape)

      // Update shape parameter using Newton-Raphson
      const shapeNew = shape - firstDerivShape / secondDerivShape

      // Update scale parameter based on new shape
      const scaleNew = Math.pow(sumTPowBeta / r, 1 / shapeNew) * scale

      // Check for convergence
      const shapeChange = Math.abs((shapeNew - shape) / shape)
      const scaleChange = Math.abs((scaleNew - scale) / scale)

      converged = shapeChange < tolerance && scaleChange < tolerance

      // Update parameters for next iteration
      shape = shapeNew
      scale = scaleNew

      iteration++
    }

    // Ensure parameters are positive and reasonable
    shape = Math.max(0.1, Math.min(10, shape))
    scale = Math.max(100, Math.min(100000, scale))

    return { shape, scale }
  }

  // Function to calculate goodness of fit metrics
  const calculateGoodnessOfFit = (
    data: AssetData[],
    params: WeibullParams,
  ): {
    r2: number
    aic: number
  } => {
    const { shape, scale } = params
    const n = data.length
    const failedCount = data.filter((d) => d.retirementDate !== null).length

    // Convert dates to operating hours
    const operatingHours = data.map((asset) => {
      const installDate = new Date(asset.installDate)
      const endDate = asset.retirementDate ? new Date(asset.retirementDate) : new Date()
      const diffTime = Math.abs(endDate.getTime() - installDate.getTime())
      const hours = Math.ceil(diffTime / (1000 * 60 * 60))
      return {
        hours,
        failed: asset.retirementDate !== null,
      }
    })

    // Calculate log-likelihood
    let logLikelihood = 0

    for (const item of operatingHours) {
      const t = item.hours
      if (item.failed) {
        // Contribution of failure data to log-likelihood
        logLikelihood += Math.log(shape / scale) + (shape - 1) * Math.log(t / scale) - Math.pow(t / scale, shape)
      } else {
        // Contribution of censored data to log-likelihood
        logLikelihood += -Math.pow(t / scale, shape)
      }
    }

    // Calculate AIC (Akaike Information Criterion)
    const aic = -2 * logLikelihood + 4 // 2 parameters (shape and scale)

    // Calculate R-squared (approximation for Weibull fit)
    // This is a pseudo-R² based on comparing to a null model
    const meanLogTime = operatingHours.reduce((sum, item) => sum + Math.log(item.hours), 0) / n

    let nullLogLikelihood = 0
    for (const item of operatingHours) {
      if (item.failed) {
        nullLogLikelihood += Math.log(1 / Math.exp(meanLogTime))
      }
    }

    const r2 = 1 - logLikelihood / nullLogLikelihood

    return { r2, aic }
  }

  const handleAnalyze = async () => {
    if (!file || !assetType) {
      setError("Please select an asset type and upload a CSV file")
      return
    }

    try {
      setIsAnalyzing(true)
      setError(null)

      // Parse and validate CSV data
      const parsedData = await validateAndParseCSV(file)

      // Set asset type for all data points
      const dataWithAssetType = parsedData.map((item) => ({
        ...item,
        assetType,
      }))

      // Check if we have enough data
      if (dataWithAssetType.length < 3) {
        throw new Error("Not enough valid data points for analysis (minimum 3 required)")
      }

      // Check if we have at least one failure
      const failureCount = dataWithAssetType.filter((d) => d.retirementDate !== null).length
      if (failureCount === 0) {
        throw new Error("No failure data found. At least one asset must have a retirement date.")
      }

      // Fit Weibull distribution using MLE
      const params = fitWeibullMLE(dataWithAssetType)

      // Calculate goodness of fit metrics
      const fit = calculateGoodnessOfFit(dataWithAssetType, params)

      // Update state with results
      setAssetData(dataWithAssetType)
      setWeibullParams(params)
      setGoodnessOfFit(fit)
      setIsAnalyzed(true)
    } catch (err) {
      console.error("Error analyzing data:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze data")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setIsAnalyzed(false)
    setError(null)
    setAssetData([])
    setWeibullParams({ shape: 0, scale: 0 })
    setGoodnessOfFit(null)
    setValidationResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const calculateReliabilityMetrics = () => {
    const { shape, scale } = weibullParams

    // Mean Time To Failure (MTTF) in hours
    const mttf = scale * Math.exp(1) ** (1 / shape)

    // Median life (B50) in hours
    const medianLife = scale * Math.log(2) ** (1 / shape)

    // B10 life (time when 10% fail) in hours
    const b10Life = scale * Math.log(1 / 0.9) ** (1 / shape)

    // Convert time points from hours to years
    const year1 = 1 * HOURS_IN_YEAR // 1 year in hours
    const year5 = 5 * HOURS_IN_YEAR // 5 years in hours
    const year10 = 10 * HOURS_IN_YEAR // 10 years in hours

    // Reliability at different time points (in years)
    const reliabilityAt1Year = Math.exp(-((year1 / scale) ** shape)) * 100
    const reliabilityAt5Years = Math.exp(-((year5 / scale) ** shape)) * 100
    const reliabilityAt10Years = Math.exp(-((year10 / scale) ** shape)) * 100

    return {
      mttf,
      medianLife,
      b10Life,
      reliabilityAt1Year,
      reliabilityAt5Years,
      reliabilityAt10Years,
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Asset Data</CardTitle>
          <CardDescription>
            Upload historical asset data to fit a Weibull distribution using Maximum Likelihood Estimation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asset-type">Asset Type</Label>
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger id="asset-type">
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data-file">Upload CSV File</Label>
            <div className="flex items-center gap-2">
              <Input id="data-file" type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
              {file && (
                <Button variant="outline" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              CSV should contain columns: asset_id, install_date, retirement_date (optional)
            </p>
          </div>

          {validationResults && (
            <Alert variant={validationResults.invalidRows > 0 ? "destructive" : "default"}>
              <Info className="h-4 w-4" />
              <AlertTitle>File Validation</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Total rows: {validationResults.totalRows}</span>
                    <span>Valid: {validationResults.validRows}</span>
                    <span>Invalid: {validationResults.invalidRows}</span>
                  </div>
                  <Progress value={(validationResults.validRows / validationResults.totalRows) * 100} className="h-2" />

                  {validationResults.warnings.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Warnings:</p>
                      <ul className="text-xs space-y-1 mt-1 max-h-32 overflow-y-auto">
                        {validationResults.warnings.slice(0, 5).map((warning, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{warning}</span>
                          </li>
                        ))}
                        {validationResults.warnings.length > 5 && (
                          <li className="text-xs italic">
                            ...and {validationResults.warnings.length - 5} more warnings
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {validationResults.preview.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Data Preview:</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Asset ID</th>
                              <th className="text-left p-2">Install Date</th>
                              <th className="text-left p-2">Retirement Date</th>
                              <th className="text-left p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {validationResults.preview.map((item, i) => (
                              <tr key={i} className="border-b">
                                <td className="p-2">{item.id}</td>
                                <td className="p-2">{item.installDate.toLocaleDateString()}</td>
                                <td className="p-2">
                                  {item.retirementDate ? item.retirementDate.toLocaleDateString() : "-"}
                                </td>
                                <td className="p-2">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                      item.retirementDate
                                        ? "bg-destructive text-destructive-foreground"
                                        : "border text-foreground"
                                    }`}
                                  >
                                    {item.retirementDate ? "Failed" : "In Service"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleAnalyze} disabled={isAnalyzing || !file || !assetType} className="w-full">
            {isAnalyzing ? (
              <>Analyzing...</>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Analyze Data
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {isAnalyzed && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Weibull Analysis Results</CardTitle>
              <CardDescription>
                Maximum Likelihood Estimation results for {assetTypes.find((t) => t.value === assetType)?.label}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">Shape Parameter (β)</p>
                  <p className="text-2xl font-bold">{weibullParams.shape.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {weibullParams.shape < 1
                      ? "Decreasing failure rate (early failures)"
                      : weibullParams.shape === 1
                        ? "Constant failure rate (random failures)"
                        : "Increasing failure rate (wear-out failures)"}
                  </p>
                </div>
                <div className="space-y-1 bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">Scale Parameter (η)</p>
                  <p className="text-2xl font-bold">
                    {(weibullParams.scale / HOURS_IN_YEAR).toFixed(2)} <span className="text-sm">years</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Characteristic life (63.2% of units will fail by this time)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">Goodness of Fit (R²)</p>
                  <p className="text-2xl font-bold">{(goodnessOfFit?.r2 || 0).toFixed(3)}</p>
                  <p className="text-xs text-muted-foreground">Higher values indicate better fit (0-1)</p>
                </div>
                <div className="space-y-1 bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">AIC</p>
                  <p className="text-2xl font-bold">{(goodnessOfFit?.aic || 0).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Lower values indicate better model</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Data Summary</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-muted p-2 rounded">
                    <p className="font-medium">Total Assets</p>
                    <p>{assetData.length}</p>
                  </div>
                  <div className="bg-muted p-2 rounded">
                    <p className="font-medium">Failed</p>
                    <p>{assetData.filter((d) => d.retirementDate !== null).length}</p>
                  </div>
                  <div className="bg-muted p-2 rounded">
                    <p className="font-medium">Censored</p>
                    <p>{assetData.filter((d) => d.retirementDate === null).length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weibull Distribution</CardTitle>
              <CardDescription>
                Fitted distribution for {assetTypes.find((t) => t.value === assetType)?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="cdf">CDF</TabsTrigger>
                  <TabsTrigger value="pdf">PDF</TabsTrigger>
                  <TabsTrigger value="hazard">Hazard</TabsTrigger>
                </TabsList>
                <TabsContent value="cdf" className="pt-4">
                  <WeibullChart type="cdf" shape={weibullParams.shape} scale={weibullParams.scale} />
                </TabsContent>
                <TabsContent value="pdf" className="pt-4">
                  <WeibullChart type="pdf" shape={weibullParams.shape} scale={weibullParams.scale} />
                </TabsContent>
                <TabsContent value="hazard" className="pt-4">
                  <WeibullChart type="hazard" shape={weibullParams.shape} scale={weibullParams.scale} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reliability Metrics</CardTitle>
              <CardDescription>Key reliability indicators based on fitted Weibull parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(() => {
                  const metrics = calculateReliabilityMetrics()
                  return (
                    <>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Mean Time To Failure (MTTF)</p>
                        <p className="text-2xl font-bold">
                          {(metrics.mttf / HOURS_IN_YEAR).toFixed(2)} <span className="text-sm">years</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Median Life (B50)</p>
                        <p className="text-2xl font-bold">
                          {(metrics.medianLife / HOURS_IN_YEAR).toFixed(2)} <span className="text-sm">years</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">B10 Life</p>
                        <p className="text-2xl font-bold">
                          {(metrics.b10Life / HOURS_IN_YEAR).toFixed(2)} <span className="text-sm">years</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Reliability at 1 year</p>
                        <p className="text-2xl font-bold">{metrics.reliabilityAt1Year.toFixed(1)}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Reliability at 5 years</p>
                        <p className="text-2xl font-bold">{metrics.reliabilityAt5Years.toFixed(1)}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Reliability at 10 years</p>
                        <p className="text-2xl font-bold">{metrics.reliabilityAt10Years.toFixed(1)}%</p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
