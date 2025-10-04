/**
 * Gamma function implementation using Lanczos approximation
 * More accurate than Stirling's approximation for our use case
 */
export function gamma(z: number): number {
  // Handle special cases
  if (z === 0.5) return Math.sqrt(Math.PI)
  if (z === 1 || z === 2) return 1
  if (Number.isInteger(z) && z > 0) {
    // For positive integers, gamma(n) = (n-1)!
    let result = 1
    for (let i = 2; i < z; i++) {
      result *= i
    }
    return result
  }

  // Lanczos approximation coefficients
  const g = 7
  const coef = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]

  // Shift z to improve accuracy
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

/**
 * Calculate Mean Time To Failure for Weibull distribution
 */
export function weibullMTTF(shape: number, scale: number): number {
  return scale * gamma(1 + 1 / shape)
}

/**
 * Calculate time at which a given percentage of units will have failed
 */
export function weibullTimeAtReliability(shape: number, scale: number, reliability: number): number {
  return scale * Math.pow(-Math.log(reliability), 1 / shape)
}
