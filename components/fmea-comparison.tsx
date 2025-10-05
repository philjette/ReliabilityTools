"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, FileText, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react"
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

// Component to display the actual comparison
function FMEAComparisonView({ fmea1, fmea2 }: { fmea1: SavedFMEA; fmea2: SavedFMEA }) {
  const router = useRouter()

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

      {/* Weibull Parameters Comparison */}
      {(fmea1.weibull_parameters && Object.keys(fmea1.weibull_parameters).length > 0) || 
       (fmea2.weibull_parameters && Object.keys(fmea2.weibull_parameters).length > 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>Weibull Parameters Comparison</CardTitle>
            <CardDescription>
              Compare Weibull distribution parameters for reliability analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  {Object.keys({...fmea1.weibull_parameters, ...fmea2.weibull_parameters}).map((modeName) => {
                    const params1 = fmea1.weibull_parameters?.[modeName]
                    const params2 = fmea2.weibull_parameters?.[modeName]
                    
                    return (
                      <tr key={modeName} className="border-b">
                        <td className="p-4">
                          <div className="font-medium">{modeName}</div>
                        </td>
                        <td className="p-4 text-center">
                          {params1 ? (
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="font-medium">Shape (β):</span> {params1.shape.toFixed(2)}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Scale (η):</span> {params1.scale.toFixed(0)}h
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400">No data</div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {params2 ? (
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="font-medium">Shape (β):</span> {params2.shape.toFixed(2)}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Scale (η):</span> {params2.scale.toFixed(0)}h
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400">No data</div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {params1 && params2 ? (
                            <div className="space-y-1">
                              <div className={`text-sm font-medium ${
                                params1.shape > params2.shape ? 'text-red-600' : 
                                params1.shape < params2.shape ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                Shape: {params1.shape > params2.shape ? '↑ Higher' : 
                                       params1.shape < params2.shape ? '↓ Lower' : '= Same'}
                              </div>
                              <div className={`text-sm font-medium ${
                                params1.scale > params2.scale ? 'text-green-600' : 
                                params1.scale < params2.scale ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                Scale: {params1.scale > params2.scale ? '↑ Higher' : 
                                       params1.scale < params2.scale ? '↓ Lower' : '= Same'}
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
      ) : null}

      {/* Maintenance Recommendations Comparison */}
          <Card>
            <CardHeader>
          <CardTitle>Maintenance Recommendations Comparison</CardTitle>
          <CardDescription>
            Compare maintenance actions and recommendations between FMEAs
          </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
            {fmea1.failure_modes.map((mode1, index) => {
              const mode2 = fmea2.failure_modes[index]
              const actions1 = mode1.maintenanceActions || []
              const actions2 = mode2?.maintenanceActions || []
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-4">{mode1.name}</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* FMEA 1 Maintenance Actions */}
                    <div>
                      <h5 className="font-medium text-sm text-gray-600 mb-3">FMEA 1 Maintenance Actions</h5>
                      {actions1.length > 0 ? (
                        <div className="space-y-3">
                          {actions1.map((action, actionIndex) => (
                            <div key={actionIndex} className="bg-blue-50 p-3 rounded-lg">
                              <div className="font-medium text-sm">{action.action}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">Frequency:</span> {action.frequency}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{action.description}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">No maintenance actions defined</div>
                      )}
                    </div>
                    
                    {/* FMEA 2 Maintenance Actions */}
                    <div>
                      <h5 className="font-medium text-sm text-gray-600 mb-3">FMEA 2 Maintenance Actions</h5>
                      {actions2.length > 0 ? (
                        <div className="space-y-3">
                          {actions2.map((action, actionIndex) => (
                            <div key={actionIndex} className="bg-green-50 p-3 rounded-lg">
                              <div className="font-medium text-sm">{action.action}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">Frequency:</span> {action.frequency}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{action.description}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">No maintenance actions defined</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Comparison Summary */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Maintenance Actions Count:</span>
                      <div className="flex gap-4">
                        <span className="text-blue-600">FMEA 1: {actions1.length}</span>
                        <span className="text-green-600">FMEA 2: {actions2.length}</span>
                        <span className={`font-medium ${
                          actions1.length > actions2.length ? 'text-blue-600' : 
                          actions1.length < actions2.length ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {actions1.length > actions2.length ? '↑ More in FMEA 1' : 
                           actions1.length < actions2.length ? '↑ More in FMEA 2' : '= Equal'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

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
}