"use client"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

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
}

// Hours in a year (24 * 365 = 8760)
const HOURS_IN_YEAR = 8760

// Helper function to generate exact tick positions based on scale parameter
function generateTicks(scale: number, maxTime: number) {
  const scaleInYears = scale / HOURS_IN_YEAR
  const ticks = []

  let step: number
  if (scaleInYears < 10) {
    step = 1 // Every 1 year
  } else if (scaleInYears >= 10 && scaleInYears < 30) {
    step = 5 // Every 5 years
  } else {
    step = 10 // Every 10 years
  }

  // Generate ticks from 0 to maxTime with the determined step
  for (let i = 0; i <= Math.ceil(maxTime / step) * step; i += step) {
    if (i <= maxTime) {
      ticks.push(i)
    }
  }

  return ticks
}

export function WeibullChart({ type, shape, scale, failureModes = [], showCombined = false }: WeibullChartProps) {
  // Generate data points for the Weibull distribution
  const singleModeData = generateWeibullData(type, shape, scale)

  // Generate data for multiple failure modes if provided
  const multiModeData = generateMultiModeData(type, failureModes, showCombined)

  // Determine which data to use
  const data = failureModes.length > 0 ? multiModeData : singleModeData

  // Determine y-axis label based on chart type
  const yAxisLabel = type === "cdf" ? "Probability" : type === "pdf" ? "Density" : "Hazard Rate"

  // If we're showing multiple failure modes, use a LineChart
  if (failureModes.length > 0) {
    return (
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{ value: "Time (years)", position: "insideBottomRight", offset: -10 }}
              tickMargin={10}
            />
            <YAxis
              label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: -5 }}
              domain={type === "cdf" ? [0, 1] : [0, "auto"]}
              tickMargin={10}
            />
            <Tooltip
              formatter={(value: number, name: string) => [value.toFixed(4), name]}
              labelFormatter={(label) => `Time: ${label} years`}
            />
            <Legend wrapperStyle={{ paddingTop: 10 }} />

            {/* Render lines for each failure mode */}
            {!showCombined &&
              failureModes.map((mode, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={mode.name}
                  name={mode.name}
                  stroke={mode.color}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}

            {/* Render combined line if showCombined is true */}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // For single failure mode, use AreaChart (original implementation)
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            label={{ value: "Time (years)", position: "insideBottomRight", offset: -10 }}
            tickMargin={10}
            tickFormatter={(value) => Math.round(value).toString()}
            ticks={generateTicks(scale, (scale * 2) / HOURS_IN_YEAR)}
            domain={["dataMin", "dataMax"]}
            type="number"
            scale="linear"
          />
          <YAxis
            label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: -5 }}
            domain={type === "cdf" ? [0, 1] : [0, "auto"]}
            tickMargin={10}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(4), yAxisLabel]}
            labelFormatter={(label) => `Time: ${label} years`}
          />
          <Area type="monotone" dataKey="value" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Generate data points for different Weibull distribution functions
function generateWeibullData(type: "cdf" | "pdf" | "hazard", shape: number, scale: number) {
  const data = []
  // Convert scale from hours to years for calculation
  const scaleInHours = scale
  // But we'll display in years, so max time is 2x scale in years
  const maxTime = (scaleInHours * 2) / HOURS_IN_YEAR
  const step = maxTime / 100 // 100 data points

  for (let i = 0; i <= 100; i++) {
    const timeInYears = i * step
    // Convert back to hours for the calculation
    const timeInHours = timeInYears * HOURS_IN_YEAR

    if (timeInHours === 0 && (type === "pdf" || type === "hazard")) {
      // Skip t=0 for PDF and hazard function to avoid division by zero
      continue
    }

    let value = 0
    switch (type) {
      case "cdf":
        // Cumulative Distribution Function: F(t) = 1 - exp(-(t/η)^β)
        value = 1 - Math.exp(-Math.pow(timeInHours / scaleInHours, shape))
        break
      case "pdf":
        // Probability Density Function: f(t) = (β/η)(t/η)^(β-1)exp(-(t/η)^β)
        value =
          (shape / scaleInHours) *
          Math.pow(timeInHours / scaleInHours, shape - 1) *
          Math.exp(-Math.pow(timeInHours / scaleInHours, shape))
        // Scale the PDF value to account for the change in time units
        value = value * HOURS_IN_YEAR
        break
      case "hazard":
        // Hazard Function: h(t) = (β/η)(t/η)^(β-1)
        value = (shape / scaleInHours) * Math.pow(timeInHours / scaleInHours, shape - 1)
        // Scale the hazard rate to account for the change in time units
        value = value * HOURS_IN_YEAR
        break
    }

    data.push({ time: timeInYears, value })
  }

  return data
}

// Generate data for multiple failure modes
function generateMultiModeData(
  type: "cdf" | "pdf" | "hazard",
  failureModes: Array<{ name: string; shape: number; scale: number; color: string }>,
  showCombined: boolean,
) {
  if (failureModes.length === 0) return []

  // Find the maximum scale to determine the time range
  const maxScale = Math.max(...failureModes.map((mode) => mode.scale))
  // Convert max scale from hours to years
  const maxTime = (maxScale * 2) / HOURS_IN_YEAR
  const step = maxTime / 100

  const data = []

  for (let i = 0; i <= 100; i++) {
    const timeInYears = i * step
    // Convert to hours for calculation
    const timeInHours = timeInYears * HOURS_IN_YEAR

    if (timeInHours === 0 && (type === "pdf" || type === "hazard")) {
      continue
    }

    const point: any = { time: timeInYears }

    // Calculate values for each failure mode
    for (const mode of failureModes) {
      let value = 0
      const scaleInHours = mode.scale

      switch (type) {
        case "cdf":
          value = 1 - Math.exp(-Math.pow(timeInHours / scaleInHours, mode.shape))
          break
        case "pdf":
          value =
            (mode.shape / scaleInHours) *
            Math.pow(timeInHours / scaleInHours, mode.shape - 1) *
            Math.exp(-Math.pow(timeInHours / scaleInHours, mode.shape))
          // Scale the PDF value
          value = value * HOURS_IN_YEAR
          break
        case "hazard":
          value = (mode.shape / scaleInHours) * Math.pow(timeInHours / mode.scale, mode.shape - 1)
          // Scale the hazard rate
          value = value * HOURS_IN_YEAR
          break
      }
      point[mode.name] = value
    }

    // Calculate combined system value if requested
    if (showCombined) {
      if (type === "cdf") {
        // For CDF, the combined system failure probability is 1 - product of individual reliabilities
        // System reliability = product of component reliabilities
        // System failure probability = 1 - system reliability
        const systemReliability = failureModes.reduce((acc, mode) => {
          const componentReliability = Math.exp(-Math.pow(timeInHours / mode.scale, mode.shape))
          return acc * componentReliability
        }, 1)
        point.combined = 1 - systemReliability
      } else if (type === "pdf") {
        // For PDF, we need to calculate the derivative of the CDF
        // This is a simplification - in a real application, you might want to use a more accurate method
        const systemReliability = failureModes.reduce((acc, mode) => {
          const componentReliability = Math.exp(-Math.pow(timeInHours / mode.scale, mode.shape))
          return acc * componentReliability
        }, 1)

        // Calculate reliability at t+dt
        const dt = (step * HOURS_IN_YEAR) / 10
        const timeNextHours = timeInHours + dt
        const systemReliabilityNext = failureModes.reduce((acc, mode) => {
          const componentReliability = Math.exp(-Math.pow(timeNextHours / mode.scale, mode.shape))
          return acc * componentReliability
        }, 1)

        // Approximate derivative
        point.combined = ((systemReliability - systemReliabilityNext) / dt) * HOURS_IN_YEAR
      } else if (type === "hazard") {
        // For hazard rate, it's the sum of individual hazard rates in a series system
        point.combined =
          failureModes.reduce((acc, mode) => {
            const hazardRate = (mode.shape / mode.scale) * Math.pow(timeInHours / mode.scale, mode.shape - 1)
            return acc + hazardRate
          }, 0) * HOURS_IN_YEAR
      }
    }

    data.push(point)
  }

  return data
}
