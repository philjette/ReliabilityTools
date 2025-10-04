"use client"

import { useState, useEffect } from "react"
import { SavedFMEAsList } from "@/components/saved-fmeas-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { getUserFMEAsClient } from "@/lib/fmea-actions"

export function ClientDashboard() {
  const [fmeas, setFmeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const fetchFMEAs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await getUserFMEAsClient()
      
      if (error) {
        setError(error)
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
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchFMEAs()
    }
  }, [mounted])

  // Listen for storage events to refresh when FMEAs are saved
  useEffect(() => {
    if (!mounted) return

    const handleStorageChange = () => {
      fetchFMEAs()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [mounted])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading FMEAs...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading FMEAs</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (fmeas && fmeas.length > 0) {
    return <SavedFMEAsList fmeas={fmeas} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>No FMEAs Yet</CardTitle>
        <CardDescription>
          You haven't created any FMEA reports yet. Get started by generating your first FMEA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/generate">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate FMEA
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
