"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, FileText, AlertTriangle, TrendingUp, BarChart3, Activity } from "lucide-react"
import { useFMEAs } from "@/hooks/use-fmeas"
import { useSupabase } from "@/hooks/use-supabase"
import { useAuth } from "@/contexts/auth-context"
import type { SavedFMEA } from "@/lib/fmea-actions"

interface FMEAComparisonProps {
  fmea1Id?: string
  fmea2Id?: string
}

export function FMEAComparison({ fmea1Id, fmea2Id }: FMEAComparisonProps) {
  const [selectedFMEAs, setSelectedFMEAs] = useState<{ fmea1: SavedFMEA | null; fmea2: SavedFMEA | null }>({
    fmea1: null,
    fmea2: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { fmeas, loading: fmeasLoading, error: fmeasError } = useFMEAs()
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()

  // Load FMEAs if IDs are provided
  useEffect(() => {
    if (fmea1Id && fmea2Id && fmeas.length > 0) {
      const fmea1 = fmeas.find(f => f.id === fmea1Id)
      const fmea2 = fmeas.find(f => f.id === fmea2Id)
      
      if (fmea1 && fmea2) {
        setSelectedFMEAs({ fmea1, fmea2 })
      }
    }
  }, [fmea1Id, fmea2Id, fmeas])

  const handleFMEASelection = (fmea: SavedFMEA, position: 'fmea1' | 'fmea2') => {
    setSelectedFMEAs(prev => ({
      ...prev,
      [position]: fmea
    }))
  }

  const startComparison = () => {
    if (selectedFMEAs.fmea1 && selectedFMEAs.fmea2) {
      router.push(`/compare?fmea1=${selectedFMEAs.fmea1.id}&fmea2=${selectedFMEAs.fmea2.id}`)
    }
  }

  const canCompare = selectedFMEAs.fmea1 && selectedFMEAs.fmea2

  if (fmeasLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-muted-foreground">Loading FMEAs...</p>
      </div>
    )
  }

  if (fmeasError) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{fmeasError}</AlertDescription>
      </Alert>
    )
  }

  if (fmeas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No FMEAs to Compare</CardTitle>
          <CardDescription>
            You need at least 2 FMEAs to perform a comparison. Generate some FMEAs first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/generate')}>
            Generate FMEA
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (fmeas.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Enough FMEAs</CardTitle>
          <CardDescription>
            You need at least 2 FMEAs to perform a comparison. You currently have {fmeas.length}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/generate')}>
            Generate Another FMEA
          </Button>
        </CardContent>
      </Card>
    )
  }

  // If we have both FMEAs selected, show the comparison
  if (selectedFMEAs.fmea1 && selectedFMEAs.fmea2) {
    return <FMEAComparisonView fmea1={selectedFMEAs.fmea1} fmea2={selectedFMEAs.fmea2} />
  }

  // Show FMEA selection interface
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select FMEAs to Compare</CardTitle>
          <CardDescription>
            Choose two FMEAs from your saved reports to compare them side-by-side.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FMEA 1 Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">First FMEA</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {fmeas.map((fmea) => (
                  <Card
                    key={fmea.id}
                    className={`cursor-pointer transition-colors ${
                      selectedFMEAs.fmea1?.id === fmea.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleFMEASelection(fmea, 'fmea1')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{fmea.title}</h4>
                          <p className="text-sm text-gray-600">{fmea.asset_type}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(fmea.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedFMEAs.fmea1?.id === fmea.id && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* FMEA 2 Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Second FMEA</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {fmeas.map((fmea) => (
                  <Card
                    key={fmea.id}
                    className={`cursor-pointer transition-colors ${
                      selectedFMEAs.fmea2?.id === fmea.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleFMEASelection(fmea, 'fmea2')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{fmea.title}</h4>
                          <p className="text-sm text-gray-600">{fmea.asset_type}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(fmea.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedFMEAs.fmea2?.id === fmea.id && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button 
              onClick={startComparison}
              disabled={!canCompare}
              size="lg"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Compare FMEAs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Weibull analysis helper functions
function calculateMTTF(shape: number, scale: number): number {
  try {
    // Use approximation for gamma function if Math.gamma is not available
    const gamma = (x: number) => {
      if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x))
      x -= 1
      let a = 0.99999999999980993
      const p = [
        676.5203681218851, -1259.1392167224028, 771.32342877765313,
        -176.61502916214059, 12.507343278686905, -0.13857109526572012,
        9.9843695780195716e-6, 1.5056327351493116e-7
      ]
      for (let i = 0; i < p.length; i++) {
        a += p[i] / (x + i + 1)
      }
      const t = x + p.length - 0.5
      return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a
    }
    return scale * Math.exp(-1 / shape) * gamma(1 + 1 / shape)
  } catch (error) {
    console.error("Error calculating MTTF:", error)
    return scale // Fallback to scale parameter
  }
}

function weibullReliability(t: number, shape: number, scale: number): number {
  try {
    if (t < 0 || shape <= 0 || scale <= 0) return 0
    return Math.exp(-Math.pow(t / scale, shape))
  } catch (error) {
    console.error("Error calculating reliability:", error)
    return 0
  }
}

function weibullFailureRate(t: number, shape: number, scale: number): number {
  try {
    if (t < 0 || shape <= 0 || scale <= 0) return 0
    return (shape / scale) * Math.pow(t / scale, shape - 1)
  } catch (error) {
    console.error("Error calculating failure rate:", error)
    return 0
  }
}

function getWeibullInterpretation(shape: number): string {
  if (shape < 1) return "Decreasing failure rate (early failures)"
  if (shape === 1) return "Constant failure rate (random failures)"
  return "Increasing failure rate (wear-out failures)"
}

// Component to display the actual comparison
function FMEAComparisonView({ fmea1, fmea2 }: { fmea1: SavedFMEA; fmea2: SavedFMEA }) {
  const router = useRouter()

  // Add error boundary for the entire comparison
  try {
    const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      transformer: "Power Transformer",
      switchgear: "Switchgear",
      cable: "Power Cable",
      insulator: "Insulator",
      circuit_breaker: "Circuit Breaker"
    }
    return labels[type] || type
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 9) return "bg-red-100 text-red-800"
    if (severity >= 7) return "bg-orange-100 text-orange-800"
    if (severity >= 5) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getOccurrenceColor = (occurrence: number) => {
    if (occurrence >= 9) return "bg-red-100 text-red-800"
    if (occurrence >= 7) return "bg-orange-100 text-orange-800"
    if (occurrence >= 5) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getDetectionColor = (detection: number) => {
    if (detection <= 2) return "bg-red-100 text-red-800"
    if (detection <= 4) return "bg-orange-100 text-orange-800"
    if (detection <= 6) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">FMEA Comparison</h2>
          <p className="text-gray-600">Side-by-side analysis of your FMEA reports</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/compare')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Selection
        </Button>
      </div>

      {/* FMEA Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {fmea1.title}
            </CardTitle>
            <CardDescription>
              {getAssetTypeLabel(fmea1.asset_type)} • Created {new Date(fmea1.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Voltage Rating:</span>
                <span className="text-sm">{fmea1.voltage_rating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Environment:</span>
                <span className="text-sm">{fmea1.operating_environment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Age Range:</span>
                <span className="text-sm">{fmea1.age_range}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Criticality:</span>
                <span className="text-sm">{fmea1.asset_criticality}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {fmea2.title}
            </CardTitle>
            <CardDescription>
              {getAssetTypeLabel(fmea2.asset_type)} • Created {new Date(fmea2.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Voltage Rating:</span>
                <span className="text-sm">{fmea2.voltage_rating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Environment:</span>
                <span className="text-sm">{fmea2.operating_environment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Age Range:</span>
                <span className="text-sm">{fmea2.age_range}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Criticality:</span>
                <span className="text-sm">{fmea2.asset_criticality}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failure Modes Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Failure Modes Comparison</CardTitle>
          <CardDescription>
            Compare failure modes, RPNs, and risk levels between the two FMEAs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Failure Mode</th>
                  <th className="text-center p-4">FMEA 1</th>
                  <th className="text-center p-4">FMEA 2</th>
                  <th className="text-center p-4">Comparison</th>
                </tr>
              </thead>
              <tbody>
                {fmea1.failure_modes.map((mode1, index) => {
                  const mode2 = fmea2.failure_modes[index]
                  const rpn1 = mode1.severity * mode1.occurrence * mode1.detection
                  const rpn2 = mode2 ? mode2.severity * mode2.occurrence * mode2.detection : 0
                  
                  return (
                    <tr key={index} className="border-b">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{mode1.name}</div>
                          <div className="text-sm text-gray-600">{mode1.causes?.[0] || 'No causes listed'}</div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="space-y-1">
                          <div className="flex justify-center gap-2">
                            <Badge className={getSeverityColor(mode1.severity)}>S: {mode1.severity}</Badge>
                            <Badge className={getOccurrenceColor(mode1.occurrence)}>O: {mode1.occurrence}</Badge>
                            <Badge className={getDetectionColor(mode1.detection)}>D: {mode1.detection}</Badge>
                          </div>
                          <div className="text-lg font-bold">RPN: {rpn1}</div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {mode2 ? (
                          <div className="space-y-1">
                            <div className="flex justify-center gap-2">
                              <Badge className={getSeverityColor(mode2.severity)}>S: {mode2.severity}</Badge>
                              <Badge className={getOccurrenceColor(mode2.occurrence)}>O: {mode2.occurrence}</Badge>
                              <Badge className={getDetectionColor(mode2.detection)}>D: {mode2.detection}</Badge>
                            </div>
                            <div className="text-lg font-bold">RPN: {rpn2}</div>
                          </div>
                        ) : (
                          <div className="text-gray-400">No corresponding mode</div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {mode2 ? (
                          <div className="space-y-1">
                            <div className={`text-sm font-medium ${
                              rpn1 > rpn2 ? 'text-red-600' : rpn1 < rpn2 ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {rpn1 > rpn2 ? '↑ Higher Risk' : rpn1 < rpn2 ? '↓ Lower Risk' : '= Same Risk'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Δ: {Math.abs(rpn1 - rpn2)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400">N/A</div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Weibull Analysis Comparison */}
      {(fmea1.weibull_parameters && Object.keys(fmea1.weibull_parameters).length > 0) || 
       (fmea2.weibull_parameters && Object.keys(fmea2.weibull_parameters).length > 0) ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Weibull Analysis Comparison
            </CardTitle>
            <CardDescription>
              Compare reliability parameters and failure rate characteristics between FMEAs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Weibull Parameters Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Failure Mode</th>
                      <th className="text-center p-4">FMEA 1 Parameters</th>
                      <th className="text-center p-4">FMEA 2 Parameters</th>
                      <th className="text-center p-4">Comparison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fmea1.failure_modes.map((mode1, index) => {
                      const mode2 = fmea2.failure_modes[index]
                      const weibull1 = fmea1.weibull_parameters?.[mode1.name]
                      const weibull2 = fmea2.weibull_parameters?.[mode2?.name || '']
                      
                      if (!weibull1 && !weibull2) return null
                      
                      let mttf1 = 0
                      let mttf2 = 0
                      
                      try {
                        mttf1 = weibull1 ? calculateMTTF(weibull1.shape, weibull1.scale) : 0
                        mttf2 = weibull2 ? calculateMTTF(weibull2.shape, weibull2.scale) : 0
                      } catch (error) {
                        console.error("Error calculating MTTF for comparison:", error)
                      }
                      
                      return (
                        <tr key={index} className="border-b">
                          <td className="p-4">
                            <div className="font-medium">{mode1.name}</div>
                          </td>
                          <td className="p-4 text-center">
                            {weibull1 ? (
                              <div className="space-y-2">
                                <div className="flex justify-center gap-2">
                                  <Badge variant="outline">β: {weibull1.shape.toFixed(2)}</Badge>
                                  <Badge variant="outline">η: {weibull1.scale.toFixed(0)}h</Badge>
                                </div>
                                <div className="text-sm text-gray-600">
                                  MTTF: {mttf1.toFixed(0)}h
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getWeibullInterpretation(weibull1.shape)}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-400">No data</div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {weibull2 ? (
                              <div className="space-y-2">
                                <div className="flex justify-center gap-2">
                                  <Badge variant="outline">β: {weibull2.shape.toFixed(2)}</Badge>
                                  <Badge variant="outline">η: {weibull2.scale.toFixed(0)}h</Badge>
                                </div>
                                <div className="text-sm text-gray-600">
                                  MTTF: {mttf2.toFixed(0)}h
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getWeibullInterpretation(weibull2.shape)}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-400">No data</div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {weibull1 && weibull2 ? (
                              <div className="space-y-1">
                                <div className={`text-sm font-medium ${
                                  mttf1 > mttf2 ? 'text-green-600' : mttf1 < mttf2 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {mttf1 > mttf2 ? '↑ Longer Life' : mttf1 < mttf2 ? '↓ Shorter Life' : '= Similar Life'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Δ MTTF: {Math.abs(mttf1 - mttf2).toFixed(0)}h
                                </div>
                                <div className="text-xs text-gray-500">
                                  Shape Δ: {Math.abs(weibull1.shape - weibull2.shape).toFixed(2)}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-400">N/A</div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Reliability Comparison Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reliability Curves */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reliability Curves</CardTitle>
                    <CardDescription>Reliability vs. Time comparison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fmea1.failure_modes.slice(0, 3).map((mode, index) => {
                        const weibull1 = fmea1.weibull_parameters?.[mode.name]
                        const mode2 = fmea2.failure_modes[index]
                        const weibull2 = fmea2.weibull_parameters?.[mode2?.name || '']
                        
                        if (!weibull1 && !weibull2) return null
                        
                        return (
                          <div key={index} className="space-y-2">
                            <div className="font-medium text-sm">{mode.name}</div>
                            <div className="h-32 bg-gray-50 rounded p-4 flex items-end space-x-1">
                              {weibull1 && (
                                <div className="flex-1">
                                  <div className="text-xs text-blue-600 mb-1">FMEA 1</div>
                                  <div className="h-20 bg-blue-200 rounded-sm flex items-end">
                                    <div className="w-full h-16 bg-blue-500 rounded-sm opacity-80"></div>
                                  </div>
                                </div>
                              )}
                              {weibull2 && (
                                <div className="flex-1">
                                  <div className="text-xs text-green-600 mb-1">FMEA 2</div>
                                  <div className="h-20 bg-green-200 rounded-sm flex items-end">
                                    <div className="w-full h-16 bg-green-500 rounded-sm opacity-80"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {weibull1 && (() => {
                                try {
                                  const reliability = weibullReliability(1000, weibull1.shape, weibull1.scale) * 100
                                  return `FMEA 1: R(1000h) = ${reliability.toFixed(1)}%`
                                } catch (error) {
                                  console.error("Error calculating reliability for FMEA 1:", error)
                                  return "FMEA 1: Error calculating reliability"
                                }
                              })()}
                              {weibull1 && weibull2 && ' | '}
                              {weibull2 && (() => {
                                try {
                                  const reliability = weibullReliability(1000, weibull2.shape, weibull2.scale) * 100
                                  return `FMEA 2: R(1000h) = ${reliability.toFixed(1)}%`
                                } catch (error) {
                                  console.error("Error calculating reliability for FMEA 2:", error)
                                  return "FMEA 2: Error calculating reliability"
                                }
                              })()}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Failure Rate Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Failure Rate Characteristics</CardTitle>
                    <CardDescription>Shape parameter (β) comparison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fmea1.failure_modes.slice(0, 3).map((mode, index) => {
                        const weibull1 = fmea1.weibull_parameters?.[mode.name]
                        const mode2 = fmea2.failure_modes[index]
                        const weibull2 = fmea2.weibull_parameters?.[mode2?.name || '']
                        
                        if (!weibull1 && !weibull2) return null
                        
                        return (
                          <div key={index} className="space-y-2">
                            <div className="font-medium text-sm">{mode.name}</div>
                            <div className="flex items-center space-x-4">
                              {weibull1 && (
                                <div className="flex-1">
                                  <div className="text-xs text-blue-600 mb-1">FMEA 1</div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${weibull1.shape < 1 ? 'bg-red-500' : weibull1.shape === 1 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(weibull1.shape * 20, 100)}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-mono">{weibull1.shape.toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                              {weibull2 && (
                                <div className="flex-1">
                                  <div className="text-xs text-green-600 mb-1">FMEA 2</div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${weibull2.shape < 1 ? 'bg-red-500' : weibull2.shape === 1 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(weibull2.shape * 20, 100)}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-mono">{weibull2.shape.toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {weibull1 && getWeibullInterpretation(weibull1.shape)}
                              {weibull1 && weibull2 && ' vs '}
                              {weibull2 && getWeibullInterpretation(weibull2.shape)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold">
                  {Math.max(...fmea1.failure_modes.map(m => m.severity * m.occurrence * m.detection))}
                </div>
                <div className="text-sm text-gray-600">Highest RPN (FMEA 1)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold">
                  {Math.max(...fmea2.failure_modes.map(m => m.severity * m.occurrence * m.detection))}
                </div>
                <div className="text-sm text-gray-600">Highest RPN (FMEA 2)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold">
                  {fmea1.failure_modes.length}
                </div>
                <div className="text-sm text-gray-600">Failure Modes Count</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  } catch (error) {
    console.error("Error in FMEA comparison view:", error)
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            An error occurred while displaying the comparison. Please try again.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/compare')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Selection
        </Button>
      </div>
    )
  }
}