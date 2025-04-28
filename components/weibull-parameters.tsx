"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface WeibullParametersProps {
  shape: number
  scale: number
  onShapeChange: (value: number) => void
  onScaleChange: (value: number) => void
}

export function WeibullParameters({ shape, scale, onShapeChange, onScaleChange }: WeibullParametersProps) {
  const handleShapeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value > 0) {
      onShapeChange(value)
    }
  }

  const handleScaleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value > 0) {
      onScaleChange(value)
    }
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
          <span className="text-sm text-muted-foreground">{scale.toFixed(0)} hours</span>
        </div>
        <div className="flex gap-2">
          <Slider
            id="scale-parameter"
            min={1000}
            max={10000}
            step={100}
            value={[scale]}
            onValueChange={(values) => onScaleChange(values[0])}
          />
          <Input type="number" min={100} step={100} value={scale} onChange={handleScaleInputChange} className="w-20" />
        </div>
        <p className="text-xs text-muted-foreground">Characteristic life (63.2% of units will fail by this time)</p>
      </div>
    </div>
  )
}
