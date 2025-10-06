"use client"

import { useEffect } from "react"
import { SavedCurvesList } from "@/components/saved-curves-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useWeibullCurves } from "@/hooks/use-weibull-curves"

export function ClientCurvesDashboard() {
  const { curves, loading, error, refetch } = useWeibullCurves()

  // Listen for storage events to refresh when curves are saved
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
        <span>Loading failure curves...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Curves</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (curves && curves.length > 0) {
    return (
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Failure Curves</h2>
            <p className="text-gray-600">Manage and analyze your saved Weibull failure curves</p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/analyze">
                <Plus className="mr-2 h-4 w-4" />
                Create New Curve
              </Link>
            </Button>
          </div>
        </div>
        
        <SavedCurvesList curves={curves} onDelete={refetch} />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>No Failure Curves Yet</CardTitle>
        <CardDescription>
          You haven't created any Weibull failure curves yet. Get started by analyzing your asset failure data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Create Weibull failure curves by uploading CSV data with asset failure times. 
            This will help you understand failure patterns and predict reliability.
          </p>
          <Link href="/analyze">
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              Analyze Failure Data
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
