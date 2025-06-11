"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

// Hours in a year for conversion
const HOURS_IN_YEAR = 8760

interface WeibullParametersProps {
  shape: number
  scale: number
  onShapeChange: (value: number) => void
  onScaleChange: (value: number) => void
}

export function WeibullParameters({ shape, scale, onShapeChange, onScaleChange }: WeibullParametersProps) {
  // No conversion needed; scale is already in years
  const scaleInYears = scale

  const handleShapeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value > 0) {
      onShapeChange(value)
    }
  }

  const handleScaleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0 && value <= 200) {
      // Pass years directly
      onScaleChange(value)
    }
  }

  const handleScaleSliderChange = (values: number[]) => {
    // Pass years directly
    onScaleChange(values[0])
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="shape-parameter">Shape Parameter (β)</Label>
          <span className="text-sm text-muted-foreground">{shape.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          <Slider
            id="shape-parameter"
            min={0.5}
            max={5}
            step={0.1}
            value={[shape]}
            onValueChange={(values) => onShapeChange(values[0])}
          />
          <Input type="number" min={0.1} step={0.1} value={shape} onChange={handleShapeInputChange} className="w-20" />
        </div>
        <p className="text-xs text-muted-foreground">
          {shape < 1
            ? "Decreasing failure rate (early failures)"
            : shape === 1
              ? "Constant failure rate (random failures)"
              : "Increasing failure rate (wear-out failures)"}
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="scale-parameter">Scale Parameter (η)</Label>
          <span className="text-sm text-muted-foreground">{scaleInYears} years</span>
        </div>
        <div className="flex gap-2">
          <Slider
            id="scale-parameter"
            min={1}
            max={200}
            step={1}
            value={[scaleInYears]}
            onValueChange={handleScaleSliderChange}
          />
          <Input
            type="number"
            min={0}
            max={200}
            step={1}
            value={scaleInYears}
            onChange={handleScaleInputChange}
            className="w-20"
          />
        </div>
        <p className="text-xs text-muted-foreground">Characteristic life (63.2% of units will fail by this time)</p>
      </div>
    </div>
  )
}
