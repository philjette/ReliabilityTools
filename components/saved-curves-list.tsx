"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Trash2, Calendar, BarChart3, Eye } from "lucide-react"
import { type WeibullAnalysisResult } from "@/lib/weibull-analysis-actions"
import { useRouter } from "next/navigation"
import { useWeibullCurves } from "@/hooks/use-weibull-curves"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SavedCurvesListProps {
  curves: WeibullAnalysisResult[]
  onDelete?: () => void
}

export function SavedCurvesList({ curves, onDelete }: SavedCurvesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { deleteCurve } = useWeibullCurves()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDelete = async (id: string) => {
    if (!mounted) return

    try {
      setDeletingId(id)
      const result = await deleteCurve(id)

      if (result.success) {
        if (onDelete) {
          onDelete()
        } else {
          router.refresh()
        }
      }
    } catch (error) {
      console.error("Error deleting curve:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatMTTF = (mttf: number) => {
    if (mttf >= 8760) {
      return `${(mttf / 8760).toFixed(1)} years`
    } else if (mttf >= 24) {
      return `${(mttf / 24).toFixed(1)} days`
    } else {
      return `${mttf.toFixed(0)} hours`
    }
  }

  const getShapeInterpretation = (shape: number) => {
    if (shape < 1) return "Early failures (infant mortality)"
    if (shape === 1) return "Random failures (exponential)"
    if (shape > 1 && shape < 2) return "Wear-out failures"
    return "Rapid wear-out failures"
  }

  const getShapeColor = (shape: number) => {
    if (shape < 1) return "bg-blue-100 text-blue-800"
    if (shape === 1) return "bg-green-100 text-green-800"
    if (shape > 1 && shape < 2) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {curves.map((curve) => (
        <Card key={curve.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg line-clamp-2">{curve.curve_name}</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(curve.created_at!).toLocaleDateString()}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Asset:</span> {curve.asset_name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Data Points:</span> {curve.data_points}
              </p>
              <p className="text-sm">
                <span className="font-medium">MTTF:</span> {formatMTTF(curve.mttf)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                β: {curve.shape_parameter.toFixed(2)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                η: {curve.scale_parameter.toFixed(0)}h
              </Badge>
            </div>

            <Badge className={`text-xs ${getShapeColor(curve.shape_parameter)}`}>
              {getShapeInterpretation(curve.shape_parameter)}
            </Badge>

            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/curves/${curve.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:text-red-600"
                    disabled={deletingId === curve.id}
                  >
                    {deletingId === curve.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the Weibull curve "{curve.curve_name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDelete(curve.id!)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
