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

// Legacy function for backward compatibility with existing analyze page
export function estimateWeibullParameters(failureTimes: number[]): { shape: number; scale: number } {
  // Convert failure times to asset data format
  const assetData: AssetData[] = failureTimes.map((time, index) => ({
    id: `ASSET_${index + 1}`,
    assetType: "Unknown",
    installDate: new Date(Date.now() - time * 60 * 60 * 1000), // Approximate install date
    retirementDate: new Date(), // All are failed
  }))

  const params = fitWeibullMLE(assetData)
  return {
    shape: params.shape,
    scale: params.scale,
  }
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
