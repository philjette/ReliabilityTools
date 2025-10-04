/**
 * Gamma function implementation using Lanczos approximation
 * More accurate than Stirling's approximation
 */
export function gamma(z: number): number {
  // Handle special cases
  if (z === 0.5) {
    return Math.sqrt(Math.PI)
  }
  if (z === 1 || z === 2) {
    return 1
  }
  if (z === 3) {
    return 2
  }

  // Lanczos approximation coefficients
  const g = 7
  const coefficients = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]

  if (z < 0.5) {
    // Use reflection formula: Γ(z)Γ(1-z) = π/sin(πz)
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z))
  }

  z -= 1
  let x = coefficients[0]
  for (let i = 1; i < g + 2; i++) {
    x += coefficients[i] / (z + i)
  }

  const t = z + g + 0.5
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x
}

/**
 * Calculate Mean Time To Failure (MTTF) for a Weibull distribution
 * MTTF = η * Γ(1 + 1/β)
 */
export function weibullMTTF(shape: number, scale: number): number {
  return scale * gamma(1 + 1 / shape)
}

/**
 * Calculate time at which a given reliability level is reached
 * t = η * (-ln(R))^(1/β)
 */
export function weibullTimeAtReliability(shape: number, scale: number, reliability: number): number {
  if (reliability <= 0 || reliability >= 1) {
    throw new Error("Reliability must be between 0 and 1")
  }
  return scale * Math.pow(-Math.log(reliability), 1 / shape)
}

/**
 * Calculate reliability at a given time
 * R(t) = exp(-(t/η)^β)
 */
export function weibullReliability(shape: number, scale: number, time: number): number {
  return Math.exp(-Math.pow(time / scale, shape))
}
