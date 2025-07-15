/**
 * Performs Maximum Likelihood Estimation to fit a Weibull distribution
 * to failure data, including handling for right-censored data (assets still in service)
 */
export interface AssetData {
  id: string
  assetType: string
  installDate: Date
  retirementDate: Date | null
}

export interface WeibullParams {
  shape: number // β (beta) parameter
  scale: number // η (eta) parameter in hours
}

// Hours in a year (24 * 365 = 8760)
const HOURS_IN_YEAR = 8760

export function fitWeibullMLE(data: AssetData[]): WeibullParams {
  // Convert dates to operating hours
  const operatingHours = data.map((asset) => {
    const installDate = new Date(asset.installDate)
    const endDate = asset.retirementDate ? new Date(asset.retirementDate) : new Date()
    // Calculate difference in hours
    const diffTime = Math.abs(endDate.getTime() - installDate.getTime())
    const hours = Math.ceil(diffTime / (1000 * 60 * 60))
    return {
      hours,
      failed: asset.retirementDate !== null,
    }
  })

  // Initial parameter guesses
  let shape = 2.0 // Initial shape parameter guess
  let scale = 10000 // Initial scale parameter guess in hours

  // Maximum iterations for optimization
  const maxIterations = 100
  // Convergence tolerance
  const tolerance = 1e-6

  // Newton-Raphson method for MLE
  let iteration = 0
  let converged = false

  while (!converged && iteration < maxIterations) {
    // Calculate first and second derivatives of log-likelihood with respect to shape
    let firstDerivShape = 0
    let secondDerivShape = 0
    let sumLogT = 0
    let sumTPowBeta = 0
    let sumTPowBetaLogT = 0
    let sumLogTFailed = 0
    let r = 0 // Number of failures

    // Process each data point
    for (const item of operatingHours) {
      const t = item.hours
      const logT = Math.log(t)
      const tPowBeta = Math.pow(t / scale, shape)

      if (item.failed) {
        r++
        sumLogTFailed += logT
        firstDerivShape += logT
      }

      sumLogT += logT
      sumTPowBeta += tPowBeta
      sumTPowBetaLogT += tPowBeta * logT

      firstDerivShape -= (t / scale) ** shape * logT * (t / scale)
    }

    firstDerivShape += r / shape
    secondDerivShape = -r / (shape * shape)

    // Update shape parameter using Newton-Raphson
    const shapeNew = shape - firstDerivShape / secondDerivShape

    // Update scale parameter based on new shape
    const scaleNew = Math.pow(sumTPowBeta / r, 1 / shapeNew) * scale

    // Check for convergence
    const shapeChange = Math.abs((shapeNew - shape) / shape)
    const scaleChange = Math.abs((scaleNew - scale) / scale)

    converged = shapeChange < tolerance && scaleChange < tolerance

    // Update parameters for next iteration
    shape = shapeNew
    scale = scaleNew

    iteration++
  }

  // Ensure parameters are positive and reasonable
  shape = Math.max(0.1, Math.min(10, shape))
  scale = Math.max(100, Math.min(100000, scale))

  return { shape, scale }
}

/**
 * Estimates Weibull parameters from failure time data
 * This is a simplified version for the analyze page
 */
export function estimateWeibullParameters(failureTimes: number[]): WeibullParams {
  // Sort failure times
  const sortedTimes = [...failureTimes].sort((a, b) => a - b)

  // Use method of moments for initial estimates
  const n = sortedTimes.length
  const mean = sortedTimes.reduce((sum, t) => sum + t, 0) / n
  const variance = sortedTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / (n - 1)

  // Initial shape parameter estimate using coefficient of variation
  const cv = Math.sqrt(variance) / mean
  let shape = 1.2 / cv // Rough approximation

  // Initial scale parameter estimate
  let scale = mean / Math.exp(1) ** (1 / shape)

  // Refine estimates using maximum likelihood
  const maxIterations = 50
  const tolerance = 1e-6

  for (let iter = 0; iter < maxIterations; iter++) {
    // Calculate derivatives for Newton-Raphson
    let sumLogT = 0
    let sumTPowBeta = 0
    let sumTPowBetaLogT = 0

    for (const t of sortedTimes) {
      const logT = Math.log(t)
      const tPowBeta = Math.pow(t / scale, shape)

      sumLogT += logT
      sumTPowBeta += tPowBeta
      sumTPowBetaLogT += tPowBeta * logT
    }

    // Update shape parameter
    const firstDeriv = n / shape + sumLogT - sumTPowBetaLogT
    const secondDeriv = -n / (shape * shape)

    const newShape = shape - firstDeriv / secondDeriv

    // Update scale parameter
    const newScale = Math.pow(sumTPowBeta / n, 1 / newShape) * scale

    // Check convergence
    const shapeChange = Math.abs((newShape - shape) / shape)
    const scaleChange = Math.abs((newScale - scale) / scale)

    if (shapeChange < tolerance && scaleChange < tolerance) {
      break
    }

    shape = newShape
    scale = newScale
  }

  // Ensure reasonable bounds
  shape = Math.max(0.1, Math.min(10, shape))
  scale = Math.max(1, Math.min(1000000, scale))

  return { shape, scale }
}

/**
 * Calculates goodness of fit metrics for the Weibull distribution
 */
export function calculateGoodnessOfFit(
  data: AssetData[],
  params: WeibullParams,
): {
  r2: number
  aic: number
} {
  const { shape, scale } = params
  const n = data.length
  const failedCount = data.filter((d) => d.retirementDate !== null).length

  // Convert dates to operating hours
  const operatingHours = data.map((asset) => {
    const installDate = new Date(asset.installDate)
    const endDate = asset.retirementDate ? new Date(asset.retirementDate) : new Date()
    const diffTime = Math.abs(endDate.getTime() - installDate.getTime())
    const hours = Math.ceil(diffTime / (1000 * 60 * 60))
    return {
      hours,
      failed: asset.retirementDate !== null,
    }
  })

  // Calculate log-likelihood
  let logLikelihood = 0

  for (const item of operatingHours) {
    const t = item.hours
    if (item.failed) {
      // Contribution of failure data to log-likelihood
      logLikelihood += Math.log(shape / scale) + (shape - 1) * Math.log(t / scale) - Math.pow(t / scale, shape)
    } else {
      // Contribution of censored data to log-likelihood
      logLikelihood += -Math.pow(t / scale, shape)
    }
  }

  // Calculate AIC (Akaike Information Criterion)
  const aic = -2 * logLikelihood + 4 // 2 parameters (shape and scale)

  // Calculate R-squared (approximation for Weibull fit)
  // This is a pseudo-R² based on comparing to a null model
  const meanLogTime = operatingHours.reduce((sum, item) => sum + Math.log(item.hours), 0) / n

  let nullLogLikelihood = 0
  for (const item of operatingHours) {
    if (item.failed) {
      nullLogLikelihood += Math.log(1 / Math.exp(meanLogTime))
    }
  }

  const r2 = 1 - logLikelihood / nullLogLikelihood

  return { r2, aic }
}
