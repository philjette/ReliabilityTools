"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAppContext } from "@/contexts/AppContext"
import { getFMEAById } from "@/lib/fmea-actions"
import { WeibullChart } from "@/components/weibull-chart"

export function FMEAComparison() {
  const router = useRouter()
  const { selectedFMEAs, clearSelectedFMEAs } = useAppContext()
  const [loading, setLoading] = useState(true)
  const [fmeas, setFmeas] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    async function loadFMEAs() {
      if (selectedFMEAs.length < 2) {
        router.push("/dashboard/fmeas")
        return
      }

      setLoading(true)
      try {
        const loadedFmeas = await Promise.all(
          selectedFMEAs.map(async (fmea) => {
            const fullFmea = await getFMEAById(fmea.id)
            return fullFmea
          }),
        )
        setFmeas(loadedFmeas.filter(Boolean))
      } catch (error) {
        console.error("Error loading FMEAs for comparison:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFMEAs()
  }, [selectedFMEAs, router])

  const handleBack = () => {
    router.push("/dashboard/fmeas")
  }

  if (loading) {
    return <div className="text-center py-12">Loading comparison data...</div>
  }

  if (fmeas.length < 2) {
    return (
      <div className="text-center py-12">
        <p className="mb-4">Please select at least 2 FMEAs to compare.</p>
        <Button onClick={handleBack}>Back to FMEAs</Button>
      </div>
    )
  }

  // Prepare failure mode data for the chart
  const CURVE_COLORS = [
    "#0ea5e9", // sky blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
  ]

  const failureModesForChart = fmeas.flatMap((fmea, fmeaIndex) => {
    return fmea.failure_modes.slice(0, 2).map((mode: any, modeIndex: number) => {
      const params = fmea.weibull_parameters[mode.name] || { shape: 2.5, scale: 15000 }
      return {
        name: `${fmea.title} - ${mode.name}`,
        shape: params.shape,
        scale: params.scale,
        color: CURVE_COLORS[(fmeaIndex * 2 + modeIndex) % CURVE_COLORS.length],
      }
    })
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to FMEAs
        </Button>
        <Button variant="ghost" onClick={() => clearSelectedFMEAs()}>
          Clear Selection
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="failureModes">Failure Modes</TabsTrigger>
          <TabsTrigger value="weibull">Weibull Analysis</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Comparison</CardTitle>
              <CardDescription>Compare the basic properties of selected FMEAs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Property</TableHead>
                    {fmeas.map((fmea) => (
                      <TableHead key={fmea.id}>{fmea.title}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Asset Type</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-type`}>{fmea.asset_type}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Voltage Rating</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-voltage`}>{fmea.voltage_rating}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Operating Environment</TableCell>
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
                    <TableCell className="font-medium">Load Profile</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-load`}>{fmea.load_profile}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Asset Criticality</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-criticality`}>{fmea.asset_criticality}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Creation Date</TableCell>
                    {fmeas.map((fmea) => (
                      <TableCell key={`${fmea.id}-date`}>{new Date(fmea.created_at).toLocaleDateString()}</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failureModes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failure Mode Comparison</CardTitle>
              <CardDescription>Compare failure modes and risk priority numbers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">FMEA</TableHead>
                    <TableHead>Failure Mode</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Occurrence</TableHead>
                    <TableHead>Detection</TableHead>
                    <TableHead>RPN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fmeas.flatMap((fmea) =>
                    fmea.failure_modes.map((mode: any, index: number) => {
                      const rpn = mode.severity * mode.occurrence * mode.detection
                      let rpnClass = ""
                      if (rpn > 150) rpnClass = "text-red-600 font-bold"
                      else if (rpn < 100) rpnClass = "text-green-600"
                      else rpnClass = "text-yellow-600"

                      return (
                        <TableRow key={`${fmea.id}-${index}`}>
                          {index === 0 && (
                            <TableCell rowSpan={fmea.failure_modes.length} className="font-medium">
                              {fmea.title}
                            </TableCell>
                          )}
                          <TableCell>{mode.name}</TableCell>
                          <TableCell>{mode.severity}</TableCell>
                          <TableCell>{mode.occurrence}</TableCell>
                          <TableCell>{mode.detection}</TableCell>
                          <TableCell className={rpnClass}>{rpn}</TableCell>
                        </TableRow>
                      )
                    }),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weibull" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weibull Distribution Comparison</CardTitle>
              <CardDescription>Compare failure probability distributions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cdf" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="cdf">CDF</TabsTrigger>
                  <TabsTrigger value="pdf">PDF</TabsTrigger>
                  <TabsTrigger value="hazard">Hazard</TabsTrigger>
                </TabsList>
                <TabsContent value="cdf" className="pt-4">
                  <WeibullChart
                    type="cdf"
                    shape={2.5}
                    scale={15000}
                    failureModes={failureModesForChart}
                    showCombined={false}
                  />
                </TabsContent>
                <TabsContent value="pdf" className="pt-4">
                  <WeibullChart
                    type="pdf"
                    shape={2.5}
                    scale={15000}
                    failureModes={failureModesForChart}
                    showCombined={false}
                  />
                </TabsContent>
                <TabsContent value="hazard" className="pt-4">
                  <WeibullChart
                    type="hazard"
                    shape={2.5}
                    scale={15000}
                    failureModes={failureModesForChart}
                    showCombined={false}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Action Comparison</CardTitle>
              <CardDescription>Compare recommended maintenance actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {fmeas.map((fmea) => (
                  <div key={fmea.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                    <h3 className="text-lg font-medium mb-4">{fmea.title}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Failure Mode</TableHead>
                          <TableHead>Maintenance Action</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fmea.failure_modes.flatMap(
                          (mode: any, modeIndex: number) =>
                            mode.maintenanceActions?.map((action: any, actionIndex: number) => (
                              <TableRow key={`${fmea.id}-${modeIndex}-${actionIndex}`}>
                                {actionIndex === 0 && (
                                  <TableCell rowSpan={mode.maintenanceActions?.length || 1} className="font-medium">
                                    {mode.name}
                                  </TableCell>
                                )}
                                <TableCell>{action.action}</TableCell>
                                <TableCell>{action.frequency}</TableCell>
                                <TableCell>{action.description}</TableCell>
                              </TableRow>
                            )) || [],
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
