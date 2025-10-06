"use client"

import { createClient } from "@/lib/supabase-client"
import type { AssetDataPoint, WeibullAnalysisResult } from "./weibull-analysis-actions"

// Client-side version of uploadAssetData
export async function uploadAssetDataClient(data: AssetDataPoint[]): Promise<{ success: boolean; error?: string; tempDataId?: string }> {
  try {
    console.log("uploadAssetDataClient called with data:", data)
    
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log("User check result:", { user: !!user, error: userError })
    
    if (!user) {
      console.error("No authenticated user found")
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
          failure_date: point.failure_date,
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
      .order("failure_time_hours", { ascending: true })

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    if (!assetData || assetData.length < 3) {
      return { success: false, error: "Need at least 3 data points for Weibull analysis" }
    }

    // Extract failure times
    const failureTimes = assetData.map(d => d.failure_time_hours)
    
    // Calculate Weibull parameters using Maximum Likelihood Estimation
    const weibullParams = calculateWeibullMLE(failureTimes)
    
    // Calculate MTTF
    const mttf = weibullParams.scale * Math.exp(1 / weibullParams.shape)

    const result: WeibullAnalysisResult = {
      curve_name: `${assetData[0].asset_name} Analysis`,
      asset_name: assetData[0].asset_name,
      shape_parameter: weibullParams.shape,
      scale_parameter: weibullParams.scale,
      mttf: mttf,
      total_failures: assetData.length,
      data_points: assetData.length
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
