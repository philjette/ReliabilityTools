// Maximum Likelihood Estimation for Weibull Distribution
export interface WeibullParameters {
  shape: number // β (beta)
  scale: number // η (eta)
  reliability?: number
  meanTime?: number
}

export function estimateWeibullParameters(failureTimes: number[]): WeibullParameters {
  if (failureTimes.length < 2) {
    throw new Error("Need at least 2 failure times for parameter estimation")
  }

  // Sort failure times
  const sortedTimes = [...failureTimes].sort((a, b) => a - b)

  // Initial guess for shape parameter
  let beta = 2.0
  const tolerance = 1e-6
  const maxIterations = 100

  // Newton-Raphson iteration for MLE
  for (let i = 0; i < maxIterations; i++) {
    const n = sortedTimes.length
    const sumLogT = sortedTimes.reduce((sum, t) => sum + Math.log(t), 0)
    const sumTBeta = sortedTimes.reduce((sum, t) => sum + Math.pow(t, beta), 0)
    const sumTBetaLogT = sortedTimes.reduce((sum, t) => sum + Math.pow(t, beta) * Math.log(t), 0)

    // First derivative
    const f1 = 1 / beta + sumLogT / n - sumTBetaLogT / sumTBeta

    // Second derivative
    const f2 =
      -1 / (beta * beta) -
      (sumTBetaLogT * sumTBetaLogT) / (sumTBeta * sumTBeta) +
      sortedTimes.reduce((sum, t) => sum + Math.pow(t, beta) * Math.log(t) * Math.log(t), 0) / sumTBeta

    const betaNew = beta - f1 / f2

    if (Math.abs(betaNew - beta) < tolerance) {
      beta = betaNew
      break
    }

    beta = betaNew

    // Ensure beta stays positive
    if (beta <= 0) {
      beta = 0.5
    }
  }

  // Calculate scale parameter (eta)
  const sumTBeta = sortedTimes.reduce((sum, t) => sum + Math.pow(t, beta), 0)
  const eta = Math.pow(sumTBeta / sortedTimes.length, 1 / beta)

  // Calculate additional statistics
  const meanTime = eta * gamma(1 + 1 / beta)

  return {
    shape: beta,
    scale: eta,
    meanTime: meanTime,
    reliability: Math.exp(-Math.pow(meanTime / eta, beta)),
  }
}

export function fitWeibullMLE(data: number[]): WeibullParameters {
  return estimateWeibullParameters(data)
}

export function weibullReliability(t: number, shape: number, scale: number): number {
  return Math.exp(-Math.pow(t / scale, shape))
}

export function weibullHazardRate(t: number, shape: number, scale: number): number {
  return (shape / scale) * Math.pow(t / scale, shape - 1)
}

export function weibullPDF(t: number, shape: number, scale: number): number {
  return (shape / scale) * Math.pow(t / scale, shape - 1) * Math.exp(-Math.pow(t / scale, shape))
}

// Gamma function approximation (Stirling's approximation for simplicity)
function gamma(z: number): number {
  if (z === 1) return 1
  if (z === 0.5) return Math.sqrt(Math.PI)

  // For other values, use Stirling's approximation
  if (z > 1) {
    return Math.sqrt((2 * Math.PI) / z) * Math.pow(z / Math.E, z)
  }

  // For z < 1, use the recurrence relation Γ(z) = Γ(z+1)/z
  return gamma(z + 1) / z
}

export function calculateWeibullStatistics(shape: number, scale: number) {
  const mean = scale * gamma(1 + 1 / shape)
  const variance = scale * scale * (gamma(1 + 2 / shape) - Math.pow(gamma(1 + 1 / shape), 2))
  const mode = shape > 1 ? scale * Math.pow((shape - 1) / shape, 1 / shape) : 0

  return {
    mean,
    variance,
    standardDeviation: Math.sqrt(variance),
    mode,
  }
}
