"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, Save } from "lucide-react"
import { generateFMEA, type FailureMode, type FMEAResult } from "@/lib/actions"
import {
  assetTypes,
  getVoltageRatings,
  getOperatingEnvironments,
  getAgeRanges,
  getLoadProfiles,
  getAssetCriticality,
} from "@/lib/electrical-assets"
import { SaveFMEADialog } from "@/components/save-fmea-dialog"
import { DownloadPdfButton } from "@/components/download-pdf-button"
import { WeibullParameters } from "@/components/weibull-parameters"
import { WeibullChart } from "@/components/weibull-chart"
import { RiskMatrix } from "@/components/risk-matrix"
import { RiskMatrixSettings } from "@/components/risk-matrix-settings"
import { featureFlags } from "@/lib/feature-flags"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface FormData {
  assetType: string
  voltageRating: string
  operatingEnvironment: string
  ageRange: string
  loadProfile: string
  assetCriticality: string
  additionalNotes: string
}

interface ProcessedFailureMode {
  failureMode: string
  cause: string
  effect: string
  severity: number
  occurrence: number
  detection: number
  rpn: number
  recommendation?: string
}

export default function GenerateFMEA() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    assetType: "",
    voltageRating: "",
    operatingEnvironment: "",
    ageRange: "",
    loadProfile: "",
    assetCriticality: "",
    additionalNotes: "",
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fmeaResult, setFmeaResult] = useState<FMEAResult | null>(null)
  const [processedFailureModes, setProcessedFailureModes] = useState<ProcessedFailureMode[]>([])
  const [timeUnit, setTimeUnit] = useState<"hours" | "years">("years")
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateForm = (): boolean => {
    const requiredFields: (keyof FormData)[] = [
      "assetType",
      "voltageRating",
      "operatingEnvironment",
      "ageRange",
      "loadProfile",
      "assetCriticality",
    ]

    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`Please select a ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`)
        return false
      }
    }
    return true
  }

  const processFailureModes = (failureModes: FailureMode[]): ProcessedFailureMode[] => {
    return failureModes.map((mode) => ({
      failureMode: mode.name,
      cause: mode.causes?.join(", ") || mode.description,
      effect: mode.effects?.join(", ") || "System impact",
      severity: mode.severity,
      occurrence: mode.occurrence,
      detection: mode.detection,
      rpn: mode.severity * mode.occurrence * mode.detection,
      recommendation: mode.recommendations?.join(", "),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateFMEA(
        formData.assetType,
        formData.voltageRating,
        formData.operatingEnvironment,
        formData.ageRange,
        formData.loadProfile,
        formData.assetCriticality,
        formData.additionalNotes,
      )

      setFmeaResult(result)
      setProcessedFailureModes(processFailureModes(result.failureModes))
      setIsGenerated(true)
    } catch (err) {
      console.error("Error generating FMEA:", err)
      setError("Failed to generate FMEA. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    setFormData({
      assetType: "",
      voltageRating: "",
      operatingEnvironment: "",
      ageRange: "",
      loadProfile: "",
      assetCriticality: "",
      additionalNotes: "",
    })
    setIsGenerated(false)
    setFmeaResult(null)
    setProcessedFailureModes([])
    setError(null)
  }

  const handleSaveClick = () => {
    console.log("Save button clicked")
    console.log("User:", user)
    console.log("FMEA Result:", fmeaResult)
    console.log("Prepared FMEA Data:", prepareFMEADataForSave())
    setShowSaveDialog(true)
  }

  const getRiskLevel = (rpn: number): { level: string; color: string } => {
    if (rpn >= 200) return { level: "Critical", color: "text-red-600 bg-red-50" }
    if (rpn >= 100) return { level: "High", color: "text-orange-600 bg-orange-50" }
    if (rpn >= 50) return { level: "Medium", color: "text-yellow-600 bg-yellow-50" }
    return { level: "Low", color: "text-green-600 bg-green-50" }
  }

  const getAssetTypeLabel = (value: string) => {
    return assetTypes.find((type) => type.value === value)?.label || value
  }

  const getVoltageRatingLabel = (value: string) => {
    const voltageRatings = [
      { value: "lv", label: "Low Voltage (< 1kV)" },
      { value: "mv", label: "Medium Voltage (1kV - 35kV)" },
      { value: "hv", label: "High Voltage (36kV - 230kV)" },
      { value: "ehv", label: "Extra High Voltage (> 230kV)" },
    ]
    return voltageRatings.find((rating) => rating.value === value)?.label || value
  }

  const getOperatingEnvironmentLabel = (value: string) => {
    const environments = [
      { value: "indoor", label: "Indoor" },
      { value: "outdoor", label: "Outdoor" },
      { value: "coastal", label: "Coastal/High Salinity" },
      { value: "extreme_climate", label: "Extreme Hot/Cold Climate" },
    ]
    return environments.find((env) => env.value === value)?.label || value
  }

  const getAgeRangeLabel = (value: string) => {
    const ageRanges = [
      { value: "new", label: "New (< 5 years)" },
      { value: "mid_life", label: "Mid-life (5-15 years)" },
      { value: "mature", label: "Mature (16-30 years)" },
      { value: "end_of_life", label: "End of Life (> 30 years)" },
    ]
    return ageRanges.find((age) => age.value === value)?.label || value
  }

  const getCriticalityLabel = (value: string) => {
    const criticalityLevels = [
      { value: "high", label: "High Criticality" },
      { value: "medium", label: "Medium Criticality" },
      { value: "low", label: "Low Criticality" },
    ]
    return criticalityLevels.find((level) => level.value === value)?.label || value
  }

  const prepareWeibullFailureModes = () => {
    if (!fmeaResult?.weibullParameters) return []

    const colors = ["#3b82f6", "#f97316", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"]

    return Object.entries(fmeaResult.weibullParameters).map(([name, params], index) => ({
      name,
      shape: params.shape,
      scale: params.scale,
      color: colors[index % colors.length],
    }))
  }

  const prepareFMEADataForSave = () => {
    if (!fmeaResult) {
      console.log("prepareFMEADataForSave: fmeaResult is null")
      return null
    }

    console.log("prepareFMEADataForSave: fmeaResult:", fmeaResult)
    const data = {
      title: `${getAssetTypeLabel(formData.assetType)} FMEA`,
      asset_type: formData.assetType,
      voltage_rating: formData.voltageRating,
      operating_environment: formData.operatingEnvironment,
      age_range: formData.ageRange,
      load_profile: formData.loadProfile,
      asset_criticality: formData.assetCriticality,
      additional_notes: formData.additionalNotes,
      failure_modes: fmeaResult.failureModes.map((mode) => ({
        name: mode.name,
        severity: mode.severity,
        occurrence: mode.occurrence,
        detection: mode.detection,
        causes: mode.causes || [mode.description || ""],
        effects: mode.effects || ["System impact"],
        maintenanceActions: mode.maintenanceActions || [],
      })),
      weibull_parameters: fmeaResult.weibullParameters || {},
    }
    console.log("prepareFMEADataForSave: prepared data:", data)
    return data
  }

  return (
    <div className="min-h-screen bg-white">
      <Header activePath="/generate" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">FMEA Generator</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Generate comprehensive Failure Mode and Effects Analysis reports using AI-powered analysis for your
            electrical assets.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {!isGenerated ? (
              <>
                {/* Instructions Section */}
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
                    Select your asset configuration and let our AI analyze potential failure modes, assign risk ratings,
                    and generate Weibull reliability parameters.
                  </p>

                  <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-blue-600">1</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure Asset</h3>
                      <p className="text-gray-600">Select asset type, voltage rating, and operating conditions</p>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-green-600">2</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis</h3>
                      <p className="text-gray-600">Our AI identifies failure modes and calculates risk priorities</p>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-purple-600">3</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Results</h3>
                      <p className="text-gray-600">Review detailed FMEA with risk matrix and reliability predictions</p>
                    </div>
                  </div>
                </div>

                {/* Configuration Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Asset Configuration</CardTitle>
                    <CardDescription>
                      Provide details about your electrical asset to generate a customized FMEA analysis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="assetType">Asset Type *</Label>
                          <Select
                            value={formData.assetType}
                            onValueChange={(value) => handleInputChange("assetType", value)}
                          >
                            <SelectTrigger>
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
                          <Label htmlFor="voltageRating">Voltage Rating *</Label>
                          <Select
                            value={formData.voltageRating}
                            onValueChange={(value) => handleInputChange("voltageRating", value)}
                            disabled={!formData.assetType}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select voltage rating" />
                            </SelectTrigger>
                            <SelectContent>
                              {getVoltageRatings(formData.assetType).map((rating) => (
                                <SelectItem key={rating.value} value={rating.value}>
                                  {rating.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="operatingEnvironment">Operating Environment *</Label>
                          <Select
                            value={formData.operatingEnvironment}
                            onValueChange={(value) => handleInputChange("operatingEnvironment", value)}
                            disabled={!formData.assetType}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select operating environment" />
                            </SelectTrigger>
                            <SelectContent>
                              {getOperatingEnvironments(formData.assetType).map((env) => (
                                <SelectItem key={env.value} value={env.value}>
                                  {env.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ageRange">Asset Age *</Label>
                          <Select
                            value={formData.ageRange}
                            onValueChange={(value) => handleInputChange("ageRange", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select asset age" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAgeRanges().map((age) => (
                                <SelectItem key={age.value} value={age.value}>
                                  {age.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="loadProfile">Load Profile *</Label>
                          <Select
                            value={formData.loadProfile}
                            onValueChange={(value) => handleInputChange("loadProfile", value)}
                            disabled={!formData.assetType}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select load profile" />
                            </SelectTrigger>
                            <SelectContent>
                              {getLoadProfiles(formData.assetType).map((profile) => (
                                <SelectItem key={profile.value} value={profile.value}>
                                  {profile.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="assetCriticality">Asset Criticality *</Label>
                          <Select
                            value={formData.assetCriticality}
                            onValueChange={(value) => handleInputChange("assetCriticality", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select asset criticality" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAssetCriticality().map((criticality) => (
                                <SelectItem key={criticality.value} value={criticality.value}>
                                  {criticality.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="additionalNotes">Additional Notes</Label>
                        <Textarea
                          id="additionalNotes"
                          placeholder="Any additional information about the asset, operating conditions, or specific concerns..."
                          value={formData.additionalNotes}
                          onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                          rows={3}
                        />
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-4">
                        <Button type="submit" disabled={isGenerating} className="flex-1">
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating FMEA...
                            </>
                          ) : (
                            "Generate FMEA"
                          )}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleReset}>
                          Reset
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="space-y-6">
                {/* Success Alert */}
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    FMEA analysis completed successfully! Review the failure modes and risk assessment below.
                  </AlertDescription>
                </Alert>

                {/* Asset Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Asset Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Asset Type:</span>
                        <p className="text-muted-foreground">{getAssetTypeLabel(formData.assetType)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Voltage Rating:</span>
                        <p className="text-muted-foreground">{getVoltageRatingLabel(formData.voltageRating)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Environment:</span>
                        <p className="text-muted-foreground">
                          {getOperatingEnvironmentLabel(formData.operatingEnvironment)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Asset Age:</span>
                        <p className="text-muted-foreground">{getAgeRangeLabel(formData.ageRange)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Load Profile:</span>
                        <p className="text-muted-foreground">{formData.loadProfile}</p>
                      </div>
                      <div>
                        <span className="font-medium">Criticality:</span>
                        <p className="text-muted-foreground">{getCriticalityLabel(formData.assetCriticality)}</p>
                      </div>
                    </div>
                    {formData.additionalNotes && (
                      <div className="mt-4">
                        <span className="font-medium">Additional Notes:</span>
                        <p className="text-muted-foreground mt-1">{formData.additionalNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  {user ? (
                    <Button variant="outline" onClick={handleSaveClick}>
                      <Save className="h-4 w-4 mr-2" />
                      Save FMEA
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => router.push("/auth/sign-in")}>
                      <Save className="h-4 w-4 mr-2" />
                      Sign in to Save
                    </Button>
                  )}
                  <DownloadPdfButton
                    assetType={formData.assetType}
                    voltageRating={formData.voltageRating}
                    operatingEnvironment={formData.operatingEnvironment}
                    ageRange={formData.ageRange}
                    loadProfile={formData.loadProfile}
                    assetCriticality={formData.assetCriticality}
                    additionalNotes={formData.additionalNotes}
                    failureModes={processedFailureModes}
                    weibullParameters={fmeaResult?.weibullParameters || {}}
                  />
                  <Button variant="outline" onClick={handleReset}>
                    Generate New FMEA
                  </Button>
                </div>

                {/* Save Dialog */}
                {fmeaResult && prepareFMEADataForSave() && (
                  <SaveFMEADialog
                    open={showSaveDialog}
                    onOpenChange={setShowSaveDialog}
                    fmeaData={prepareFMEADataForSave()!}
                  />
                )}

                {/* Collapsible Results Sections */}
                <Accordion
                  type="multiple"
                  defaultValue={["failure-modes", "weibull-parameters", "weibull-charts"]}
                  className="space-y-4"
                >
                  {/* Risk Matrix */}
                  {featureFlags.showRiskMatrix && fmeaResult && (
                    <AccordionItem value="risk-matrix" className="border rounded-lg">
                      <Card className="border-0">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="text-left">
                              <CardTitle className="text-lg">Risk Matrix</CardTitle>
                              <CardDescription>Visual representation of failure mode risks</CardDescription>
                            </div>
                            <RiskMatrixSettings />
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CardContent className="pt-0">
                            <RiskMatrix failureModes={processedFailureModes} />
                          </CardContent>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  )}

                  {/* Failure Modes Table */}
                  <AccordionItem value="failure-modes" className="border rounded-lg">
                    <Card className="border-0">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="text-left">
                          <CardTitle className="text-lg">Failure Modes Analysis</CardTitle>
                          <CardDescription>
                            Detailed analysis of potential failure modes with severity, occurrence, and detection
                            ratings
                          </CardDescription>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <CardContent className="pt-0">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-3 font-medium">Failure Mode</th>
                                  <th className="text-left p-3 font-medium">Cause</th>
                                  <th className="text-left p-3 font-medium">Effect</th>
                                  <th className="text-center p-3 font-medium">S</th>
                                  <th className="text-center p-3 font-medium">O</th>
                                  <th className="text-center p-3 font-medium">D</th>
                                  <th className="text-center p-3 font-medium">RPN</th>
                                  <th className="text-center p-3 font-medium">Risk Level</th>
                                </tr>
                              </thead>
                              <tbody>
                                {processedFailureModes.map((mode, index) => {
                                  const risk = getRiskLevel(mode.rpn)
                                  return (
                                    <tr key={index} className="border-b hover:bg-muted/50">
                                      <td className="p-3 font-medium">{mode.failureMode}</td>
                                      <td className="p-3 text-sm text-muted-foreground">{mode.cause}</td>
                                      <td className="p-3 text-sm text-muted-foreground">{mode.effect}</td>
                                      <td className="p-3 text-center">{mode.severity}</td>
                                      <td className="p-3 text-center">{mode.occurrence}</td>
                                      <td className="p-3 text-center">{mode.detection}</td>
                                      <td className="p-3 text-center font-medium">{mode.rpn}</td>
                                      <td className="p-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${risk.color}`}>
                                          {risk.level}
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>

                  {/* Weibull Parameters Summary */}
                  {fmeaResult?.weibullParameters && (
                    <AccordionItem value="weibull-parameters" className="border rounded-lg">
                      <Card className="border-0">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="text-left">
                            <CardTitle className="text-lg">Weibull Parameters</CardTitle>
                            <CardDescription>Statistical parameters for reliability modeling</CardDescription>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CardContent className="pt-0">
                            <WeibullParameters weibullParameters={fmeaResult.weibullParameters} />
                          </CardContent>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  )}

                  {/* Weibull Distribution Charts */}
                  {fmeaResult?.weibullParameters && Object.keys(fmeaResult.weibullParameters).length > 0 && (
                    <AccordionItem value="weibull-charts" className="border rounded-lg">
                      <Card className="border-0">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="text-left">
                              <CardTitle className="text-lg">Weibull Distribution Analysis</CardTitle>
                              <CardDescription>
                                Reliability and failure rate curves for all failure modes
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                              <Label className="text-sm font-normal">Time Unit:</Label>
                              <RadioGroup
                                value={timeUnit}
                                onValueChange={(value) => setTimeUnit(value as "hours" | "years")}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="hours" id="hours" />
                                  <Label htmlFor="hours" className="cursor-pointer font-normal">
                                    Hours
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="years" id="years" />
                                  <Label htmlFor="years" className="cursor-pointer font-normal">
                                    Years
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CardContent className="pt-0">
                            <WeibullChart
                              type="cdf"
                              shape={0}
                              scale={0}
                              failureModes={prepareWeibullFailureModes()}
                              showCombined={false}
                              timeUnit={timeUnit}
                            />
                          </CardContent>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  )}

                  {/* Maintenance Recommendations */}
                  {fmeaResult?.failureModes &&
                    fmeaResult.failureModes.some((mode) => mode.maintenanceActions?.length > 0) && (
                      <AccordionItem value="maintenance" className="border rounded-lg">
                        <Card className="border-0">
                          <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <div className="text-left">
                              <CardTitle className="text-lg">Maintenance Recommendations</CardTitle>
                              <CardDescription>
                                Preventive maintenance actions based on asset criticality and failure modes
                              </CardDescription>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <CardContent className="pt-0">
                              <div className="space-y-6">
                                {fmeaResult.failureModes.map((mode, index) => {
                                  if (!mode.maintenanceActions || mode.maintenanceActions.length === 0) return null
                                  return (
                                    <div key={index} className="border rounded-lg p-4">
                                      <h4 className="font-medium mb-3">{mode.name}</h4>
                                      <div className="grid gap-3">
                                        {mode.maintenanceActions.map((action, actionIndex) => (
                                          <div
                                            key={actionIndex}
                                            className="flex justify-between items-start p-3 bg-muted/50 rounded"
                                          >
                                            <div className="flex-1">
                                              <p className="font-medium text-sm">{action.action}</p>
                                              <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                                            </div>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded ml-3 whitespace-nowrap">
                                              {action.frequency}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </CardContent>
                          </AccordionContent>
                        </Card>
                      </AccordionItem>
                    )}
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
