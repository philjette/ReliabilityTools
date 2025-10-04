"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "./use-supabase"

export function useFMEAs() {
  const [fmeas, setFmeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase, loading: supabaseLoading } = useSupabase()

  const fetchFMEAs = async () => {
    if (!supabase) return

    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setFmeas([])
        return
      }

      const { data, error } = await supabase
        .from("fmeas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        setError(error.message)
        console.error("Error fetching FMEAs:", error)
      } else {
        setFmeas(data || [])
        console.log("Fetched FMEAs:", data)
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch FMEAs")
      console.error("Error fetching FMEAs:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!supabaseLoading && supabase) {
      fetchFMEAs()
    }
  }, [supabase, supabaseLoading])

  return { fmeas, loading, error, refetch: fetchFMEAs }
}
