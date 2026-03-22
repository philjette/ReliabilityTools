"use server"

import { createClient as createServerClient } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"

const SHAPE_MIN = 0.05
const SHAPE_MAX = 20

export interface AssetDataPoint {
  asset_name: string
  installation_date: string
  /** Set for failures; null/omit for right-censored (survived at least up to observation time) */
  failure_date: string | null
  /** Time to failure (failures) or time under observation (censored). For censored with failure_date null, can be 0 and server will use install→now */
  failure_time_hours: number
}

/** Single Weibull curve fit (shape, scale, MTTF) */
export interface WeibullCurveFit {
  shape_parameter: number
  scale_parameter: number
  mttf: number
  total_failures: number
  data_points: number
}

export interface RawDataPoint {
  time: number // time in hours
  censored: boolean // true if the data point is right-censored (hasn't failed yet)
}

export interface WeibullAnalysisResult {
  id?: string
  curve_name: string
  asset_name: string
  shape_parameter: number
  scale_parameter: number
  mttf: number
  total_failures: number
  data_points: number
  created_at?: string
  /** Fit using only complete (failure) records */
  complete_only?: WeibullCurveFit
  /** Fit using all records (failures + right-censored); only present when censored data exists */
  with_censored?: WeibullCurveFit
  /** Persisted dual fit when saved (complete_only + with_censored); set when loading from DB */
  dual_fit?: { complete_only: WeibullCurveFit; with_censored: WeibullCurveFit }
  /** Raw data points used to fit the curve (for displaying on charts) */
  raw_data_points?: RawDataPoint[]
}

export interface TempAssetData {
  id?: string
  user_id: string
  asset_name: string
  installation_date: string
  failure_date: string | null
  failure_time_hours: number
  created_at?: string
}

// Upload asset data to temporary table
export async function uploadAssetData(data: AssetDataPoint[]): Promise<{ success: boolean; error?: string; tempDataId?: string }> {
  try {
    console.log("uploadAssetData called with data:", data)
    
    // Try server component client first
    let supabase
    try {
      supabase = await createServerClient()
    } catch (error) {
      console.log("Server client failed, trying service role:", error)
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log("User check result:", { user: !!user, error: userError })
    
    if (!user) {
      console.error("No authenticated user found")
      return { success: false, error: "User not authenticated. Please sign in and try again." }
    }

    // Insert data into temporary table (failure_date null = right-censored)
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

// Fit Weibull parameters to uploaded data
export async function fitWeibullParameters(tempDataId: string): Promise<{ success: boolean; error?: string; result?: WeibullAnalysisResult }> {
  try {
    console.log("fitWeibullParameters called with tempDataId:", tempDataId)
    
    let supabase
    try {
      supabase = await createServerClient()
    } catch (error) {
      console.log("Server client failed, trying service role:", error)
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log("User check result:", { user: !!user, error: userError })
    
    if (!user) {
      console.error("No authenticated user found")
      return { success: false, error: "User not authenticated. Please sign in and try again." }
    }

    // Get the uploaded data
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

    const msPerHour = 1000 * 60 * 60
    const hoursPerDay = 24

    // Censor date = latest failure date in dataset (match Python: df["failure_date"].max())
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
      return { success: false, error: "Need at least 3 observed failures for Weibull analysis" }
    }

    const empiricalMttf =
      failureTimesHours.reduce((sum, t) => sum + t, 0) / Math.max(nFailures, 1)

    // Fit in days so shape/scale match Python (scipy); then convert scale to hours for storage
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

    // Primary result uses with_censored when available (less biased), else complete_only
    const primary = withCensored ?? completeOnly
    const result: WeibullAnalysisResult = {
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

    return { success: true, result }
  } catch (error: any) {
    console.error("Unexpected error fitting Weibull parameters:", error)
    return { success: false, error: error.message || "Failed to fit Weibull parameters" }
  }
}

// Save fitted curve to permanent table
export async function saveWeibullCurve(curveName: string, analysisResult: WeibullAnalysisResult): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("saveWeibullCurve called with:", { curveName, analysisResult })
    
    // Try server component client first
    let supabase
    try {
      supabase = await createServerClient()
    } catch (error) {
      console.log("Server client failed, trying service role:", error)
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    }

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
    if (analysisResult.raw_data_points && analysisResult.raw_data_points.length > 0) {
      insertRow.raw_data_points = analysisResult.raw_data_points
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

// Get user's saved Weibull curves
export async function getUserWeibullCurves(): Promise<{ success: boolean; error?: string; curves?: WeibullAnalysisResult[] }> {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { data: curves, error } = await supabase
      .from("weibull_curves")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, curves: curves || [] }
  } catch (error: any) {
    console.error("Unexpected error fetching Weibull curves:", error)
    return { success: false, error: error.message || "Failed to fetch Weibull curves" }
  }
}

function clampShape(shape: number): number {
  return Math.max(SHAPE_MIN, Math.min(SHAPE_MAX, shape))
}

/** After clamping shape, recompute scale from complete data: η = (Σ t^β / n)^(1/β) */
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

/** After clamping shape, recompute scale from censored data: η^β = S/r => η = (S/r)^(1/β) */
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

/** Right-censored Weibull MLE: failures contribute f(t), censored contribute S(t). */
function calculateWeibullCensoredMLE(
  failureTimes: number[],
  censoredTimes: number[]
): { shape: number; scale: number } {
  const r = failureTimes.length
  if (r < 1) throw new Error("Need at least one failure for censored MLE")

  const allTimes = [...failureTimes, ...censoredTimes]
  const sumLogFailures = failureTimes.reduce((s, t) => s + Math.log(t), 0)

  // Profile-likelihood over shape (beta). From ∂L/∂η = 0: sum_all (t/η)^β = r => η^β = S/r => η = (S/r)^(1/β)
  // log L = r*log(beta) - r*beta*log(eta) + (beta-1)*sum_fail log(t) - sum_all (t/eta)^beta
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
  let bestBeta = 1
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
