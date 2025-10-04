"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { weibullMTTF, weibullTimeAtReliability } from "@/lib/gamma"

interface WeibullParametersProps {
  weibullParameters: {
    [key: string]: {
      shape: number
      scale: number
    }
  }
}

export function WeibullParameters({ weibullParameters }: WeibullParametersProps) {
  const getFailurePattern = (shape: number): { label: string; color: string; description: string } => {
    if (shape < 1) {
      return {
        label: "Early Life Failures",
        color: "bg-blue-100 text-blue-800",
        description: "Decreasing failure rate - failures occur early in life (infant mortality)",
      }
    } else if (shape === 1) {
      return {
        label: "Random Failures",
        color: "bg-yellow-100 text-yellow-800",
        description: "Constant failure rate - failures occur randomly over time",
      }
    } else {
      return {
        label: "Wear-out Failures",
        color: "bg-red-100 text-red-800",
        description: "Increasing failure rate - failures increase with age (wear-out)",
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weibull Distribution Parameters</CardTitle>
        <CardDescription>
          Statistical parameters for reliability modeling and failure prediction based on the generated failure modes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(weibullParameters).map(([failureMode, params]) => {
            const pattern = getFailurePattern(params.shape)
            const mttf = weibullMTTF(params.shape, params.scale)
            const time10Percent = weibullTimeAtReliability(params.shape, params.scale, 0.9)
            const time90Percent = weibullTimeAtReliability(params.shape, params.scale, 0.1)

            return (
              <div key={failureMode} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium">{failureMode}</h4>
                  <Badge className={pattern.color}>{pattern.label}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Shape Parameter (β):</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{pattern.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-2xl font-bold">{params.shape.toFixed(2)}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Scale Parameter (η):</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Characteristic life - the time at which 63.2% of units are expected to fail
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-2xl font-bold">{params.scale.toLocaleString()} hours</p>
                    <p className="text-sm text-muted-foreground">({(params.scale / 8760).toFixed(1)} years)</p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <h5 className="text-sm font-medium mb-2">Reliability Metrics</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Mean Time to Failure</p>
                      <p className="font-medium">
                        {mttf.toLocaleString(undefined, { maximumFractionDigits: 0 })} hours
                      </p>
                      <p className="text-xs text-muted-foreground">({(mttf / 8760).toFixed(1)} years)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">10% Failure Time</p>
                      <p className="font-medium">
                        {time10Percent.toLocaleString(undefined, { maximumFractionDigits: 0 })} hours
                      </p>
                      <p className="text-xs text-muted-foreground">({(time10Percent / 8760).toFixed(1)} years)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">90% Failure Time</p>
                      <p className="font-medium">
                        {time90Percent.toLocaleString(undefined, { maximumFractionDigits: 0 })} hours
                      </p>
                      <p className="text-xs text-muted-foreground">({(time90Percent / 8760).toFixed(1)} years)</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h5 className="text-sm font-medium mb-2">Understanding Weibull Parameters</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Shape Parameter (β) determines the failure pattern over time</li>
            <li>• Scale Parameter (η) represents the characteristic life of the component</li>
            <li>• MTTF is the average time until failure across all units</li>
            <li>• 10% Failure Time indicates when the first 10% of units are expected to fail</li>
            <li>• 90% Failure Time indicates when 90% of units are expected to have failed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
