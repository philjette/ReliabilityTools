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

export function WeibullChart({ type, shape, scale, failureModes = [], showCombined = false }: WeibullChartProps) {
  // Generate data points for the Weibull distribution
  const singleModeData = generateWeibullData(type, shape, scale)

  // Generate data for multiple failure modes if provided
  const multiModeData = generateMultiModeData(type, failureModes, showCombined)

  // Determine which data to use
  const data = failureModes.length > 0 ? multiModeData : singleModeData

  // Determine y-axis label based on chart type
  const yAxisLabel = type === "cdf" ? "Probability" : type === "pdf" ? "Density" : "Hazard Rate"

  // Calculate x-axis ticks (in years)
  // For multi-mode, use the largest scale; for single, use the given scale
  const maxScale = failureModes.length > 0
    ? Math.max(...failureModes.map((mode) => mode.scale))
    : scale
  const maxTime = maxScale * 2 // scale is already in years

  let ticks: number[];
  if (maxTime < 20) {
    // Tick at each integer value from 0 to Math.ceil(maxTime)
    ticks = Array.from({ length: Math.ceil(maxTime) + 1 }, (_, i) => i);
  } else {
    // Tick at every multiple of 5 from 0 up to the next multiple of 5 >= maxTime
    const lastTick = Math.ceil(maxTime / 5) * 5;
    ticks = [];
    for (let t = 0; t <= lastTick; t += 5) {
      ticks.push(t);
    }
  }

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
              ticks={ticks}
              tickFormatter={(value) => maxTime < 2 ? value.toFixed(1) : Math.round(value).toString()}
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
            ticks={ticks}
            tickFormatter={(value) => maxTime < 2 ? value.toFixed(1) : Math.round(value).toString()}
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
  // scale is in years, so all calculations are in years
  const maxTime = scale * 2
  const step = maxTime / 100 // 100 data points

  for (let i = 0; i <= 100; i++) {
    const time = i * step

    if (time === 0 && (type === "pdf" || type === "hazard")) {
      // Skip t=0 for PDF and hazard function to avoid division by zero
      continue
    }

    let value = 0
    switch (type) {
      case "cdf":
        // Cumulative Distribution Function: F(t) = 1 - exp(-(t/η)^β)
        value = 1 - Math.exp(-Math.pow(time / scale, shape))
        break
      case "pdf":
        // Probability Density Function: f(t) = (β/η)(t/η)^(β-1)exp(-(t/η)^β)
        value =
          (shape / scale) *
          Math.pow(time / scale, shape - 1) *
          Math.exp(-Math.pow(time / scale, shape))
        break
      case "hazard":
        // Hazard Function: h(t) = (β/η)(t/η)^(β-1)
        value = (shape / scale) * Math.pow(time / scale, shape - 1)
        break
    }

    data.push({ time, value })
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
  // scale is in years
  const maxTime = maxScale * 2
  const step = maxTime / 100

  const data = []

  for (let i = 0; i <= 100; i++) {
    const time = i * step

    if (time === 0 && (type === "pdf" || type === "hazard")) {
      continue
    }

    const point: any = { time }

    // Calculate values for each failure mode
    for (const mode of failureModes) {
      let value = 0
      const scale = mode.scale

      switch (type) {
        case "cdf":
          value = 1 - Math.exp(-Math.pow(time / scale, mode.shape))
          break
        case "pdf":
          value =
            (mode.shape / scale) *
            Math.pow(time / scale, mode.shape - 1) *
            Math.exp(-Math.pow(time / scale, mode.shape))
          break
        case "hazard":
          value = (mode.shape / scale) * Math.pow(time / scale, mode.shape - 1)
          break
      }
      point[mode.name] = value
    }

    // Calculate combined system value if requested
    if (showCombined) {
      if (type === "cdf") {
        // For CDF, the combined system failure probability is 1 - product of individual reliabilities
        const systemReliability = failureModes.reduce((acc, mode) => {
          const componentReliability = Math.exp(-Math.pow(time / mode.scale, mode.shape))
          return acc * componentReliability
        }, 1)
        point.combined = 1 - systemReliability
      } else if (type === "pdf") {
        // For PDF, approximate derivative of the CDF
        const systemReliability = failureModes.reduce((acc, mode) => {
          const componentReliability = Math.exp(-Math.pow(time / mode.scale, mode.shape))
          return acc * componentReliability
        }, 1)

        // Calculate reliability at t+dt
        const dt = step / 10
        const timeNext = time + dt
        const systemReliabilityNext = failureModes.reduce((acc, mode) => {
          const componentReliability = Math.exp(-Math.pow(timeNext / mode.scale, mode.shape))
          return acc * componentReliability
        }, 1)

        // Approximate derivative
        point.combined = ((systemReliability - systemReliabilityNext) / dt)
      } else if (type === "hazard") {
        // For hazard rate, it's the sum of individual hazard rates in a series system
        point.combined =
          failureModes.reduce((acc, mode) => {
            const hazardRate = (mode.shape / mode.scale) * Math.pow(time / mode.scale, mode.shape - 1)
            return acc + hazardRate
          }, 0)
      }
    }

    data.push(point)
  }

  return data
}
