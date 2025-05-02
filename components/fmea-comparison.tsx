"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WeibullChart } from "@/components/weibull-chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface MaintenanceAction {
  action: string
  frequency: string
  description: string
  estimatedCost?: number
  annualCost?: number
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
  maintenanceActions: MaintenanceAction[]
}

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

interface FMEAComparisonProps {
  fmeas: FMEA[]
}

export function FMEAComparison({ fmeas }: FMEAComparisonProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [chartType, setChartType] = useState("cdf")

  // Define color array for charts and UI elements
  const COLORS = [
    "#0ea5e9", // sky blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
  ]

  // Prepare data for Weibull chart
  const prepareWeibullChartData = () => {
    const chartData = fmeas.flatMap((fmea, fmeaIndex) => {
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
    return fmeas.map((fmea) => {
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
    <>
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
          <p className="text-muted-foreground mt-2">Comparing {fmeas.length} FMEAs</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FMEA Comparison</CardTitle>
          <CardDescription>Comparing {fmeas.length} FMEAs</CardDescription>
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
                    {fmeas.map((fmea, index) => (
                      <TableHead key={fmea.id} style={{ color: COLORS[index % COLORS.length] }}>
                        {fmea.title}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Asset Type</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-asset-type`}>{fmea.asset_type}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Voltage Rating</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-voltage`}>{fmea.voltage_rating}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Environment</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-env`}>{fmea.operating_environment}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Asset Age</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-age`}>{fmea.age_range}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Criticality</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-criticality`}>{fmea.asset_criticality}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Failure Modes</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-modes`}>{fmea.failure_modes.length}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Annual Maintenance Cost</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-cost`} className="font-bold">
                        ${calculateTotalMaintenanceCosts(fmea).toLocaleString()}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Created</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-created`}>{new Date(fmea.created_at).toLocaleDateString()}</TableCell>
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
                      {fmeas.map((fmea, index) => {
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
                      {fmeas.map((fmea, index) => {
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
                        {fmeas.map((fmea, index) => {
                          const totalCost = calculateTotalMaintenanceCosts(fmea)
                          const maxCost = Math.max(...fmeas.map((f) => calculateTotalMaintenanceCosts(f)))
                          const percentage = (totalCost / maxCost) * 100

                          return (
                            <div key={`${fmea.id}-cost`} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium" style={{ color: COLORS[index % COLORS.length] }}>
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
                        {fmeas.map((fmea, index) => {
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
                                <span className="text-sm font-medium" style={{ color: COLORS[index % COLORS.length] }}>
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
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  )
}
