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
  timeUnit?: "hours" | "years"
}

const HOURS_IN_YEAR = 8760

function convertToYears(hours: number): number {
  return hours / HOURS_IN_YEAR
}

function generateTicks(scale: number, maxTime: number, timeUnit: "hours" | "years" = "hours") {
  const ticks = []

  let step: number
  if (timeUnit === "years") {
    const scaleInYears = scale / HOURS_IN_YEAR
    const maxTimeInYears = maxTime / HOURS_IN_YEAR

    if (scaleInYears < 10) {
      step = 1
    } else if (scaleInYears >= 10 && scaleInYears < 30) {
      step = 5
    } else {
      step = 10
    }

    for (let i = 0; i <= Math.ceil(maxTimeInYears / step) * step; i += step) {
      if (i <= maxTimeInYears) {
        ticks.push(i)
      }
    }
  } else {
    if (scale < 87600) {
      step = 8760
    } else if (scale >= 87600 && scale < 262800) {
      step = 43800
    } else {
      step = 87600
    }

    for (let i = 0; i <= Math.ceil(maxTime / step) * step; i += step) {
      if (i <= maxTime) {
        ticks.push(i)
      }
    }
  }

  return ticks
}

export function WeibullChart({
  type,
  shape,
  scale,
  failureModes = [],
  showCombined = false,
  timeUnit = "hours",
}: WeibullChartProps) {
  const singleModeData = generateWeibullData(type, shape, scale, timeUnit)
  const multiModeData = generateMultiModeData(type, failureModes, showCombined, timeUnit)

  const data = failureModes.length > 0 ? multiModeData : singleModeData
  
  // Debug logging
  console.log("WeibullChart Debug:", {
    type,
    shape,
    scale,
    timeUnit,
    dataLength: data.length,
    firstDataPoint: data[0],
    lastDataPoint: data[data.length - 1],
    sampleData: data.slice(0, 5)
  })

  const yAxisLabel = type === "cdf" ? "Cumulative Probability" : type === "pdf" ? "Probability Density" : "Hazard Rate"
  const xAxisLabel = timeUnit === "years" ? "Time (years)" : "Time (hours)"

  const maxScale = failureModes.length > 0 ? Math.max(...failureModes.map((mode) => mode.scale)) : scale
  const maxTime = maxScale * 2

  if (failureModes.length > 0) {
    return (
      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{ value: xAxisLabel, position: "insideBottomRight", offset: -10 }}
              tickMargin={10}
              tickFormatter={(value) => value.toFixed(1)}
              ticks={generateTicks(maxScale, maxTime, timeUnit)}
              domain={["dataMin", "dataMax"]}
              type="number"
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
          </LineChart>
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
            label={{ value: xAxisLabel, position: "insideBottomRight", offset: -10 }}
            tickMargin={10}
            tickFormatter={(value) => (timeUnit === "years" ? value.toFixed(1) : Math.round(value).toString())}
            ticks={generateTicks(scale, maxTime, timeUnit)}
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
            labelFormatter={(label) => `Time: ${Number(label).toFixed(2)} ${timeUnit}`}
          />
          <Area type="monotone" dataKey="value" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function generateWeibullData(
  type: "cdf" | "pdf" | "hazard",
  shape: number,
  scale: number,
  timeUnit: "hours" | "years" = "hours",
) {
  const data = []
  const maxTime = scale * 2
  const step = maxTime / 100

  console.log("generateWeibullData Debug:", {
    type,
    shape,
    scale,
    timeUnit,
    maxTime,
    step
  })

  for (let i = 0; i <= 100; i++) {
    const timeInHours = i * step

    if (timeInHours === 0 && (type === "pdf" || type === "hazard")) {
      continue
    }

    let value = 0
    switch (type) {
      case "cdf":
        value = 1 - Math.exp(-Math.pow(timeInHours / scale, shape))
        break
      case "pdf":
        value =
          (shape / scale) * Math.pow(timeInHours / scale, shape - 1) * Math.exp(-Math.pow(timeInHours / scale, shape))
        break
      case "hazard":
        value = (shape / scale) * Math.pow(timeInHours / scale, shape - 1)
        break
    }

    const displayTime = timeUnit === "years" ? convertToYears(timeInHours) : timeInHours
    data.push({ time: displayTime, value })
  }

  console.log("Generated data sample:", data.slice(0, 5))
  return data
}

function generateMultiModeData(
  type: "cdf" | "pdf" | "hazard",
  failureModes: Array<{ name: string; shape: number; scale: number; color: string }>,
  showCombined: boolean,
  timeUnit: "hours" | "years" = "hours",
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
