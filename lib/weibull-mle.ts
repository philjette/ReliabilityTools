import { gamma } from "./gamma"

export interface WeibullParameters {
  shape: number
  scale: number
}

/**
 * Estimates Weibull parameters using Maximum Likelihood Estimation
 */
export function estimateWeibullParameters(failureTimes: number[]): WeibullParameters {
  if (!failureTimes || failureTimes.length === 0) {
    throw new Error("Failure times array cannot be empty")
  }

  // Sort failure times
  const sortedTimes = [...failureTimes].sort((a, b) => a - b)
  const n = sortedTimes.length

  // Initial guess for shape parameter (beta)
  let beta = 1.0

  // Newton-Raphson iteration for MLE
  const maxIterations = 100
  const tolerance = 1e-6

  for (let iter = 0; iter < maxIterations; iter++) {
    const sumLogT = sortedTimes.reduce((sum, t) => sum + Math.log(t), 0)
    const sumTBeta = sortedTimes.reduce((sum, t) => sum + Math.pow(t, beta), 0)
    const sumTBetaLogT = sortedTimes.reduce((sum, t) => sum + Math.pow(t, beta) * Math.log(t), 0)

    const f = sumLogT / n + 1 / beta - sumTBetaLogT / sumTBeta
    const fPrime = -1 / (beta * beta) - (sumTBetaLogT * sumTBetaLogT) / (sumTBeta * sumTBeta)

    const betaNew = beta - f / fPrime

    if (Math.abs(betaNew - beta) < tolerance) {
      beta = betaNew
      break
    }

    beta = betaNew
  }

  // Calculate scale parameter (eta)
  const sumTBeta = sortedTimes.reduce((sum, t) => sum + Math.pow(t, beta), 0)
  const eta = Math.pow(sumTBeta / n, 1 / beta)

  return {
    shape: beta,
    scale: eta,
  }
}

/**
 * Calculate Weibull reliability function R(t)
 */
export function weibullReliability(t: number, shape: number, scale: number): number {
  return Math.exp(-Math.pow(t / scale, shape))
}

/**
 * Calculate Weibull failure rate (hazard function) h(t)
 */
export function weibullFailureRate(t: number, shape: number, scale: number): number {
  return (shape / scale) * Math.pow(t / scale, shape - 1)
}

/**
 * Calculate Weibull probability density function f(t)
 */
export function weibullPDF(t: number, shape: number, scale: number): number {
  return (shape / scale) * Math.pow(t / scale, shape - 1) * Math.exp(-Math.pow(t / scale, shape))
}

/**
 * Calculate Weibull cumulative distribution function F(t)
 */
export function weibullCDF(t: number, shape: number, scale: number): number {
  return 1 - Math.exp(-Math.pow(t / scale, shape))
}

/**
 * Calculate Mean Time To Failure
 */
export function calculateMTTF(shape: number, scale: number): number {
  return scale * gamma(1 + 1 / shape)
}
