"use server"

import { createClient as createServerClient } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"

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

    const nowMs = Date.now()
    const msPerHour = 1000 * 60 * 60

    // Classify rows: failure_date set = failure; null = right-censored (survived at least to observation time)
    type Event = { time: number; censored: boolean }
    const events: Event[] = assetData.map((d) => {
      const isCensored = d.failure_date == null || d.failure_date === ""
      const time =
        isCensored
          ? d.failure_time_hours > 0
            ? d.failure_time_hours
            : (nowMs - new Date(d.installation_date).getTime()) / msPerHour
          : d.failure_time_hours
      return { time: Math.max(time, 1e-6), censored: isCensored }
    })
    events.sort((a, b) => a.time - b.time)

    const failureTimes = events.filter((e) => !e.censored).map((e) => e.time)
    const censoredTimes = events.filter((e) => e.censored).map((e) => e.time)
    const nFailures = failureTimes.length
    const hasCensored = censoredTimes.length > 0

    if (nFailures < 3) {
      return { success: false, error: "Need at least 3 observed failures for Weibull analysis" }
    }

    // Fit 1: complete data only (failures)
    const completeParams = calculateWeibullMLE(failureTimes)
    const completeMttf = completeParams.scale * Math.exp(1 / completeParams.shape)
    const completeOnly: WeibullCurveFit = {
      shape_parameter: completeParams.shape,
      scale_parameter: completeParams.scale,
      mttf: completeMttf,
      total_failures: nFailures,
      data_points: nFailures,
    }

    // Fit 2: with right-censored (when present)
    let withCensored: WeibullCurveFit | undefined
    if (hasCensored) {
      const censoredParams = calculateWeibullCensoredMLE(failureTimes, censoredTimes)
      const censoredMttf = censoredParams.scale * Math.exp(1 / censoredParams.shape)
      withCensored = {
        shape_parameter: censoredParams.shape,
        scale_parameter: censoredParams.scale,
        mttf: censoredMttf,
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

    const { data, error } = await supabase
      .from("weibull_curves")
      .insert({
        user_id: user.id,
        curve_name: curveName,
        asset_name: analysisResult.asset_name,
        shape_parameter: analysisResult.shape_parameter,
        scale_parameter: analysisResult.scale_parameter,
        mttf: analysisResult.mttf,
        total_failures: analysisResult.total_failures,
        data_points: analysisResult.data_points
      })
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
  const allTimes = [...failureTimes, ...censoredTimes]
  if (r < 1) throw new Error("Need at least one failure for censored MLE")

  let shape = 1.5
  const maxIterations = 100
  const tolerance = 1e-6
  const sumLogT = failureTimes.reduce((s, t) => s + Math.log(t), 0)

  for (let iter = 0; iter < maxIterations; iter++) {
    const tBeta = allTimes.map((t) => Math.pow(t, shape))
    const tBetaLnT = allTimes.map((t) => Math.pow(t, shape) * Math.log(t))
    const tBetaLn2T = allTimes.map((t) => Math.pow(t, shape) * Math.log(t) * Math.log(t))
    const S = tBeta.reduce((a, b) => a + b, 0)
    const dS = tBetaLnT.reduce((a, b) => a + b, 0)
    const d2S = tBetaLn2T.reduce((a, b) => a + b, 0)
    const scale = Math.pow(S / r, 1 / shape)

    // d(LL)/dβ
    const B = dS / S
    const f = r / shape + (r / (shape * shape)) * Math.log(S / r) - (r * B) / shape + sumLogT
    // d²(LL)/dβ² (simplified)
    const C = d2S / S - B * B
    const fPrime = -r / (shape * shape) - (2 * r / (shape * shape * shape)) * Math.log(S / r) + (2 * r * B) / (shape * shape) - (r / shape) * C + (r * B * B) / shape

    if (Math.abs(f) < tolerance) break
    const newShape = shape - f / fPrime
    if (newShape <= 0) break
    shape = newShape
  }

  const tBeta = allTimes.map((t) => Math.pow(t, shape))
  const S = tBeta.reduce((a, b) => a + b, 0)
  const scale = Math.pow(S / r, 1 / shape)
  return { shape, scale }
}
