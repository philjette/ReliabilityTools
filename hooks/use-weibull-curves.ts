"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "./use-supabase"
import { useAuth } from "@/contexts/auth-context"
import { getUserWeibullCurvesClient, deleteWeibullCurveClient } from "@/lib/weibull-analysis-client"
import type { WeibullAnalysisResult } from "@/lib/weibull-analysis-actions"

export function useWeibullCurves() {
  const [curves, setCurves] = useState<WeibullAnalysisResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase, loading: supabaseLoading } = useSupabase()
  const { user: authUser, loading: authLoading } = useAuth()

  const fetchCurves = useCallback(async () => {
    if (!supabase || !authUser) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await getUserWeibullCurvesClient()
      
      if (result.success) {
        setCurves(result.curves || [])
      } else {
        setError(result.error || "Failed to fetch curves")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch curves")
      console.error("Unexpected error fetching curves:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase, authUser])

  const deleteCurve = useCallback(async (id: string) => {
    try {
      const result = await deleteWeibullCurveClient(id)
      
      if (result.success) {
        // Remove the curve from local state
        setCurves(prev => prev.filter(curve => curve.id !== id))
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      console.error("Error deleting curve:", err)
      return { success: false, error: err.message || "Failed to delete curve" }
    }
  }, [])

  useEffect(() => {
    if (!supabaseLoading && !authLoading) {
      fetchCurves()
    }
  }, [supabaseLoading, authLoading, fetchCurves])

  return { curves, loading, error, refetch: fetchCurves, deleteCurve }
}
