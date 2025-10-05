"use client"

import { useEffect } from "react"
import { SavedFMEAsList } from "@/components/saved-fmeas-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { useFMEAs } from "@/hooks/use-fmeas"

export function ClientDashboard() {
  const { fmeas, loading, error, refetch } = useFMEAs()

  // Listen for storage events to refresh when FMEAs are saved
  useEffect(() => {
    const handleStorageChange = () => {
      refetch()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [refetch])

  // Check for auth success parameter and refresh auth state
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('auth') === 'success') {
      console.log("Auth success detected, refreshing auth state...")
      // Remove the auth parameter from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('auth')
      window.history.replaceState({}, '', newUrl.toString())
      
      // Trigger a page refresh to ensure auth state is properly loaded
      window.location.reload()
    }
  }, [])

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
    return <SavedFMEAsList fmeas={fmeas} onDelete={refetch} />
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
