"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Trash2, Calendar, AlertCircle } from "lucide-react"
import { deleteFMEAClient, type SavedFMEA } from "@/lib/fmea-actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SavedFMEAsListProps {
  fmeas: SavedFMEA[]
  onDelete?: () => void
}

export function SavedFMEAsList({ fmeas, onDelete }: SavedFMEAsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      console.log("Deleting FMEA with ID:", id)
      
      const result = await deleteFMEAClient(id)
      
      if (result.error) {
        console.error("Error deleting FMEA:", result.error)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        console.log("FMEA deleted successfully")
        toast({
          title: "Success",
          description: "FMEA deleted successfully",
        })
        // Call the onDelete callback if provided, otherwise refresh the page
        if (onDelete) {
          onDelete()
        } else {
          router.refresh()
        }
      }
    } catch (error) {
      console.error("Error deleting FMEA:", error)
      toast({
        title: "Error",
        description: "Failed to delete FMEA",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (fmeas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved FMEAs yet</h3>
          <p className="text-gray-600 text-center mb-6">Generate your first FMEA and save it to see it here</p>
          <Button asChild>
            <Link href="/generate">Generate FMEA</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {fmeas.map((fmea) => (
        <Card key={fmea.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2">{fmea.title}</CardTitle>
                <CardDescription className="mt-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(fmea.created_at).toLocaleDateString()}
                  </div>
                </CardDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deletingId === fmea.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete FMEA</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{fmea.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(fmea.id)} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{fmea.asset_type}</Badge>
                <Badge variant="outline">{fmea.voltage_rating}</Badge>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                  {fmea.failure_modes?.length || 0} failure modes
                </div>
              </div>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href={`/dashboard/fmea/${fmea.id}`}>View Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
