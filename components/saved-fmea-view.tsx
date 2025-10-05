"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Calendar } from "lucide-react"
import Link from "next/link"
import { RiskMatrix } from "@/components/risk-matrix"
import { SavedFMEAWeibullChart } from "@/components/saved-fmea-weibull-chart"
import type { SavedFMEA } from "@/lib/fmea-actions"

interface SavedFMEAViewProps {
  fmea: SavedFMEA
}

export function SavedFMEAView({ fmea }: SavedFMEAViewProps) {

  const getRPNColor = (rpn: number) => {
    if (rpn >= 200) return "text-red-600 bg-red-50"
    if (rpn >= 100) return "text-orange-600 bg-orange-50"
    if (rpn >= 40) return "text-yellow-600 bg-yellow-50"
    return "text-green-600 bg-green-50"
  }

  const getRPNLabel = (rpn: number) => {
    if (rpn >= 200) return "Critical"
    if (rpn >= 100) return "High"
    if (rpn >= 40) return "Medium"
    return "Low"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{fmea.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Created {new Date(fmea.created_at).toLocaleDateString()}
                </div>
                <Badge variant="secondary">{fmea.asset_type}</Badge>
                <Badge variant="outline">{fmea.voltage_rating}</Badge>
              </div>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Asset Information */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Asset Type</p>
                  <p className="font-medium">{fmea.asset_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Voltage Rating</p>
                  <p className="font-medium">{fmea.voltage_rating}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Environment</p>
                  <p className="font-medium">{fmea.operating_environment}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age Range</p>
                  <p className="font-medium">{fmea.age_range}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Load Profile</p>
                  <p className="font-medium">{fmea.load_profile}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Criticality</p>
                  <p className="font-medium capitalize">{fmea.asset_criticality}</p>
                </div>
              </div>
              {fmea.additional_notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Additional Notes</p>
                  <p className="mt-1">{fmea.additional_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Accordion
            type="multiple"
            defaultValue={["risk-matrix", "failure-modes", "weibull-analysis"]}
            className="space-y-4"
          >
            {/* Risk Matrix */}
            <AccordionItem value="risk-matrix" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="px-6 hover:no-underline">
                  <CardTitle>Risk Matrix</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent>
                    <RiskMatrix failureModes={fmea.failure_modes} />
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Failure Modes */}
            <AccordionItem value="failure-modes" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="px-6 hover:no-underline">
                  <CardTitle>Failure Modes Analysis ({fmea.failure_modes?.length || 0})</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent>
                    <div className="space-y-6">
                      {fmea.failure_modes?.map((mode, index) => {
                        const rpn = mode.severity * mode.occurrence * mode.detection
                        return (
                          <Card key={index} className="border-l-4 border-l-blue-500">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg">{mode.name}</CardTitle>
                                  <p className="text-sm text-gray-600 mt-1">{mode.description}</p>
                                </div>
                                <Badge className={getRPNColor(rpn)}>
                                  RPN: {rpn} ({getRPNLabel(rpn)})
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Severity</p>
                                  <p className="text-2xl font-bold">{mode.severity}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Occurrence</p>
                                  <p className="text-2xl font-bold">{mode.occurrence}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Detection</p>
                                  <p className="text-2xl font-bold">{mode.detection}</p>
                                </div>
                              </div>

                              {mode.causes && mode.causes.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-900 mb-2">Potential Causes:</p>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    {mode.causes.map((cause, i) => (
                                      <li key={i}>{cause}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {mode.effects && mode.effects.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-900 mb-2">Effects:</p>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    {mode.effects.map((effect, i) => (
                                      <li key={i}>{effect}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {mode.recommendations && mode.recommendations.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-900 mb-2">Recommendations:</p>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    {mode.recommendations.map((rec, i) => (
                                      <li key={i}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Weibull Analysis */}
            <AccordionItem value="weibull-analysis" className="border rounded-lg">
              <Card>
                <AccordionTrigger className="px-6 hover:no-underline">
                  <CardTitle>Weibull Distribution Analysis</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent>
                    <SavedFMEAWeibullChart fmea={fmea} />
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  )
}
