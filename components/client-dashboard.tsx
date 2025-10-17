"use client"

import { useEffect, useState } from "react"
import { SavedFMEAsList } from "@/components/saved-fmeas-list"
import { OverallRiskMatrix } from "@/components/overall-risk-matrix"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, BarChart3, Grid3X3, List } from "lucide-react"
import Link from "next/link"
import { useFMEAs } from "@/hooks/use-fmeas"

export function ClientDashboard() {
  const { fmeas, loading, error, refetch } = useFMEAs()
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list')

  // Listen for storage events to refresh when FMEAs are saved
  useEffect(() => {
    const handleStorageChange = () => {
      refetch()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [refetch])


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
    return (
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your FMEAs</h2>
            <p className="text-gray-600">Manage and analyze your saved FMEA reports</p>
          </div>
          <div className="flex gap-3">
            {/* View Mode Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
              <Button
                variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('matrix')}
                className="rounded-l-none"
              >
                <Grid3X3 className="mr-2 h-4 w-4" />
                Risk Matrix
              </Button>
            </div>
            
            {fmeas.length >= 2 && (
              <Button asChild variant="outline">
                <Link href="/compare">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Compare FMEAs
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/generate">
                <Plus className="mr-2 h-4 w-4" />
                Generate FMEA
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Content based on view mode */}
        {viewMode === 'list' ? (
          <SavedFMEAsList fmeas={fmeas} onDelete={refetch} />
        ) : (
          <OverallRiskMatrix fmeas={fmeas} />
        )}
      </div>
    )
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
