"use client"

import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, FileText, X, ArrowLeft } from "lucide-react"
import { Footer } from "@/components/footer"
import { getFMEAById } from "@/lib/fmea-actions"
import { Header } from "@/components/header"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WeibullChart } from "@/components/weibull-chart"
import { useToast } from "@/components/ui/use-toast"

// Create an interface for the FMEA data
interface FMEA {
  id: string
  title: string
  asset_type: string
  voltage_rating: string
  operating_environment: string
  age_range: string
  load_profile: string
  asset_criticality: string
  additional_notes?: string
  failure_modes: FailureMode[]
  weibull_parameters: Record<string, { shape: number; scale: number }>
  created_at: string
}

interface FailureMode {
  name: string
  description: string
  severity: number
  occurrence: number
  detection: number
  causes: string[]
  effects: string[]
  recommendations: string[]
  maintenanceActions: {
    action: string
    frequency: string
    description: string
    estimatedCost?: number
    annualCost?: number
  }[]
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to home if not authenticated
  if (!session) {
    redirect("/")
  }

  // Get the IDs from the query parameters
  const ids = Array.isArray(searchParams.ids) ? searchParams.ids : searchParams.ids ? [searchParams.ids] : []

  if (ids.length < 2) {
    redirect("/dashboard/fmeas")
  }

  // Fetch the FMEAs
  const fmeasPromises = ids.map((id) => getFMEAById(id as string))
  const fmeasResults = await Promise.all(fmeasPromises)
  const fmeas = fmeasResults.filter(Boolean) // Remove any nulls

  if (fmeas.length < 2) {
    redirect("/dashboard/fmeas")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header activePath="/dashboard" />
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <FMEAComparisonComponent fmeas={fmeas} />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export function FMEAComparisonComponent({ fmeas: initialFmeas }: { fmeas: FMEA[] }) {
  const [fmeas, setFmeas] = useState<FMEA[]>(initialFmeas)
  const [selectedFMEAIds, setSelectedFMEAIds] = useState<string[]>(initialFmeas.map((f) => f.id))
  const [selectedFMEAs, setSelectedFMEAs] = useState<FMEA[]>(initialFmeas)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [chartType, setChartType] = useState("cdf")
  const router = useRouter()
  const { toast } = useToast()

  // Define color array for charts and UI elements
  const COLORS = [
    "#0ea5e9", // sky blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
  ]

  // Update selected FMEAs when selection changes
  useEffect(() => {
    const selected = fmeas.filter((fmea) => selectedFMEAIds.includes(fmea.id))
    setSelectedFMEAs(selected)
  }, [selectedFMEAIds, fmeas])

  // Handle FMEA selection
  const handleSelectFMEA = (fmeaId: string) => {
    if (selectedFMEAIds.includes(fmeaId)) {
      // Remove if already selected
      setSelectedFMEAIds((prev) => prev.filter((id) => id !== fmeaId))
    } else if (selectedFMEAIds.length < 5) {
      // Add if not already at maximum
      setSelectedFMEAIds((prev) => [...prev, fmeaId])
    } else {
      toast({
        title: "Maximum Selection Reached",
        description: "You can compare up to 5 FMEAs at a time.",
        variant: "destructive",
      })
    }
  }

  // Prepare data for Weibull chart
  const prepareWeibullChartData = () => {
    const chartData = selectedFMEAs.flatMap((fmea, fmeaIndex) => {
      // Get the first failure mode from each FMEA
      const firstFailureMode = fmea.failure_modes[0]?.name
      if (!firstFailureMode || !fmea.weibull_parameters[firstFailureMode]) return []

      return {
        name: `${fmea.title} (${fmea.asset_type})`,
        shape: fmea.weibull_parameters[firstFailureMode].shape,
        scale: fmea.weibull_parameters[firstFailureMode].scale,
        color: COLORS[fmeaIndex % COLORS.length],
      }
    })

    return chartData
  }

  // Calculate total maintenance costs for each FMEA
  const calculateTotalMaintenanceCosts = (fmea: FMEA) => {
    return fmea.failure_modes.reduce((total, mode) => {
      const modeCost = mode.maintenanceActions?.reduce((sum, action) => sum + (action.annualCost || 0), 0) || 0
      return total + modeCost
    }, 0)
  }

  // Compare RPN values between FMEAs
  const compareRPNValues = () => {
    return selectedFMEAs.map((fmea) => {
      const totalRPN = fmea.failure_modes.reduce(
        (sum, mode) => sum + mode.severity * mode.occurrence * mode.detection,
        0,
      )

      const avgRPN = fmea.failure_modes.length > 0 ? totalRPN / fmea.failure_modes.length : 0

      return {
        id: fmea.id,
        title: fmea.title,
        totalRPN,
        avgRPN,
        maxRPN: Math.max(...fmea.failure_modes.map((mode) => mode.severity * mode.occurrence * mode.detection)),
      }
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/fmeas">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to FMEAs
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl font-bold tracking-tighter">Compare FMEAs</h1>
              <p className="text-muted-foreground mt-2">Compare multiple FMEAs to analyze differences and trends</p>
            </div>
          </div>

          {error && <div className="bg-destructive/10 text-destructive rounded-md p-4 mb-6">{error}</div>}

          <div className="grid gap-6 md:grid-cols-12">
            {/* FMEA Selection Sidebar */}
            <div className="md:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select FMEAs to Compare</CardTitle>
                  <CardDescription>Choose up to 5 FMEAs</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : fmeas.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No FMEAs yet</h3>
                      <p className="text-muted-foreground mb-4">You haven't created any FMEA reports yet.</p>
                      <Button asChild>
                        <Link href="/generate">Generate FMEA</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fmeas.map((fmea) => (
                        <div
                          key={fmea.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedFMEAIds.includes(fmea.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                          onClick={() => handleSelectFMEA(fmea.id)}
                        >
                          <div>
                            <h3 className="font-medium text-sm">{fmea.title}</h3>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {fmea.asset_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {fmea.created_at.split("T")[0]}
                              </Badge>
                            </div>
                          </div>
                          <div
                            className={`h-5 w-5 rounded-full border flex-shrink-0 ${
                              selectedFMEAIds.includes(fmea.id)
                                ? "bg-primary border-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {selectedFMEAIds.includes(fmea.id) && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedFMEAIds.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Selected FMEAs: {selectedFMEAIds.length}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFMEAs.map((fmea, index) => (
                          <Badge
                            key={fmea.id}
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            className="text-white flex items-center gap-1"
                          >
                            {fmea.title}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectFMEA(fmea.id)
                              }}
                              className="hover:bg-white/20 rounded-full h-4 w-4 inline-flex items-center justify-center"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Comparison Content */}
            <div className="md:col-span-8">
              {selectedFMEAs.length < 2 ? (
                <Card>
                  <CardContent className="flex items-center justify-center min-h-[300px]">
                    <div className="text-center">
                      <ChevronDown className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-bounce" />
                      <h3 className="text-lg font-medium mb-2">Select at least 2 FMEAs to compare</h3>
                      <p className="text-muted-foreground mb-4">
                        Choose FMEAs from the list on the left to start comparison
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>FMEA Comparison</CardTitle>
                      <CardDescription>Comparing {selectedFMEAs.length} FMEAs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-4 w-full">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="reliability">Reliability</TabsTrigger>
                          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                          <TabsTrigger value="rpn">RPN Analysis</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="pt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Attribute</TableHead>
                                {selectedFMEAs.map((fmea, index) => (
                                  <TableHead key={fmea.id} style={{ color: COLORS[index % COLORS.length] }}>
                                    {fmea.title}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Asset Type</TableCell>
                                {selectedFMEAs.map((fmea) => (
                                  <TableCell key={`${fmea.id}-asset-type`}>{fmea.asset_type}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Voltage Rating</TableCell>
                                {selectedFMEAs.map((fmea) => (
                                  <TableCell key={`${fmea.id}-voltage`}>{fmea.voltage_rating}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Environment</TableCell>
                                {selectedFMEAs.map((fmea) => (
                                  <TableCell key={`${fmea.id}-env`}>{fmea.operating_environment}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Asset Age</TableCell>
                                {selectedFMEAs.map((fmea) => (
                                  <TableCell key={`${fmea.id}-age`}>{fmea.age_range}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Criticality</TableCell>
                                {selectedFMEAs.map((fmea) => (
                                  <TableCell key={`${fmea.id}-criticality`}>{fmea.asset_criticality}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Failure Modes</TableCell>
                                {selectedFMEAs.map((fmea) => (
                                  <TableCell key={`${fmea.id}-modes`}>{fmea.failure_modes.length}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Annual Maintenance Cost</TableCell>
                                {selectedFMEAs.map((fmea) => (
                                  <TableCell key={`${fmea.id}-cost`} className="font-bold">
                                    ${calculateTotalMaintenanceCosts(fmea).toLocaleString()}
                                  </TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Created</TableCell>
                                {selectedFMEAs.map((fmea) => (
                                  <TableCell key={`${fmea.id}-created`}>
                                    {new Date(fmea.created_at).toLocaleDateString()}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TabsContent>

                        {/* Reliability Tab */}
                        <TabsContent value="reliability" className="pt-4">
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-medium mb-2">Weibull Distribution Comparison</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Compare the reliability curves for each FMEA's primary failure mode
                              </p>

                              <Tabs value={chartType} onValueChange={setChartType} className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="cdf">CDF</TabsTrigger>
                                  <TabsTrigger value="pdf">PDF</TabsTrigger>
                                  <TabsTrigger value="hazard">Hazard</TabsTrigger>
                                </TabsList>
                                <TabsContent value="cdf" className="pt-4">
                                  <WeibullChart
                                    type="cdf"
                                    shape={3.0}
                                    scale={10000}
                                    failureModes={prepareWeibullChartData()}
                                    showCombined={false}
                                  />
                                </TabsContent>
                                <TabsContent value="pdf" className="pt-4">
                                  <WeibullChart
                                    type="pdf"
                                    shape={3.0}
                                    scale={10000}
                                    failureModes={prepareWeibullChartData()}
                                    showCombined={false}
                                  />
                                </TabsContent>
                                <TabsContent value="hazard" className="pt-4">
                                  <WeibullChart
                                    type="hazard"
                                    shape={3.0}
                                    scale={10000}
                                    failureModes={prepareWeibullChartData()}
                                    showCombined={false}
                                  />
                                </TabsContent>
                              </Tabs>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="border rounded-lg p-4">
                                <h3 className="text-sm font-medium mb-3">Shape Parameter (β) Comparison</h3>
                                <div className="space-y-2">
                                  {selectedFMEAs.map((fmea, index) => {
                                    const firstMode = fmea.failure_modes[0]?.name
                                    const shape = fmea.weibull_parameters[firstMode]?.shape || 0

                                    return (
                                      <div key={`${fmea.id}-shape`} className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        ></div>
                                        <span className="text-sm font-medium">{fmea.title}: </span>
                                        <span className="text-sm">{shape.toFixed(2)}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                          {shape < 1
                                            ? "(Early life failures)"
                                            : shape === 1
                                              ? "(Random failures)"
                                              : "(Wear-out failures)"}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              <div className="border rounded-lg p-4">
                                <h3 className="text-sm font-medium mb-3">Scale Parameter (η) Comparison</h3>
                                <div className="space-y-2">
                                  {selectedFMEAs.map((fmea, index) => {
                                    const firstMode = fmea.failure_modes[0]?.name
                                    const scale = fmea.weibull_parameters[firstMode]?.scale || 0

                                    return (
                                      <div key={`${fmea.id}-scale`} className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        ></div>
                                        <span className="text-sm font-medium">{fmea.title}: </span>
                                        <span className="text-sm">{scale.toLocaleString()} hours</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        {/* Maintenance Tab */}
                        <TabsContent value="maintenance" className="pt-4">
                          <div className="space-y-6">
                            <div className="border rounded-lg p-4">
                              <h3 className="text-lg font-medium mb-2">Maintenance Cost Comparison</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Annual Maintenance Cost</h4>
                                  <div className="space-y-3">
                                    {selectedFMEAs.map((fmea, index) => {
                                      const totalCost = calculateTotalMaintenanceCosts(fmea)
                                      const maxCost = Math.max(
                                        ...selectedFMEAs.map((f) => calculateTotalMaintenanceCosts(f)),
                                      )
                                      const percentage = (totalCost / maxCost) * 100

                                      return (
                                        <div key={`${fmea.id}-cost`} className="space-y-1">
                                          <div className="flex justify-between items-center">
                                            <span
                                              className="text-sm font-medium"
                                              style={{ color: COLORS[index % COLORS.length] }}
                                            >
                                              {fmea.title}
                                            </span>
                                            <span className="text-sm font-bold">${totalCost.toLocaleString()}</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className="h-2 rounded-full"
                                              style={{
                                                width: `${percentage}%`,
                                                backgroundColor: COLORS[index % COLORS.length],
                                              }}
                                            ></div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-medium mb-2">Maintenance Actions</h4>
                                  <div className="space-y-2">
                                    {selectedFMEAs.map((fmea, index) => {
                                      const totalActions = fmea.failure_modes.reduce(
                                        (sum, mode) => sum + (mode.maintenanceActions?.length || 0),
                                        0,
                                      )

                                      return (
                                        <div key={`${fmea.id}-actions`} className="flex justify-between items-center">
                                          <span className="text-sm" style={{ color: COLORS[index % COLORS.length] }}>
                                            {fmea.title}
                                          </span>
                                          <span className="text-sm font-medium">{totalActions} actions</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-lg font-medium mb-2">Detailed Maintenance Comparison</h3>
                              <Accordion type="single" collapsible className="w-full">
                                {selectedFMEAs.map((fmea, index) => (
                                  <AccordionItem key={fmea.id} value={fmea.id}>
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        ></div>
                                        <span>{fmea.title}</span>
                                        <span className="text-sm text-muted-foreground ml-2">
                                          ${calculateTotalMaintenanceCosts(fmea).toLocaleString()}/year
                                        </span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="space-y-4">
                                        {fmea.failure_modes.map((mode, idx) => (
                                          <div key={idx} className="border rounded p-3">
                                            <h4 className="font-medium">{mode.name}</h4>
                                            <div className="mt-2">
                                              <Table>
                                                <TableHeader>
                                                  <TableRow>
                                                    <TableHead>Action</TableHead>
                                                    <TableHead>Frequency</TableHead>
                                                    <TableHead>Cost</TableHead>
                                                    <TableHead>Annual Cost</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {mode.maintenanceActions?.map((action, i) => (
                                                    <TableRow key={i}>
                                                      <TableCell className="font-medium">{action.action}</TableCell>
                                                      <TableCell>{action.frequency}</TableCell>
                                                      <TableCell>
                                                        ${action.estimatedCost?.toLocaleString() || "N/A"}
                                                      </TableCell>
                                                      <TableCell>
                                                        ${action.annualCost?.toLocaleString() || "N/A"}
                                                      </TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            </div>
                          </div>
                        </TabsContent>

                        {/* RPN Analysis Tab */}
                        <TabsContent value="rpn" className="pt-4">
                          <div className="space-y-6">
                            <div className="border rounded-lg p-4">
                              <h3 className="text-lg font-medium mb-2">Risk Priority Number (RPN) Comparison</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Compare risk levels across different FMEAs (RPN = Severity × Occurrence × Detection)
                              </p>

                              <div className="space-y-6">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Average RPN</h4>
                                  <div className="space-y-3">
                                    {compareRPNValues().map((item, index) => {
                                      const maxRPN = Math.max(...compareRPNValues().map((i) => i.avgRPN))
                                      const percentage = (item.avgRPN / maxRPN) * 100

                                      return (
                                        <div key={`${item.id}-avg-rpn`} className="space-y-1">
                                          <div className="flex justify-between items-center">
                                            <span
                                              className="text-sm font-medium"
                                              style={{ color: COLORS[index % COLORS.length] }}
                                            >
                                              {item.title}
                                            </span>
                                            <span className="text-sm font-bold">{Math.round(item.avgRPN)}</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className="h-2 rounded-full"
                                              style={{
                                                width: `${percentage}%`,
                                                backgroundColor: COLORS[index % COLORS.length],
                                              }}
                                            ></div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Max RPN (Highest Risk)</h4>
                                    <div className="space-y-2">
                                      {compareRPNValues().map((item, index) => (
                                        <div key={`${item.id}-max-rpn`} className="flex justify-between items-center">
                                          <span className="text-sm" style={{ color: COLORS[index % COLORS.length] }}>
                                            {item.title}
                                          </span>
                                          <span
                                            className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                                              item.maxRPN > 150
                                                ? "bg-red-100 text-red-800"
                                                : item.maxRPN > 100
                                                  ? "bg-yellow-100 text-yellow-800"
                                                  : "bg-green-100 text-green-800"
                                            }`}
                                          >
                                            {item.maxRPN}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Total RPN (Cumulative Risk)</h4>
                                    <div className="space-y-2">
                                      {compareRPNValues().map((item, index) => (
                                        <div key={`${item.id}-total-rpn`} className="flex justify-between items-center">
                                          <span className="text-sm" style={{ color: COLORS[index % COLORS.length] }}>
                                            {item.title}
                                          </span>
                                          <span className="text-sm font-medium">{item.totalRPN}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-lg font-medium mb-2">Top High-Risk Failure Modes</h3>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>FMEA</TableHead>
                                    <TableHead>Failure Mode</TableHead>
                                    <TableHead>S</TableHead>
                                    <TableHead>O</TableHead>
                                    <TableHead>D</TableHead>
                                    <TableHead>RPN</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedFMEAs
                                    .flatMap(
                                      (fmea, fIndex) =>
                                        fmea.failure_modes
                                          .map((mode) => ({
                                            fmeaId: fmea.id,
                                            fmeaTitle: fmea.title,
                                            fmeaColor: COLORS[fIndex % COLORS.length],
                                            mode,
                                            rpn: mode.severity * mode.occurrence * mode.detection,
                                          }))
                                          .sort((a, b) => b.rpn - a.rpn)
                                          .slice(0, 2), // Take top 2 highest RPN modes per FMEA
                                    )
                                    .sort((a, b) => b.rpn - a.rpn)
                                    .map((item, idx) => (
                                      <TableRow key={`${item.fmeaId}-${idx}`}>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <div
                                              className="w-2 h-2 rounded-full"
                                              style={{ backgroundColor: item.fmeaColor }}
                                            ></div>
                                            <span>{item.fmeaTitle}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{item.mode.name}</TableCell>
                                        <TableCell>{item.mode.severity}</TableCell>
                                        <TableCell>{item.mode.occurrence}</TableCell>
                                        <TableCell>{item.mode.detection}</TableCell>
                                        <TableCell>
                                          <span
                                            className={`px-2 py-0.5 rounded-full ${
                                              item.rpn > 150
                                                ? "bg-red-100 text-red-800"
                                                : item.rpn > 100
                                                  ? "bg-yellow-100 text-yellow-800"
                                                  : "bg-green-100 text-green-800"
                                            }`}
                                          >
                                            {item.rpn}
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
