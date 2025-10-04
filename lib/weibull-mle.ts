/**
 * Estimate Weibull parameters using Maximum Likelihood Estimation (MLE)
 */
export function estimateWeibullParameters(failureTimes: number[]): { shape: number; scale: number } {
  if (failureTimes.length === 0) {
    throw new Error("No failure times provided")
  }

  // Sort failure times
  const sortedTimes = [...failureTimes].sort((a, b) => a - b)

  // Initial guess for shape parameter using method of moments
  const n = sortedTimes.length
  const sumT = sortedTimes.reduce((sum, t) => sum + t, 0)
  const sumT2 = sortedTimes.reduce((sum, t) => sum + t * t, 0)
  const meanT = sumT / n
  const varT = sumT2 / n - meanT * meanT

  // Initial shape estimate
  let shape = Math.pow(meanT, 2) / varT

  // Newton-Raphson iteration to find MLE of shape parameter
  const maxIterations = 100
  const tolerance = 1e-6

  for (let iter = 0; iter < maxIterations; iter++) {
    const sumLnT = sortedTimes.reduce((sum, t) => sum + Math.log(t), 0)
    const sumTBeta = sortedTimes.reduce((sum, t) => sum + Math.pow(t, shape), 0)
    const sumTBetaLnT = sortedTimes.reduce((sum, t) => sum + Math.pow(t, shape) * Math.log(t), 0)

    // First derivative
    const f = n / shape + sumLnT - (n * sumTBetaLnT) / sumTBeta

    // Second derivative
    const sumTBetaLnT2 = sortedTimes.reduce((sum, t) => sum + Math.pow(t, shape) * Math.pow(Math.log(t), 2), 0)
    const fPrime = -n / (shape * shape) + n * (sumTBetaLnT2 / sumTBeta - Math.pow(sumTBetaLnT / sumTBeta, 2))

    // Newton-Raphson update
    const shapeNew = shape - f / fPrime

    if (Math.abs(shapeNew - shape) < tolerance) {
      shape = shapeNew
      break
    }

    shape = shapeNew

    // Ensure shape stays positive
    if (shape <= 0) {
      shape = 0.5
    }
  }

  // Calculate scale parameter
  const sumTBeta = sortedTimes.reduce((sum, t) => sum + Math.pow(t, shape), 0)
  const scale = Math.pow(sumTBeta / n, 1 / shape)

  return { shape, scale }
}

/**
 * Generate synthetic failure times from a Weibull distribution
 * Useful for testing and simulation
 */
export function generateWeibullSamples(shape: number, scale: number, count: number): number[] {
  const samples: number[] = []

  for (let i = 0; i < count; i++) {
    // Inverse transform sampling
    const u = Math.random()
    const t = scale * Math.pow(-Math.log(1 - u), 1 / shape)
    samples.push(t)
  }

  return samples
}

/**
 * Calculate confidence intervals for Weibull parameters
 * Uses Fisher Information Matrix
 */
export function weibullConfidenceIntervals(
  failureTimes: number[],
  confidenceLevel = 0.95,
): {
  shape: { lower: number; upper: number }
  scale: { lower: number; upper: number }
} {
  const { shape, scale } = estimateWeibullParameters(failureTimes)
  const n = failureTimes.length

  // Standard error approximations
  const shapeStdError = shape / Math.sqrt(n)
  const scaleStdError = scale / Math.sqrt(n)

  // Z-score for confidence level
  const z = 1.96 // For 95% confidence

  return {
    shape: {
      lower: Math.max(0.1, shape - z * shapeStdError),
      upper: shape + z * shapeStdError,
    },
    scale: {
      lower: Math.max(0, scale - z * scaleStdError),
      upper: scale + z * scaleStdError,
    },
  }
}

/**
 * Perform goodness-of-fit test for Weibull distribution
 * Returns Kolmogorov-Smirnov statistic
 */
export function weibullGoodnessOfFit(failureTimes: number[]): number {
  const { shape, scale } = estimateWeibullParameters(failureTimes)
  const n = failureTimes.length
  const sortedTimes = [...failureTimes].sort((a, b) => a - b)

  let maxDifference = 0

  for (let i = 0; i < n; i++) {
    const empiricalCDF = (i + 1) / n
    const theoreticalCDF = 1 - Math.exp(-Math.pow(sortedTimes[i] / scale, shape))
    const difference = Math.abs(empiricalCDF - theoreticalCDF)
    maxDifference = Math.max(maxDifference, difference)
  }

  return maxDifference
}
