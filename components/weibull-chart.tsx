"use client"

import { useId } from "react"
import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { RawDataPoint } from "@/lib/weibull-analysis-actions"

export type { RawDataPoint }

interface WeibullChartProps {
  type: "cdf" | "pdf" | "hazard"
  shape: number
  scale: number
  failureModes?: Array<{
    name: string
    shape: number
    scale: number
    color: string
  }>
  showCombined?: boolean
  timeUnit?: "hours" | "years"
  rawDataPoints?: RawDataPoint[]
  showDataPoints?: boolean
}

const HOURS_IN_YEAR = 8760

function convertToYears(hours: number): number {
  return hours / HOURS_IN_YEAR
}

function generateTicks(scale: number, maxTime: number, timeUnit: "hours" | "years" = "years") {
  const ticks = []

  if (timeUnit === "years") {
    // When timeUnit is "years", the data's time values are already in years
    // maxTime here is in years (converted from the display data)
    const maxTimeInYears = maxTime
    
    let step: number
    if (maxTimeInYears <= 5) {
      step = 1
    } else if (maxTimeInYears <= 20) {
      step = 2
    } else if (maxTimeInYears <= 50) {
      step = 5
    } else if (maxTimeInYears <= 100) {
      step = 10
    } else {
      step = 20
    }

    for (let i = 0; i <= Math.ceil(maxTimeInYears / step) * step; i += step) {
      if (i <= maxTimeInYears * 1.1) { // Allow slight overflow for last tick
        ticks.push(i)
      }
    }
  } else {
    // Hours mode - calculate appropriate step
    let step: number
    if (scale < 87600) { // Less than 10 years
      step = 8760 // 1 year in hours
    } else if (scale < 262800) { // Less than 30 years
      step = 43800 // 5 years in hours
    } else {
      step = 87600 // 10 years in hours
    }

    for (let i = 0; i <= Math.ceil(maxTime / step) * step; i += step) {
      if (i <= maxTime * 1.1) {
        ticks.push(i)
      }
    }
  }

  // Ensure we always have at least 0 tick
  if (ticks.length === 0 || ticks[0] !== 0) {
    ticks.unshift(0)
  }

  return ticks
}

export function WeibullChart({
  type,
  shape,
  scale,
  failureModes = [],
  showCombined = false,
  timeUnit = "years",
  rawDataPoints = [],
  showDataPoints = false,
}: WeibullChartProps) {
  const gradientId = useId().replace(/:/g, "")
  const singleModeData = generateWeibullData(type, shape, scale, timeUnit)
  const multiModeData = generateMultiModeData(type, failureModes, showCombined, timeUnit)

  const data = failureModes.length > 0 ? multiModeData : singleModeData
  
  // Generate empirical data points for scatter plot (only for CDF)
  const empiricalDataPoints = showDataPoints && type === "cdf" && rawDataPoints.length > 0
    ? generateEmpiricalCDF(rawDataPoints, timeUnit)
    : []
  const xDomain = data.length
    ? ([data[0]?.time ?? 0, data[data.length - 1]?.time ?? 1] as [number, number])
    : ([0, 1] as [number, number])

  const yAxisLabel = type === "cdf" ? "Cumulative Probability" : type === "pdf" ? "Probability Density" : "Hazard Rate"
  const xAxisLabel = timeUnit === "years" ? "Time (years)" : "Time (hours)"

  const maxScaleHours = failureModes.length > 0 ? Math.max(...failureModes.map((mode) => mode.scale)) : scale
  // Convert maxTime to display units for tick calculation
  const maxTimeHours = maxScaleHours * 2
  const maxTimeDisplay = timeUnit === "years" ? convertToYears(maxTimeHours) : maxTimeHours

  if (failureModes.length > 0) {
    return (
      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{ value: xAxisLabel, position: "insideBottomRight", offset: -10 }}
              tickMargin={10}
              tickFormatter={(value) => timeUnit === "years" ? value.toFixed(1) : Math.round(value).toString()}
              ticks={generateTicks(maxScaleHours, maxTimeDisplay, timeUnit)}
              domain={xDomain}
              type="number"
              scale="linear"
            />
            <YAxis
              label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: -5 }}
              domain={type === "cdf" ? [0, 1] : [0, "auto"]}
              tickMargin={10}
            />
            <Tooltip
              formatter={(value: number, name: string) => [value.toFixed(4), name]}
              labelFormatter={(label) => `Time: ${Number(label).toFixed(2)} ${timeUnit}`}
            />
            <Legend wrapperStyle={{ paddingTop: 10 }} />

            {!showCombined &&
              failureModes.map((mode, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={mode.name}
                  name={mode.name}
                  stroke={mode.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}

            {showCombined && (
              <Line
                type="monotone"
                dataKey="combined"
                name="Overall System Failure"
                stroke="#ff0000"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            
            {showDataPoints && empiricalDataPoints.length > 0 && (
              <Scatter
                name="Data Points"
                data={empiricalDataPoints}
                dataKey="empiricalCDF"
                fill="#f97316"
                shape="circle"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Debug: Show data info
  if (data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center border rounded-lg bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No data to display</p>
          <p className="text-sm text-gray-500">Shape: {shape}, Scale: {scale}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
          <defs>
            <linearGradient id={`colorValue-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            label={{ value: xAxisLabel, position: "insideBottomRight", offset: -10 }}
            tickMargin={10}
            tickFormatter={(value) => (timeUnit === "years" ? value.toFixed(1) : Math.round(value).toString())}
            ticks={generateTicks(scale, maxTimeDisplay, timeUnit)}
            domain={xDomain}
            type="number"
            scale="linear"
          />
          <YAxis
            label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: -5 }}
            domain={type === "cdf" ? [0, 1] : [0, "auto"]}
            tickMargin={10}
          />
          <Tooltip
            formatter={(value: number, name: string) => [value.toFixed(4), name === "empiricalCDF" ? "Data Point" : yAxisLabel]}
            labelFormatter={(label) => `Time: ${Number(label).toFixed(2)} ${timeUnit}`}
          />
          <Area
            type="monotone"
            dataKey="value"
            name="Fitted Curve"
            stroke="#0ea5e9"
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#colorValue-${gradientId})`}
          />
          {showDataPoints && empiricalDataPoints.length > 0 && (
            <Scatter
              name="Data Points"
              data={empiricalDataPoints}
              dataKey="empiricalCDF"
              fill="#f97316"
              shape="circle"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function generateWeibullData(
  type: "cdf" | "pdf" | "hazard",
  shape: number,
  scale: number,
  timeUnit: "hours" | "years" = "years",
) {
  const data: Array<{ time: number; value: number }> = []
  const scaleHours = scale > 0 ? scale : 8760
  const maxTime = scaleHours * 2
  const step = maxTime / 100

  for (let i = 0; i <= 100; i++) {
    const timeInHours = i * step

    if (timeInHours === 0 && (type === "pdf" || type === "hazard")) {
      continue
    }

    let value = 0
    switch (type) {
      case "cdf":
        value = 1 - Math.exp(-Math.pow(timeInHours / scaleHours, shape))
        break
      case "pdf":
        value =
          (shape / scaleHours) *
          Math.pow(timeInHours / scaleHours, shape - 1) *
          Math.exp(-Math.pow(timeInHours / scaleHours, shape))
        break
      case "hazard":
        value = (shape / scaleHours) * Math.pow(timeInHours / scaleHours, shape - 1)
        break
    }

    const displayTime = timeUnit === "years" ? convertToYears(timeInHours) : timeInHours
    data.push({ time: Number(displayTime), value: Number(value) })
  }

  return data
}

function generateMultiModeData(
  type: "cdf" | "pdf" | "hazard",
  failureModes: Array<{ name: string; shape: number; scale: number; color: string }>,
  showCombined: boolean,
  timeUnit: "hours" | "years" = "years",
) {
  if (failureModes.length === 0) return []

  const maxScale = Math.max(...failureModes.map((mode) => mode.scale))
  const maxTime = maxScale * 2
  const step = maxTime / 100

  const data = []

  for (let i = 0; i <= 100; i++) {
    const timeInHours = i * step

    if (timeInHours === 0 && (type === "pdf" || type === "hazard")) {
      continue
    }

    const displayTime = timeUnit === "years" ? convertToYears(timeInHours) : timeInHours
    const point: any = { time: displayTime }

    for (const mode of failureModes) {
      let value = 0

      switch (type) {
        case "cdf":
          value = 1 - Math.exp(-Math.pow(timeInHours / mode.scale, mode.shape))
          break
        case "pdf":
          value =
            (mode.shape / mode.scale) *
            Math.pow(timeInHours / mode.scale, mode.shape - 1) *
            Math.exp(-Math.pow(timeInHours / mode.scale, mode.shape))
          break
        case "hazard":
          value = (mode.shape / mode.scale) * Math.pow(timeInHours / mode.scale, mode.shape - 1)
          break
      }
      point[mode.name] = value
    }

    if (showCombined) {
      if (type === "cdf") {
        const systemReliability = failureModes.reduce((acc, mode) => {
          const componentReliability = Math.exp(-Math.pow(timeInHours / mode.scale, mode.shape))
          return acc * componentReliability
        }, 1)
        point.combined = 1 - systemReliability
      } else if (type === "pdf") {
        const systemReliability = failureModes.reduce((acc, mode) => {
          const componentReliability = Math.exp(-Math.pow(timeInHours / mode.scale, mode.shape))
          return acc * componentReliability
        }, 1)

        const dt = step / 10
        const timeNextHours = timeInHours + dt
        const systemReliabilityNext = failureModes.reduce((acc, mode) => {
          const componentReliability = Math.exp(-Math.pow(timeNextHours / mode.scale, mode.shape))
          return acc * componentReliability
        }, 1)

        point.combined = (systemReliability - systemReliabilityNext) / dt
      } else if (type === "hazard") {
        point.combined = failureModes.reduce((acc, mode) => {
          const hazardRate = (mode.shape / mode.scale) * Math.pow(timeInHours / mode.scale, mode.shape - 1)
          return acc + hazardRate
        }, 0)
      }
    }

    data.push(point)
  }

  return data
}

// Generate empirical CDF data points using Median Rank approximation
// F(i) = (i - 0.3) / (n + 0.4) (Bernard's approximation)
function generateEmpiricalCDF(
  rawDataPoints: RawDataPoint[],
  timeUnit: "hours" | "years"
): Array<{ time: number; empiricalCDF: number; censored: boolean }> {
  // Filter only failures for the empirical CDF (censored points don't have a failure rank)
  const failures = rawDataPoints
    .filter(p => !p.censored)
    .map(p => p.time)
    .sort((a, b) => a - b)
  
  if (failures.length === 0) return []
  
  const n = failures.length
  
  return failures.map((timeInHours, index) => {
    const rank = index + 1
    // Bernard's median rank approximation
    const empiricalCDF = (rank - 0.3) / (n + 0.4)
    const displayTime = timeUnit === "years" ? timeInHours / HOURS_IN_YEAR : timeInHours
    
    return {
      time: displayTime,
      empiricalCDF,
      censored: false
    }
  })
}
