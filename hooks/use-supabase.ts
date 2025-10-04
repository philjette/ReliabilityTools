"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client"
import type { SupabaseClient } from "@supabase/supabase-js"

export function useSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error("Error creating Supabase client:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  return { supabase, loading }
}
