"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, TrendingUp, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"

interface FailureMode {
  failureMode: string
  severity: number
  occurrence: number
  detection: number
  rpn: number
  causes?: string[]
  effects?: string[]
  recommendations?: string[]
}

interface FMEAData {
  id: string
  title: string
  asset_type: string
  voltage_rating: string
  created_at: string
  failure_modes: FailureMode[]
}

interface OverallRiskMatrixProps {
  fmeas: FMEAData[]
}

export function OverallRiskMatrix({ fmeas }: OverallRiskMatrixProps) {
  // Aggregate all failure modes from all FMEAs
  const allFailureModes = useMemo(() => {
    const modes: (FailureMode & { fmeaId: string; fmeaTitle: string; assetType: string })[] = []
    
    fmeas.forEach((fmea) => {
      if (fmea.failure_modes && Array.isArray(fmea.failure_modes)) {
        fmea.failure_modes.forEach((mode) => {
          modes.push({
            ...mode,
            fmeaId: fmea.id,
            fmeaTitle: fmea.title,
            assetType: fmea.asset_type
          })
        })
      }
    })
    
    return modes
  }, [fmeas])

  // Group failure modes by risk level
  const riskGroups = useMemo(() => {
    const groups = {
      critical: [] as typeof allFailureModes,
      high: [] as typeof allFailureModes,
      medium: [] as typeof allFailureModes,
      low: [] as typeof allFailureModes,
      veryLow: [] as typeof allFailureModes
    }

    allFailureModes.forEach((mode) => {
      const risk = mode.severity * mode.occurrence
      if (risk >= 49) groups.critical.push(mode)
      else if (risk >= 25) groups.high.push(mode)
      else if (risk >= 16) groups.medium.push(mode)
      else if (risk >= 9) groups.low.push(mode)
      else groups.veryLow.push(mode)
    })

    return groups
  }, [allFailureModes])

  // Create matrix data for visualization
  const matrixData = useMemo(() => {
    const matrix: { [key: string]: typeof allFailureModes } = {}

    allFailureModes.forEach((mode) => {
      if (mode.severity && mode.occurrence) {
        const key = `${mode.severity}-${mode.occurrence}`
        if (!matrix[key]) {
          matrix[key] = []
        }
        matrix[key].push(mode)
      }
    })

    return matrix
  }, [allFailureModes])

  const getRiskColor = (severity: number, occurrence: number): string => {
    const risk = severity * occurrence
    if (risk >= 49) return "bg-red-500"
    if (risk >= 25) return "bg-orange-500"
    if (risk >= 16) return "bg-yellow-500"
    if (risk >= 9) return "bg-blue-500"
    return "bg-green-500"
  }

  const getRiskLevel = (severity: number, occurrence: number): string => {
    const risk = severity * occurrence
    if (risk >= 49) return "Critical"
    if (risk >= 25) return "High"
    if (risk >= 16) return "Medium"
    if (risk >= 9) return "Low"
    return "Very Low"
  }

  if (allFailureModes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Risk Matrix
          </CardTitle>
          <CardDescription>Risk analysis across all your FMEAs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No failure modes available</p>
              <p className="text-sm">Generate and save FMEAs to see the overall risk matrix</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Overall Risk Matrix
        </CardTitle>
        <CardDescription>
          Risk analysis across {fmeas.length} FMEA{fmeas.length !== 1 ? 's' : ''} with {allFailureModes.length} total failure modes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="matrix" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matrix">Risk Matrix</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="matrix" className="space-y-4">
            {/* Risk Matrix Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-11 gap-1 text-xs">
                  {/* Header row */}
                  <div className="col-span-1"></div>
                  <div className="col-span-10 text-center font-medium mb-2">Occurrence →</div>

                  {/* Column headers */}
                  <div className="flex items-center justify-center font-medium">
                    <div className="transform -rotate-90 whitespace-nowrap">Severity ↓</div>
                  </div>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <div key={num} className="text-center font-medium p-2">
                      {num}
                    </div>
                  ))}

                  {/* Matrix cells */}
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((severity) => (
                    <>
                      <div key={`severity-${severity}`} className="text-center font-medium p-2">
                        {severity}
                      </div>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((occurrence) => {
                        const key = `${severity}-${occurrence}`
                        const modes = matrixData[key] || []
                        const riskColor = getRiskColor(severity, occurrence)

                        return (
                          <div
                            key={`${severity}-${occurrence}`}
                            className={`${riskColor} p-2 rounded text-white text-center relative group cursor-pointer min-h-[40px] flex items-center justify-center`}
                            title={`Severity: ${severity}, Occurrence: ${occurrence}, Risk: ${getRiskLevel(severity, occurrence)}`}
                          >
                            {modes.length > 0 && <span className="text-xs font-bold">{modes.length}</span>}

                            {/* Tooltip */}
                            {modes.length > 0 && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-black text-white text-xs rounded p-2 whitespace-nowrap max-w-xs">
                                  <div className="font-medium mb-1">
                                    {modes.length} failure mode{modes.length > 1 ? "s" : ""}
                                  </div>
                                  {modes.slice(0, 3).map((mode, idx) => (
                                    <div key={idx} className="truncate">
                                      • {mode.failureMode} ({mode.fmeaTitle})
                                    </div>
                                  ))}
                                  {modes.length > 3 && <div>... and {modes.length - 3} more</div>}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Very Low (1-8)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Low (9-15)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Medium (16-24)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>High (25-48)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Critical (49-100)</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            {/* Risk Level Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              {[
                {
                  level: "Critical",
                  color: "text-red-600",
                  bgColor: "bg-red-50",
                  count: riskGroups.critical.length,
                },
                {
                  level: "High",
                  color: "text-orange-600",
                  bgColor: "bg-orange-50",
                  count: riskGroups.high.length,
                },
                {
                  level: "Medium",
                  color: "text-yellow-600",
                  bgColor: "bg-yellow-50",
                  count: riskGroups.medium.length,
                },
                {
                  level: "Low",
                  color: "text-blue-600",
                  bgColor: "bg-blue-50",
                  count: riskGroups.low.length,
                },
                {
                  level: "Very Low",
                  color: "text-green-600",
                  bgColor: "bg-green-50",
                  count: riskGroups.veryLow.length,
                },
              ].map((item) => (
                <div key={item.level} className={`text-center p-4 rounded-lg ${item.bgColor}`}>
                  <div className={`text-3xl font-bold ${item.color}`}>{item.count}</div>
                  <div className="text-muted-foreground font-medium">{item.level}</div>
                </div>
              ))}
            </div>

            {/* Asset Type Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Risk by Asset Type
              </h4>
              <div className="grid gap-3">
                {Object.entries(
                  allFailureModes.reduce((acc, mode) => {
                    const assetType = mode.assetType
                    if (!acc[assetType]) {
                      acc[assetType] = { total: 0, critical: 0, high: 0 }
                    }
                    acc[assetType].total++
                    const risk = mode.severity * mode.occurrence
                    if (risk >= 49) acc[assetType].critical++
                    else if (risk >= 25) acc[assetType].high++
                    return acc
                  }, {} as Record<string, { total: number; critical: number; high: number }>)
                ).map(([assetType, stats]) => (
                  <div key={assetType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{assetType}</Badge>
                      <span className="text-sm text-gray-600">{stats.total} failure modes</span>
                    </div>
                    <div className="flex gap-2">
                      {stats.critical > 0 && (
                        <Badge variant="destructive">{stats.critical} Critical</Badge>
                      )}
                      {stats.high > 0 && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          {stats.high} High
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {/* Critical and High Risk Items */}
            {[...riskGroups.critical, ...riskGroups.high].length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Critical & High Risk Items
                </h4>
                <div className="space-y-2">
                  {[...riskGroups.critical, ...riskGroups.high]
                    .sort((a, b) => (b.severity * b.occurrence) - (a.severity * a.occurrence))
                    .map((mode, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={mode.severity * mode.occurrence >= 49 ? "destructive" : "outline"}
                                className={mode.severity * mode.occurrence >= 49 ? "" : "text-orange-600 border-orange-600"}
                              >
                                {getRiskLevel(mode.severity, mode.occurrence)}
                              </Badge>
                              <span className="text-sm text-gray-600">RPN: {mode.rpn}</span>
                            </div>
                            <h5 className="font-medium">{mode.failureMode}</h5>
                            <p className="text-sm text-gray-600">
                              {mode.fmeaTitle} • {mode.assetType}
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/fmea/${mode.fmeaId}`}>View FMEA</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* All FMEAs Summary */}
            <div className="space-y-3">
              <h4 className="font-medium">FMEA Summary</h4>
              <div className="grid gap-3">
                {fmeas.map((fmea) => {
                  const fmeaModes = allFailureModes.filter(mode => mode.fmeaId === fmea.id)
                  const criticalCount = fmeaModes.filter(mode => mode.severity * mode.occurrence >= 49).length
                  const highCount = fmeaModes.filter(mode => {
                    const risk = mode.severity * mode.occurrence
                    return risk >= 25 && risk < 49
                  }).length

                  return (
                    <div key={fmea.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-medium">{fmea.title}</h5>
                        <p className="text-sm text-gray-600">
                          {fmea.asset_type} • {fmeaModes.length} failure modes
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {criticalCount > 0 && (
                          <Badge variant="destructive">{criticalCount} Critical</Badge>
                        )}
                        {highCount > 0 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            {highCount} High
                          </Badge>
                        )}
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/fmea/${fmea.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
