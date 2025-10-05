"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { WeibullChart } from "@/components/weibull-chart"
import type { SavedFMEA } from "@/lib/fmea-actions"

interface SavedFMEAWeibullChartProps {
  fmea: SavedFMEA
}

export function SavedFMEAWeibullChart({ fmea }: SavedFMEAWeibullChartProps) {
  const [timeUnit, setTimeUnit] = useState<"hours" | "years">("hours")
  const [chartType, setChartType] = useState<"cdf" | "pdf" | "hazard">("cdf")

  // Convert saved FMEA data to the format expected by WeibullChart
  const failureModes = fmea.failure_modes?.map((mode, index) => {
    const weibullParams = fmea.weibull_parameters?.[mode.name]
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]
    
    return {
      name: mode.name,
      shape: weibullParams?.shape || 1.5, // Default shape parameter
      scale: weibullParams?.scale || 100000, // Default scale parameter
      color: colors[index % colors.length]
    }
  }) || []

  // If no Weibull parameters are available, show a message
  if (!fmea.weibull_parameters || Object.keys(fmea.weibull_parameters).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weibull Distribution Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">No Weibull parameters available for this FMEA.</p>
            <p className="text-sm text-gray-500 mt-2">
              Weibull parameters are generated during FMEA creation and may not be available for older reports.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Weibull Distribution Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Chart Type Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Chart Type</Label>
              <RadioGroup
                value={chartType}
                onValueChange={(value: "cdf" | "pdf" | "hazard") => setChartType(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cdf" id="cdf-saved" />
                  <Label htmlFor="cdf-saved" className="cursor-pointer">
                    CDF
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf-saved" />
                  <Label htmlFor="pdf-saved" className="cursor-pointer">
                    PDF
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hazard" id="hazard-saved" />
                  <Label htmlFor="hazard-saved" className="cursor-pointer">
                    Hazard Rate
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Time Unit Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Time Unit</Label>
              <RadioGroup
                value={timeUnit}
                onValueChange={(value: "hours" | "years") => setTimeUnit(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hours" id="hours-saved" />
                  <Label htmlFor="hours-saved" className="cursor-pointer">
                    Hours
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="years" id="years-saved" />
                  <Label htmlFor="years-saved" className="cursor-pointer">
                    Years
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weibull Chart */}
      <Card>
        <CardContent className="p-6">
          {failureModes.length > 0 ? (
            <WeibullChart
              type={chartType}
              shape={failureModes[0].shape} // Use first failure mode as default
              scale={failureModes[0].scale}
              failureModes={failureModes}
              showCombined={false}
              timeUnit={timeUnit}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No failure modes with Weibull parameters found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weibull Parameters Table */}
      {fmea.weibull_parameters && Object.keys(fmea.weibull_parameters).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weibull Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Failure Mode</th>
                    <th className="text-center p-2">Shape (β)</th>
                    <th className="text-center p-2">Scale (η)</th>
                    <th className="text-center p-2">MTTF (hours)</th>
                    <th className="text-center p-2">Failure Pattern</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(fmea.weibull_parameters).map(([modeName, params]) => {
                    const mttf = params.scale * Math.exp(1 / params.shape) // Approximate MTTF
                    const pattern = params.shape < 1 ? "Early Life" : 
                                  params.shape === 1 ? "Random" : 
                                  params.shape > 1 ? "Wear-out" : "Unknown"
                    
                    return (
                      <tr key={modeName} className="border-b">
                        <td className="p-2 font-medium">{modeName}</td>
                        <td className="p-2 text-center">{params.shape.toFixed(2)}</td>
                        <td className="p-2 text-center">{params.scale.toFixed(0)}</td>
                        <td className="p-2 text-center">{mttf.toFixed(0)}</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            pattern === "Early Life" ? "bg-red-100 text-red-800" :
                            pattern === "Random" ? "bg-yellow-100 text-yellow-800" :
                            pattern === "Wear-out" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {pattern}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
