"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FailureMode {
  failureMode: string
  severity: number
  occurrence: number
  detection: number
  rpn: number
}

interface RiskMatrixProps {
  failureModes?: FailureMode[]
}

export function RiskMatrix({ failureModes = [] }: RiskMatrixProps) {
  const matrixData = useMemo(() => {
    const matrix: { [key: string]: FailureMode[] } = {}

    failureModes.forEach((mode) => {
      if (mode.severity && mode.occurrence) {
        const key = `${mode.severity}-${mode.occurrence}`
        if (!matrix[key]) {
          matrix[key] = []
        }
        matrix[key].push(mode)
      }
    })

    return matrix
  }, [failureModes])

  // Early return if no failure modes
  if (!failureModes || failureModes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Matrix</CardTitle>
          <CardDescription>No failure modes available to display</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Generate an FMEA first to see the risk matrix visualization
          </div>
        </CardContent>
      </Card>
    )
  }

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

  return (
    <div className="space-y-4">
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
                                • {mode.failureMode}
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

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        {[
          {
            level: "Critical",
            color: "text-red-600",
            count: failureModes.filter((m) => m.severity * m.occurrence >= 49).length,
          },
          {
            level: "High",
            color: "text-orange-600",
            count: failureModes.filter((m) => m.severity * m.occurrence >= 25 && m.severity * m.occurrence < 49).length,
          },
          {
            level: "Medium",
            color: "text-yellow-600",
            count: failureModes.filter((m) => m.severity * m.occurrence >= 16 && m.severity * m.occurrence < 25).length,
          },
          {
            level: "Low",
            color: "text-blue-600",
            count: failureModes.filter((m) => m.severity * m.occurrence >= 9 && m.severity * m.occurrence < 16).length,
          },
          {
            level: "Very Low",
            color: "text-green-600",
            count: failureModes.filter((m) => m.severity * m.occurrence < 9).length,
          },
        ].map((item) => (
          <div key={item.level} className="text-center">
            <div className={`text-2xl font-bold ${item.color}`}>{item.count}</div>
            <div className="text-muted-foreground">{item.level}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
