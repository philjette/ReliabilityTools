import Link from "next/link"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WeibullChart } from "@/components/weibull-chart"
import { DownloadPdfButton } from "@/components/download-pdf-button"
import { getFMEAById } from "@/lib/fmea-actions"

export default async function FMEADetails({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to home if not authenticated
  if (!session) {
    redirect("/")
  }

  const fmea = await getFMEAById(params.id)
  if (!fmea) {
    redirect("/dashboard/fmeas")
  }

  // Prepare failure mode data for the chart
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

  const failureModesForChart = fmea.failure_modes.slice(0, 5).map((mode: any, index: number) => {
    const params = fmea.weibull_parameters[mode.name] || { shape: 2.5, scale: 15000 }
    return {
      name: mode.name,
      shape: params.shape,
      scale: params.scale,
      color: CURVE_COLORS[index % CURVE_COLORS.length],
    }
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Header activePath="/dashboard" />
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
              <h1 className="text-3xl font-bold tracking-tighter">{fmea.title}</h1>
              <p className="text-muted-foreground mt-2">Created on {new Date(fmea.created_at).toLocaleDateString()}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <DownloadPdfButton fmeaId={fmea.id} fileName={`FMEA_${fmea.title.replace(/\s+/g, "_")}.pdf`}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </DownloadPdfButton>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Details</CardTitle>
                <CardDescription>Configuration details for this FMEA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Asset Type</p>
                    <p className="text-lg">{fmea.asset_type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Voltage Rating</p>
                    <p className="text-lg">{fmea.voltage_rating}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Operating Environment</p>
                    <p className="text-lg">{fmea.operating_environment}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Asset Age</p>
                    <p className="text-lg">{fmea.age_range}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Load Profile</p>
                    <p className="text-lg">{fmea.load_profile}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Asset Criticality</p>
                    <p className="text-lg">{fmea.asset_criticality}</p>
                  </div>
                </div>
                {fmea.additional_notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium">Additional Notes</p>
                    <p className="text-muted-foreground mt-1">{fmea.additional_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Failure Mode Analysis</CardTitle>
                <CardDescription>Potential failure modes for this asset</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {fmea.failure_modes.map((mode: any, index: number) => {
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
                                {mode.causes?.map((cause: string, i: number) => (
                                  <li key={i}>{cause}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Effects:</h4>
                              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                {mode.effects?.map((effect: string, i: number) => (
                                  <li key={i}>{effect}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Recommended Actions:</h4>
                              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                {mode.recommendations?.map((rec: string, i: number) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>

                            {mode.maintenanceActions && mode.maintenanceActions.length > 0 && (
                              <div className="space-y-3 mt-4 pt-4 border-t">
                                <h4 className="text-sm font-medium flex items-center justify-between">
                                  <span>Preventative Maintenance Plan:</span>
                                  <span className="text-primary font-bold">
                                    Total Annual Cost: $
                                    {mode.maintenanceActions
                                      .reduce((sum: number, action: any) => sum + (action.annualCost || 0), 0)
                                      .toLocaleString()}
                                  </span>
                                </h4>
                                <div className="space-y-3">
                                  {mode.maintenanceActions.map((action: any, i: number) => (
                                    <div key={i} className="bg-muted/50 p-3 rounded-md">
                                      <div className="flex justify-between items-start">
                                        <h5 className="font-medium text-sm">{action.action}</h5>
                                        <div className="flex gap-2">
                                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                            {action.frequency}
                                          </span>
                                          {action.estimatedCost && (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                              ${action.estimatedCost.toLocaleString()}
                                            </span>
                                          )}
                                          {action.annualCost && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                              ${action.annualCost.toLocaleString()}/year
                                            </span>
                                          )}
                                        </div>
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

            <Card>
              <CardHeader>
                <CardTitle>Weibull Distribution Analysis</CardTitle>
                <CardDescription>Failure probability distribution analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="cdf" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="cdf">CDF</TabsTrigger>
                    <TabsTrigger value="pdf">PDF</TabsTrigger>
                    <TabsTrigger value="hazard">Hazard</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cdf" className="pt-4">
                    <WeibullChart
                      type="cdf"
                      shape={fmea.weibull_parameters[fmea.failure_modes[0]?.name]?.shape || 2.5}
                      scale={fmea.weibull_parameters[fmea.failure_modes[0]?.name]?.scale || 15000}
                      failureModes={failureModesForChart}
                      showCombined={false}
                    />
                  </TabsContent>
                  <TabsContent value="pdf" className="pt-4">
                    <WeibullChart
                      type="pdf"
                      shape={fmea.weibull_parameters[fmea.failure_modes[0]?.name]?.shape || 2.5}
                      scale={fmea.weibull_parameters[fmea.failure_modes[0]?.name]?.scale || 15000}
                      failureModes={failureModesForChart}
                      showCombined={false}
                    />
                  </TabsContent>
                  <TabsContent value="hazard" className="pt-4">
                    <WeibullChart
                      type="hazard"
                      shape={fmea.weibull_parameters[fmea.failure_modes[0]?.name]?.shape || 2.5}
                      scale={fmea.weibull_parameters[fmea.failure_modes[0]?.name]?.scale || 15000}
                      failureModes={failureModesForChart}
                      showCombined={false}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Cost Analysis</CardTitle>
                <CardDescription>Annual maintenance cost breakdown by failure mode</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="w-full md:w-1/2">
                      <h3 className="text-lg font-medium mb-4">Overall Cost Summary</h3>
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Annual Maintenance Cost:</span>
                          <span className="text-xl font-bold text-primary">
                            $
                            {fmea.failure_modes
                              .reduce((total, mode) => {
                                return (
                                  total +
                                    mode.maintenanceActions?.reduce(
                                      (sum, action) => sum + (action.annualCost || 0),
                                      0,
                                    ) || 0
                                )
                              }, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Number of Maintenance Actions:</span>
                          <span className="font-semibold">
                            {fmea.failure_modes.reduce(
                              (total, mode) => total + (mode.maintenanceActions?.length || 0),
                              0,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Asset Criticality:</span>
                          <span className="font-semibold">{fmea.asset_criticality}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-1/2">
                      <h3 className="text-lg font-medium mb-4">Cost Breakdown by Failure Mode</h3>
                      <div className="space-y-3">
                        {fmea.failure_modes.map((mode) => {
                          const modeCost =
                            mode.maintenanceActions?.reduce((sum, action) => sum + (action.annualCost || 0), 0) || 0

                          // Calculate percentage of total cost
                          const totalCost = fmea.failure_modes.reduce((total, m) => {
                            return (
                              total +
                                m.maintenanceActions?.reduce((sum, action) => sum + (action.annualCost || 0), 0) || 0
                            )
                          }, 0)

                          const percentage = totalCost > 0 ? (modeCost / totalCost) * 100 : 0

                          return (
                            <div key={mode.name} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{mode.name}</span>
                                <span className="text-sm font-bold">${modeCost.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div className="h-2 rounded-full bg-primary" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <div className="text-xs text-right text-muted-foreground">
                                {percentage.toFixed(1)}% of total cost
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
