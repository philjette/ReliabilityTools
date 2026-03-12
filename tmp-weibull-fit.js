// Quick Node script to run the same Weibull MLE (with censoring) on a CSV file
// Usage: node tmp-weibull-fit.js /absolute/path/to/file.csv

const fs = require("fs")

if (require.main === module) {
  const file = process.argv[2]
  if (!file) {
    console.error("Usage: node tmp-weibull-fit.js /path/to/file.csv")
    process.exit(1)
  }
  const csv = fs.readFileSync(file, "utf8")
  const { failureTimesDays, censoredTimesDays, failureTimesHours, nFailures } = parseCsvToEvents(csv)
  console.log("failures:", nFailures, "censored:", censoredTimesDays.length)

  const hoursPerDay = 24
  const empiricalMttfHours = failureTimesHours.reduce((s, t) => s + t, 0) / nFailures

  const completeParams = calculateWeibullMLE(failureTimesDays)
  const completeOnly = {
    shape: completeParams.shape,
    scale_days: completeParams.scale,
    scale_hours: completeParams.scale * hoursPerDay,
  }

  let withCensored = null
  if (censoredTimesDays.length > 0) {
    const censoredParams = calculateWeibullCensoredMLE(failureTimesDays, censoredTimesDays)
    withCensored = {
      shape: censoredParams.shape,
      scale_days: censoredParams.scale,
      scale_hours: censoredParams.scale * hoursPerDay,
    }
  }

  console.log("Complete-only fit:", completeOnly)
  if (withCensored) console.log("With-censored fit (match Python):", withCensored)
  console.log("Empirical MTTF (hours):", empiricalMttfHours, "years:", (empiricalMttfHours / 8760).toFixed(2))
}

function parseCsvToEvents(csv) {
  const lines = csv.trim().split("\n")
  const msPerHour = 1000 * 60 * 60
  const hoursPerDay = 24
  const failureDates = []
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const [assetId, installDate, failureDateRaw] = line.split(",")
    const failureDate =
      failureDateRaw && failureDateRaw.trim() !== "" && failureDateRaw.trim().toLowerCase() !== "null"
        ? failureDateRaw.trim()
        : null
    const installMs = new Date(installDate).getTime()
    if (Number.isNaN(installMs)) continue
    if (failureDate) failureDates.push(new Date(failureDate).getTime())
    rows.push({ installMs, failureDate })
  }
  const censorDateMs = failureDates.length > 0 ? Math.max(...failureDates) : Date.now()
  const data = rows.map(({ installMs, failureDate }) => {
    const isCensored = !failureDate
    const endMs = failureDate ? new Date(failureDate).getTime() : censorDateMs
    const hours = Math.max((endMs - installMs) / msPerHour, 1e-6)
    return { hours, days: hours / hoursPerDay, censored: isCensored }
  })
  const failureTimesHours = data.filter((e) => !e.censored).map((e) => e.hours)
  const failureTimesDays = data.filter((e) => !e.censored).map((e) => e.days)
  const censoredTimesDays = data.filter((e) => e.censored).map((e) => e.days)
  return {
    failureTimesDays,
    censoredTimesDays,
    failureTimesHours,
    nFailures: failureTimesHours.length,
  }
}

// Gamma and Weibull helpers (same as lib/gamma.ts)
function gamma(z) {
  if (z === 0.5) return Math.sqrt(Math.PI)
  if (z === 1 || z === 2) return 1
  if (Number.isInteger(z) && z > 0) {
    let result = 1
    for (let i = 2; i < z; i++) result *= i
    return result
  }
  const g = 7
  const coef = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ]
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z))
  }
  z -= 1
  let x = coef[0]
  for (let i = 1; i < g + 2; i++) {
    x += coef[i] / (z + i)
  }
  const t = z + g + 0.5
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x
}

function weibullMTTF(shape, scale) {
  return scale * gamma(1 + 1 / shape)
}

function calculateWeibullMLE(failureTimes) {
  const n = failureTimes.length
  const sortedTimes = [...failureTimes].sort((a, b) => a - b)
  let shape = 1.5
  let scale =
    Math.pow(sortedTimes.reduce((sum, t) => sum + Math.pow(t, shape), 0) / n, 1 / shape) || 1
  const maxIterations = 100
  const tolerance = 1e-6
  for (let iter = 0; iter < maxIterations; iter++) {
    const sum1 = sortedTimes.reduce((sum, t) => sum + Math.log(t), 0)
    const sum2 = sortedTimes.reduce((sum, t) => sum + Math.pow(t, shape), 0)
    const sum3 = sortedTimes.reduce((sum, t) => sum + Math.pow(t, shape) * Math.log(t), 0)
    const f = n / shape + sum1 - n * Math.log(scale) - sum3 / sum2
    const fPrime = -n / (shape * shape) - sum3 / sum2 + Math.pow(sum3, 2) / Math.pow(sum2, 2)
    if (Math.abs(f) < tolerance) break
    const newShape = shape - f / fPrime
    if (newShape <= 0) break
    shape = newShape
    scale = Math.pow(sum2 / n, 1 / shape)
  }
  return { shape, scale }
}

function calculateWeibullCensoredMLE(failureTimes, censoredTimes) {
  const r = failureTimes.length
  const allTimes = [...failureTimes, ...censoredTimes]
  if (r < 1) throw new Error("Need at least one failure for censored MLE")
  const sumLogFailures = failureTimes.reduce((s, t) => s + Math.log(t), 0)
  const betaMin = 0.05
  const betaMax = 20
  const steps = 80
  function logLikelihood(beta) {
    if (!Number.isFinite(beta) || beta <= 0) return -Infinity
    const tBeta = allTimes.map((t) => Math.pow(t, beta))
    const S = tBeta.reduce((a, b) => a + b, 0)
    if (!Number.isFinite(S) || S <= 0) return -Infinity
    const eta = Math.pow((beta * S) / r, 1 / beta)
    const sumOverEtaBeta = S / Math.pow(eta, beta)
    return r * Math.log(beta) - r * beta * Math.log(eta) + (beta - 1) * sumLogFailures - sumOverEtaBeta
  }
  let bestBeta = 1
  let bestLL = -Infinity
  for (let i = 0; i <= steps; i++) {
    const beta = betaMin + (i * (betaMax - betaMin)) / steps
    const ll = logLikelihood(beta)
    if (ll > bestLL) {
      bestLL = ll
      bestBeta = beta
    }
  }
  const halfWidth = (betaMax - betaMin) / steps
  const refineMin = Math.max(betaMin, bestBeta - halfWidth)
  const refineMax = Math.min(betaMax, bestBeta + halfWidth)
  for (let i = 0; i <= 100; i++) {
    const beta = refineMin + (i * (refineMax - refineMin)) / 100
    const ll = logLikelihood(beta)
    if (ll > bestLL) {
      bestLL = ll
      bestBeta = beta
    }
  }
  const tBeta = allTimes.map((t) => Math.pow(t, bestBeta))
  const S = tBeta.reduce((a, b) => a + b, 0)
  const scale = Math.pow((bestBeta * S) / r, 1 / bestBeta)
  return { shape: bestBeta, scale }
}

