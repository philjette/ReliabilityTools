"use client"

import { createClient } from "@/lib/supabase-client"
import { weibullMTTF } from "@/lib/gamma"
import type { AssetDataPoint, WeibullAnalysisResult, WeibullCurveFit } from "./weibull-analysis-actions"

const SHAPE_MIN = 0.05
const SHAPE_MAX = 20
const MTTF_MAX_HOURS = 50_000_000

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

// Client-side version of fitWeibullParameters
export async function fitWeibullParametersClient(tempDataId: string): Promise<{ success: boolean; error?: string; result?: WeibullAnalysisResult }> {
  try {
    console.log("fitWeibullParametersClient called with tempDataId:", tempDataId)
    
    const supabase = createClient()
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

    const maxObservedHours = Math.max(...events.map((e) => e.time))

    let completeParams = calculateWeibullMLE(failureTimes)
    completeParams = clampShapeAndRecomputeScale(completeParams.shape, completeParams.scale, failureTimes)
    const completeMttf = capMTTF(weibullMTTF(completeParams.shape, completeParams.scale), maxObservedHours)
    const completeOnly: WeibullCurveFit = {
      shape_parameter: completeParams.shape,
      scale_parameter: completeParams.scale,
      mttf: completeMttf,
      total_failures: nFailures,
      data_points: nFailures,
    }

    let withCensored: WeibullCurveFit | undefined
    if (hasCensored) {
      let censoredParams = calculateWeibullCensoredMLE(failureTimes, censoredTimes)
      censoredParams = clampShapeAndRecomputeScaleCensored(censoredParams.shape, censoredParams.scale, failureTimes, censoredTimes)
      const censoredMttf = capMTTF(weibullMTTF(censoredParams.shape, censoredParams.scale), maxObservedHours)
      withCensored = {
        shape_parameter: censoredParams.shape,
        scale_parameter: censoredParams.scale,
        mttf: censoredMttf,
        total_failures: nFailures,
        data_points: events.length,
      }
    }

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

function capMTTF(mttf: number, maxObservedHours: number): number {
  const cap = Math.min(MTTF_MAX_HOURS, Math.max(maxObservedHours * 100, 8760 * 100))
  if (mttf > cap || !Number.isFinite(mttf)) return cap
  return mttf
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
    const B = dS / S
    const f = r / shape + (r / (shape * shape)) * Math.log(S / r) - (r * B) / shape + sumLogT
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
