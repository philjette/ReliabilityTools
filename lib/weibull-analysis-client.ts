"use client"

import { createClient } from "@/lib/supabase-client"
import type { AssetDataPoint, WeibullAnalysisResult, WeibullCurveFit } from "./weibull-analysis-actions"

const SHAPE_MIN = 0.05
const SHAPE_MAX = 20

// Client-side version of uploadAssetData
export async function uploadAssetDataClient(data: AssetDataPoint[]): Promise<{ success: boolean; error?: string; tempDataId?: string }> {
  try {
    console.log("[v0] uploadAssetDataClient called with data:", data)
    
    const supabase = createClient()
    
    // Check session first
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log("[v0] Session check:", { 
      hasSession: !!sessionData?.session, 
      sessionError: sessionError?.message,
      accessToken: sessionData?.session?.access_token ? "present" : "missing"
    })
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log("[v0] User check result:", { 
      hasUser: !!user, 
      userId: user?.id,
      email: user?.email,
      error: userError?.message 
    })
    
    if (!user) {
      console.error("[v0] No authenticated user found")
      return { success: false, error: "User not authenticated. Please sign in and try again." }
    }

    // Insert data into temporary table
    const { data: insertedData, error } = await supabase
      .from("temp_asset_data")
      .insert(
        data.map(point => ({
          user_id: user.id,
          asset_name: point.asset_name,
          installation_date: point.installation_date,
          failure_date: point.failure_date ?? null,
          failure_time_hours: point.failure_time_hours
        }))
      )
      .select()

    if (error) {
      console.error("Error uploading asset data:", error)
      return { success: false, error: error.message }
    }

    return { success: true, tempDataId: insertedData?.[0]?.id }
  } catch (error: any) {
    console.error("Unexpected error uploading asset data:", error)
    return { success: false, error: error.message || "Failed to upload asset data" }
  }
}

/** Run Weibull fit on in-memory asset data. Use this so the chart reflects exactly the parsed CSV. */
export function fitWeibullFromAssetData(assetData: AssetDataPoint[]): { success: boolean; error?: string; result?: WeibullAnalysisResult } {
  try {
    if (!assetData || assetData.length < 3) {
      return { success: false, error: "Need at least 3 data points for Weibull analysis" }
    }
    const result = computeWeibullResult(assetData)
    return { success: true, result }
  } catch (error: any) {
    console.error("Unexpected error fitting Weibull parameters:", error)
    return { success: false, error: error?.message || "Failed to fit Weibull parameters" }
  }
}

/** Core fit logic: build events (censor date = max failure date), then MLE. */
function computeWeibullResult(assetData: Array<{ asset_name: string; installation_date: string; failure_date: string | null; failure_time_hours: number }>): WeibullAnalysisResult {
  const msPerHour = 1000 * 60 * 60
  const hoursPerDay = 24

  const failureDates = assetData
    .map((d) => d.failure_date)
    .filter((x): x is string => x != null && x !== "")
  const censorDateMs =
    failureDates.length > 0
      ? Math.max(...failureDates.map((d) => new Date(d).getTime()))
      : Date.now()

  type Event = { time: number; censored: boolean }
  const events: Event[] = assetData.map((d) => {
    const isCensored = d.failure_date == null || d.failure_date === ""
    const time =
      isCensored
        ? Math.max(
            (censorDateMs - new Date(d.installation_date).getTime()) / msPerHour,
            1e-6
          )
        : d.failure_time_hours
    return { time: Math.max(time, 1e-6), censored: isCensored }
  })
  events.sort((a, b) => a.time - b.time)

  const failureTimesHours = events.filter((e) => !e.censored).map((e) => e.time)
  const censoredTimesHours = events.filter((e) => e.censored).map((e) => e.time)
  const nFailures = failureTimesHours.length
  const hasCensored = censoredTimesHours.length > 0

  if (nFailures < 3) {
    throw new Error("Need at least 3 observed failures for Weibull analysis")
  }

  const empiricalMttf =
    failureTimesHours.reduce((sum, t) => sum + t, 0) / Math.max(nFailures, 1)

  const failureTimesDays = failureTimesHours.map((h) => h / hoursPerDay)
  const censoredTimesDays = censoredTimesHours.map((h) => h / hoursPerDay)

  let completeParams = calculateWeibullMLE(failureTimesDays)
  completeParams = clampShapeAndRecomputeScale(completeParams.shape, completeParams.scale, failureTimesDays)
  const completeOnly: WeibullCurveFit = {
    shape_parameter: completeParams.shape,
    scale_parameter: completeParams.scale * hoursPerDay,
    mttf: empiricalMttf,
    total_failures: nFailures,
    data_points: nFailures,
  }

  let withCensored: WeibullCurveFit | undefined
  if (hasCensored) {
    let censoredParams = calculateWeibullCensoredMLE(failureTimesDays, censoredTimesDays)
    censoredParams = clampShapeAndRecomputeScaleCensored(
      censoredParams.shape,
      censoredParams.scale,
      failureTimesDays,
      censoredTimesDays
    )
    withCensored = {
      shape_parameter: censoredParams.shape,
      scale_parameter: censoredParams.scale * hoursPerDay,
      mttf: empiricalMttf,
      total_failures: nFailures,
      data_points: events.length,
    }
  }

  const primary = withCensored ?? completeOnly
  return {
    curve_name: `${assetData[0].asset_name} Analysis`,
    asset_name: assetData[0].asset_name,
    shape_parameter: primary.shape_parameter,
    scale_parameter: primary.scale_parameter,
    mttf: primary.mttf,
    total_failures: primary.total_failures,
    data_points: primary.data_points,
    complete_only: completeOnly,
    with_censored: withCensored,
  }
}

// Client-side version of fitWeibullParameters (fetches from DB — use fitWeibullFromAssetData for current upload so chart matches)
export async function fitWeibullParametersClient(tempDataId: string): Promise<{ success: boolean; error?: string; result?: WeibullAnalysisResult }> {
  try {
    console.log("fitWeibullParametersClient called with tempDataId:", tempDataId)

    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated. Please sign in and try again." }
    }

    const { data: assetData, error: fetchError } = await supabase
      .from("temp_asset_data")
      .select("*")
      .eq("user_id", user.id)

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    if (!assetData || assetData.length < 3) {
      return { success: false, error: "Need at least 3 data points for Weibull analysis" }
    }

    const result = computeWeibullResult(assetData)
    return { success: true, result }
  } catch (error: any) {
    console.error("Unexpected error fitting Weibull parameters:", error)
    return { success: false, error: error?.message || "Failed to fit Weibull parameters" }
  }
}

// Client-side version of saveWeibullCurve
export async function saveWeibullCurveClient(curveName: string, analysisResult: WeibullAnalysisResult): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("saveWeibullCurveClient called with:", { curveName, analysisResult })
    
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log("User check result:", { user: !!user, error: userError })
    
    if (!user) {
      console.error("No authenticated user found")
      return { success: false, error: "User not authenticated. Please sign in and try again." }
    }

    const insertRow: Record<string, unknown> = {
      user_id: user.id,
      curve_name: curveName,
      asset_name: analysisResult.asset_name,
      shape_parameter: analysisResult.shape_parameter,
      scale_parameter: analysisResult.scale_parameter,
      mttf: analysisResult.mttf,
      total_failures: analysisResult.total_failures,
      data_points: analysisResult.data_points,
    }
    if (analysisResult.complete_only && analysisResult.with_censored) {
      insertRow.dual_fit = {
        complete_only: analysisResult.complete_only,
        with_censored: analysisResult.with_censored,
      }
    }

    const { data, error } = await supabase
      .from("weibull_curves")
      .insert(insertRow)
      .select()
      .single()

    if (error) {
      console.error("Error saving Weibull curve:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error saving Weibull curve:", error)
    return { success: false, error: error.message || "Failed to save Weibull curve" }
  }
}

// Client-side version of getUserWeibullCurves
export async function getUserWeibullCurvesClient(): Promise<{ success: boolean; error?: string; curves?: WeibullAnalysisResult[] }> {
  try {
    console.log("getUserWeibullCurvesClient called")
    
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log("User check result:", { user: !!user, error: userError })
    
    if (!user) {
      console.error("No authenticated user found")
      return { success: false, error: "User not authenticated. Please sign in and try again." }
    }

    const { data: curves, error } = await supabase
      .from("weibull_curves")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching Weibull curves:", error)
      return { success: false, error: error.message }
    }

    console.log("Fetched curves:", curves)
    return { success: true, curves: curves || [] }
  } catch (error: any) {
    console.error("Unexpected error fetching Weibull curves:", error)
    return { success: false, error: error.message || "Failed to fetch Weibull curves" }
  }
}

// Client-side version of deleteWeibullCurve
export async function deleteWeibullCurveClient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("deleteWeibullCurveClient called with id:", id)
    
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log("User check result:", { user: !!user, error: userError })
    
    if (!user) {
      console.error("No authenticated user found")
      return { success: false, error: "User not authenticated. Please sign in and try again." }
    }

    const { error } = await supabase
      .from("weibull_curves")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting Weibull curve:", error)
      return { success: false, error: error.message }
    }

    console.log("Weibull curve deleted successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error deleting Weibull curve:", error)
    return { success: false, error: error.message || "Failed to delete Weibull curve" }
  }
}

function clampShape(shape: number): number {
  return Math.max(SHAPE_MIN, Math.min(SHAPE_MAX, shape))
}

function clampShapeAndRecomputeScale(
  shape: number,
  _scale: number,
  failureTimes: number[]
): { shape: number; scale: number } {
  const s = clampShape(shape)
  const n = failureTimes.length
  const sumTBeta = failureTimes.reduce((sum, t) => sum + Math.pow(t, s), 0)
  const scale = Math.pow(sumTBeta / n, 1 / s)
  return { shape: s, scale }
}

function clampShapeAndRecomputeScaleCensored(
  shape: number,
  _scale: number,
  failureTimes: number[],
  censoredTimes: number[]
): { shape: number; scale: number } {
  const s = clampShape(shape)
  const r = failureTimes.length
  const allTimes = [...failureTimes, ...censoredTimes]
  const S = allTimes.reduce((sum, t) => sum + Math.pow(t, s), 0)
  const scale = Math.pow(S / r, 1 / s)
  return { shape: s, scale }
}

// Maximum Likelihood Estimation for Weibull parameters
function calculateWeibullMLE(failureTimes: number[]): { shape: number; scale: number } {
  const n = failureTimes.length
  const sortedTimes = [...failureTimes].sort((a, b) => a - b)
  
  // Initial guess for shape parameter
  let shape = 1.5
  let scale = Math.pow(sortedTimes.reduce((sum, t) => sum + Math.pow(t, shape), 0) / n, 1 / shape)
  
  // Newton-Raphson iteration for MLE
  const maxIterations = 100
  const tolerance = 1e-6
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const sum1 = sortedTimes.reduce((sum, t) => sum + Math.log(t), 0)
    const sum2 = sortedTimes.reduce((sum, t) => sum + Math.pow(t, shape), 0)
    const sum3 = sortedTimes.reduce((sum, t) => sum + Math.pow(t, shape) * Math.log(t), 0)
    
    // First derivative
    const f = n / shape + sum1 - n * Math.log(scale) - sum3 / sum2
    
    // Second derivative
    const fPrime = -n / (shape * shape) - sum3 / sum2 + Math.pow(sum3, 2) / Math.pow(sum2, 2)
    
    if (Math.abs(f) < tolerance) break
    
    const newShape = shape - f / fPrime
    if (newShape <= 0) break
    
    shape = newShape
    scale = Math.pow(sum2 / n, 1 / shape)
  }
  
  return { shape, scale }
}

function calculateWeibullCensoredMLE(
  failureTimes: number[],
  censoredTimes: number[]
): { shape: number; scale: number } {
  const r = failureTimes.length
  if (r < 1) throw new Error("Need at least one failure for censored MLE")

  const allTimes = [...failureTimes, ...censoredTimes]
  const sumLogFailures = failureTimes.reduce((s, t) => s + Math.log(t), 0)

  // Profile-likelihood: log L = r*log(beta) - r*beta*log(eta) + (beta-1)*sum_fail log(t) - sum_all (t/eta)^beta
  // From ∂L/∂η = 0: sum_all (t/η)^β = r => η^β = S/r => η = (S/r)^(1/β)
  function logLikelihood(beta: number): number {
    if (!Number.isFinite(beta) || beta <= 0) return -Infinity
    const tBeta = allTimes.map((t) => Math.pow(t, beta))
    const S = tBeta.reduce((a, b) => a + b, 0)
    if (!Number.isFinite(S) || S <= 0) return -Infinity
    const eta = Math.pow(S / r, 1 / beta)
    const sumOverEtaBeta = S / Math.pow(eta, beta)
    return r * Math.log(beta) - r * beta * Math.log(eta) + (beta - 1) * sumLogFailures - sumOverEtaBeta
  }

  // Simple 1D grid search over a reasonable beta range, then refine locally
  let bestBeta = 1.0
  let bestLL = -Infinity
  const betaMin = SHAPE_MIN
  const betaMax = SHAPE_MAX
  const steps = 80

  for (let i = 0; i <= steps; i++) {
    const beta = betaMin + (i * (betaMax - betaMin)) / steps
    const ll = logLikelihood(beta)
    if (ll > bestLL) {
      bestLL = ll
      bestBeta = beta
    }
  }

  // Local refinement around bestBeta
  const refineSteps = 40
  const halfWidth = (betaMax - betaMin) / steps
  const refineMin = Math.max(betaMin, bestBeta - halfWidth)
  const refineMax = Math.min(betaMax, bestBeta + halfWidth)
  bestLL = -Infinity
  for (let i = 0; i <= refineSteps; i++) {
    const beta = refineMin + (i * (refineMax - refineMin)) / refineSteps
    const ll = logLikelihood(beta)
    if (ll > bestLL) {
      bestLL = ll
      bestBeta = beta
    }
  }

  const tBeta = allTimes.map((t) => Math.pow(t, bestBeta))
  const S = tBeta.reduce((a, b) => a + b, 0)
  const scale = Math.pow(S / r, 1 / bestBeta)
  return { shape: bestBeta, scale }
}
