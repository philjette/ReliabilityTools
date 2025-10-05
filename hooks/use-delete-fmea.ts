"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "./use-supabase"
import { useToast } from "@/hooks/use-toast"

export function useDeleteFMEA() {
  const [deleting, setDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { supabase, loading: supabaseLoading } = useSupabase()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const deleteFMEA = async (id: string) => {
    // Only run on client side
    if (!mounted) {
      return { error: "Component not mounted" }
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase client not ready",
        variant: "destructive",
      })
      return { error: "Supabase client not ready" }
    }

    try {
      setDeleting(true)
      console.log("Deleting FMEA with ID:", id)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        const error = "User not authenticated"
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        })
        return { error }
      }

      const { error } = await supabase
        .from("fmeas")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) {
        console.error("Error deleting FMEA:", error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return { error: error.message }
      }

      console.log("FMEA deleted successfully")
      toast({
        title: "Success",
        description: "FMEA deleted successfully",
      })
      return { success: true }
    } catch (err: any) {
      console.error("Error deleting FMEA:", err)
      const error = err.message || "Failed to delete FMEA"
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
      return { error }
    } finally {
      setDeleting(false)
    }
  }

  return { deleteFMEA, deleting }
}
