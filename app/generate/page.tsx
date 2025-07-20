"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Download, FileText, Loader2, Calendar, Settings, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WeibullChart } from "@/components/weibull-chart"
import { GeneratePdfButton } from "@/components/generate-pdf-button"
import {
  assetTypes,
  getOperatingEnvironments,
  getVoltageRatings,
  getAgeRanges,
  getLoadProfiles,
  getAssetCriticality,
} from "@/lib/electrical-assets"
import { type FailureMode, generateFMEA } from "@/lib/actions"

// Array of colors for failure mode curves
const CURVE_COLORS = [
  "#0ea5e9", // sky blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f43f5e", // rose
  "#6366f1", // indigo
  "#14b8a6", // teal
]

export default function GenerateFMEA() {
  const [assetType, setAssetType] = useState("")
  const [voltageRating, setVoltageRating] = useState("")
  const [operatingEnvironment, setOperatingEnvironment] = useState("")
  const [ageRange, setAgeRange] = useState("")
  const [loadProfile, setLoadProfile] = useState("")
  const [assetCriticality, setAssetCriticality] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [activeTab, setActiveTab] = useState("cdf")
  const [failureModes, setFailureModes] = useState<FailureMode[]>([])
  const [weibullParameters, setWeibullParameters] = useState<Record<string, { shape: number; scale: number }>>({})
  const [showCombined, setShowCombined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false)

  // Available operating environments based on asset type
  const [availableEnvironments, setAvailableEnvironments] = useState<any[]>([])

  // Reset dependent fields when asset type changes
  useEffect(() => {
    setVoltageRating("")
    setOperatingEnvironment("")
    setAgeRange("")
    setLoadProfile("")
    setAssetCriticality("")
    setFailureModes([])
    setWeibullParameters({})

    // Update available operating environments when asset type changes
    if (assetType) {
      setAvailableEnvironments(getOperatingEnvironments(assetType))
    } else {
      setAvailableEnvironments([])
    }
  }, [assetType])

  const handleAssetTypeChange = (value: string) => {
    setAssetType(value)
  }

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      // Call the server action to generate FMEA using OpenAI
      const result = await generateFMEA(
        assetType,
        voltageRating,
        operatingEnvironment,
        ageRange,
        loadProfile,
        assetCriticality,
        additionalNotes,
      )

      // Update state with the generated data
      setFailureModes(result.failureModes)
      setWeibullParameters(result.weibullParameters)
      setIsGenerated(true)
      setIsConfigCollapsed(true) // Collapse the configuration when results are generated
    } catch (err) {
      console.error("Error generating FMEA:", err)
      setError("Failed to generate FMEA. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    // Create a JSON blob with the FMEA data
    const fmeaData = {
      assetType: assetTypes.find((a) => a.value === assetType)?.label,
      voltageRating: getVoltageRatings(assetType).find((v) => v.value === voltageRating)?.label,
      operatingEnvironment: availableEnvironments.find((e) => e.value === operatingEnvironment)?.label,
      ageRange: getAgeRanges().find((a) => a.value === ageRange)?.label,
      loadProfile: getLoadProfiles(assetType).find((l) => l.value === loadProfile)?.label,
      assetCriticality: getAssetCriticality().find((c) => c.value === assetCriticality)?.label,
      additionalNotes,
      failureModes,
      weibullParameters,
      generatedDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(fmeaData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `FMEA_${assetType}_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Prepare failure mode data for the chart
  const prepareFailureModesForChart = () => {
    return failureModes.slice(0, 5).map((mode, index) => {
      const params = weibullParameters[mode.name] || { shape: 2.5, scale: 15000 }
      return {
        name: mode.name,
        shape: params.shape,
        scale: params.scale,
        color: CURVE_COLORS[index % CURVE_COLORS.length],
      }
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <Header activePath="/generate" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI-Powered FMEA Generation</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Generate comprehensive Failure Mode and Effects Analysis reports for electrical transmission and
            distribution assets using advanced AI technology and industry expertise.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Instructions Section */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
                Configure your electrical asset parameters and let our AI generate a comprehensive FMEA with failure
                modes, risk assessments, and maintenance recommendations.
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate FMEA</h3>
                  <p className="text-gray-600">AI analyzes asset characteristics and generates failure modes</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Results</h3>
                  <p className="text-gray-600">Download comprehensive reports and reliability charts</p>
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="space-y-8">
              <div className="max-w-2xl mx-auto">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardHeader
                    className={`${isGenerated ? "cursor-pointer hover:bg-gray-50" : ""}`}
                    onClick={() => isGenerated && setIsConfigCollapsed(!isConfigCollapsed)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Asset Configuration</CardTitle>
                        <CardDescription>Select the asset type and operating characteristics</CardDescription>
                      </div>
                      {isGenerated && (
                        <Button variant="ghost" size="sm">
                          {isConfigCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  {!isConfigCollapsed && (
                    <>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="asset-type">Asset Type</Label>
                          <Select value={assetType} onValueChange={handleAssetTypeChange}>
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

                        {assetType && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="voltage-rating">Voltage Rating</Label>
                              <Select value={voltageRating} onValueChange={setVoltageRating}>
                                <SelectTrigger id="voltage-rating">
                                  <SelectValue placeholder="Select voltage rating" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getVoltageRatings(assetType).map((rating) => (
                                    <SelectItem key={rating.value} value={rating.value}>
                                      {rating.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="operating-environment">Operating Environment</Label>
                              <Select value={operatingEnvironment} onValueChange={setOperatingEnvironment}>
                                <SelectTrigger id="operating-environment">
                                  <SelectValue placeholder="Select operating environment" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableEnvironments.map((env) => (
                                    <SelectItem key={env.value} value={env.value}>
                                      {env.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="age-range">Asset Age</Label>
                              <Select value={ageRange} onValueChange={setAgeRange}>
                                <SelectTrigger id="age-range">
                                  <SelectValue placeholder="Select asset age range" />
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
                              <Label htmlFor="load-profile">Load Profile</Label>
                              <Select value={loadProfile} onValueChange={setLoadProfile}>
                                <SelectTrigger id="load-profile">
                                  <SelectValue placeholder="Select load profile" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getLoadProfiles(assetType).map((profile) => (
                                    <SelectItem key={profile.value} value={profile.value}>
                                      {profile.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="asset-criticality">Asset Criticality</Label>
                              <Select value={assetCriticality} onValueChange={setAssetCriticality}>
                                <SelectTrigger id="asset-criticality">
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
                          </>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="additional-notes">Additional Notes</Label>
                          <Textarea
                            id="additional-notes"
                            placeholder="Enter any additional information about the asset or operating conditions"
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                          />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={handleGenerate}
                          disabled={
                            isGenerating ||
                            !assetType ||
                            !voltageRating ||
                            !operatingEnvironment ||
                            !ageRange ||
                            !loadProfile ||
                            !assetCriticality
                          }
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate FMEA"
                          )}
                        </Button>
                      </CardFooter>
                    </>
                  )}
                </Card>
              </div>

              {isGenerated ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tighter">FMEA Results</h2>
                    <p className="text-muted-foreground mt-2">
                      AI-generated FMEA for {assetTypes.find((a) => a.value === assetType)?.label}
                    </p>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Failure Mode Analysis</CardTitle>
                      <CardDescription>
                        Potential failure modes for {assetTypes.find((a) => a.value === assetType)?.label} in{" "}
                        {availableEnvironments.find((e) => e.value === operatingEnvironment)?.label} environment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {failureModes.map((mode, index) => {
                          const severity = mode.severity
                          const occurrence = mode.occurrence
                          const detection = mode.detection
                          const rpn = severity * occurrence * detection

                          let rpnClass = "bg-yellow-100 text-yellow-800"
                          if (rpn > 150) rpnClass = "bg-red-100 text-red-800"
                          else if (rpn < 100) rpnClass = "bg-green-100 text-green-800"

                          return (
                            <AccordionItem key={index} value={`item-${index}`}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex justify-between w-full pr-4">
                                  <span className="font-medium text-left">{mode.name}</span>
                                  <span className={`text-sm font-medium ${rpnClass} px-2 py-0.5 rounded ml-2`}>
                                    RPN: {rpn}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-2">
                                  <p className="text-sm text-muted-foreground">{mode.description}</p>

                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="bg-muted p-1 rounded">
                                      <span className="font-medium">Severity:</span> {severity}
                                    </div>
                                    <div className="bg-muted p-1 rounded">
                                      <span className="font-medium">Occurrence:</span> {occurrence}
                                    </div>
                                    <div className="bg-muted p-1 rounded">
                                      <span className="font-medium">Detection:</span> {detection}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Potential Causes:</h4>
                                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                      {mode.causes?.map((cause, i) => (
                                        <li key={i}>{cause}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Effects:</h4>
                                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                      {mode.effects?.map((effect, i) => (
                                        <li key={i}>{effect}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Recommended Actions:</h4>
                                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                      {mode.recommendations?.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  {mode.maintenanceActions && mode.maintenanceActions.length > 0 && (
                                    <div className="space-y-3 mt-4 pt-4 border-t">
                                      <h4 className="text-sm font-medium flex items-center">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Preventative Maintenance Plan:
                                      </h4>
                                      <div className="space-y-3">
                                        {mode.maintenanceActions.map((action, i) => (
                                          <div key={i} className="bg-muted/50 p-3 rounded-md">
                                            <div className="flex justify-between items-start">
                                              <h5 className="font-medium text-sm">{action.action}</h5>
                                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                {action.frequency}
                                              </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )
                        })}
                      </Accordion>
                    </CardContent>
                  </Card>

                  {failureModes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div>
                            <CardTitle>Weibull Distribution Analysis</CardTitle>
                            <CardDescription>Failure probability distribution analysis</CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="combined-view" checked={showCombined} onCheckedChange={setShowCombined} />
                            <Label htmlFor="combined-view">Show Overall System Failure</Label>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="cdf">CDF</TabsTrigger>
                            <TabsTrigger value="pdf">PDF</TabsTrigger>
                            <TabsTrigger value="hazard">Hazard</TabsTrigger>
                          </TabsList>
                          <TabsContent value="cdf" className="pt-4">
                            <WeibullChart
                              type="cdf"
                              shape={weibullParameters[failureModes[0]?.name]?.shape || 2.5}
                              scale={weibullParameters[failureModes[0]?.name]?.scale || 15000}
                              failureModes={prepareFailureModesForChart()}
                              showCombined={showCombined}
                            />
                          </TabsContent>
                          <TabsContent value="pdf" className="pt-4">
                            <WeibullChart
                              type="pdf"
                              shape={weibullParameters[failureModes[0]?.name]?.shape || 2.5}
                              scale={weibullParameters[failureModes[0]?.name]?.scale || 15000}
                              failureModes={prepareFailureModesForChart()}
                              showCombined={showCombined}
                            />
                          </TabsContent>
                          <TabsContent value="hazard" className="pt-4">
                            <WeibullChart
                              type="hazard"
                              shape={weibullParameters[failureModes[0]?.name]?.shape || 2.5}
                              scale={weibullParameters[failureModes[0]?.name]?.scale || 15000}
                              failureModes={prepareFailureModesForChart()}
                              showCombined={showCombined}
                            />
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                          {showCombined ? (
                            <span>Showing overall system failure distribution considering all failure modes</span>
                          ) : (
                            <span>Showing individual failure mode distributions</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download JSON
                          </Button>
                          <GeneratePdfButton
                            size="sm"
                            fmeaData={{
                              title: `${assetTypes.find((a) => a.value === assetType)?.label} FMEA`,
                              assetType,
                              voltageRating,
                              operatingEnvironment,
                              ageRange,
                              loadProfile,
                              assetCriticality,
                              additionalNotes,
                              failureModes,
                              weibullParameters,
                            }}
                            fileName={`FMEA_${assetType}_${new Date().toISOString().split("T")[0]}.pdf`}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Download PDF
                          </GeneratePdfButton>
                        </div>
                      </CardFooter>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="text-center space-y-4 p-8 border rounded-lg bg-muted/40">
                    <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h2 className="text-xl font-medium">FMEA Results Preview</h2>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Complete the form with electrical T&D asset details to generate an AI-powered FMEA with failure
                      mode analysis, preventative maintenance recommendations, and Weibull distribution visualizations
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
