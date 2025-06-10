"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { saveFMEA } from "@/lib/fmea-actions"
import type { FailureMode } from "@/lib/actions"

interface SaveFMEADialogProps {
  assetType: string
  voltageRating: string
  operatingEnvironment: string
  ageRange: string
  loadProfile: string
  assetCriticality: string
  additionalNotes: string
  failureModes: FailureMode[]
  weibullParameters: Record<string, { shape: number; scale: number }>
}

export function SaveFMEADialog({
  assetType,
  voltageRating,
  operatingEnvironment,
  ageRange,
  loadProfile,
  assetCriticality,
  additionalNotes,
  failureModes,
  weibullParameters,
}: SaveFMEADialogProps) {
  const { user, session } = useAuth()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your FMEA",
        variant: "destructive",
      })
      return
    }

    if (!user || !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your FMEA",
        variant: "destructive",
      })
      return
    }

    if (!failureModes || failureModes.length === 0) {
      toast({
        title: "Failure modes required",
        description: "Please add at least one failure mode before saving",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      console.log("=== Starting FMEA Save ===")
      console.log("User:", user.email)
      console.log("Session exists:", !!session)
      console.log("Title:", title)
      console.log("Failure modes:", failureModes.length)

      const result = await saveFMEA({
        title: title.trim(),
        assetType,
        voltageRating,
        operatingEnvironment,
        ageRange,
        loadProfile,
        assetCriticality,
        additionalNotes,
        failureModes,
        weibullParameters,
      })

      console.log("FMEA saved successfully:", result)

      toast({
        title: "Success!",
        description: `FMEA "${title}" has been saved successfully`,
      })

      setIsOpen(false)
      setTitle("")

      // Optionally redirect to dashboard
      // window.location.href = "/dashboard/fmeas"
    } catch (error) {
      console.error("=== Error saving FMEA ===")
      console.error("Error:", error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      toast({
        title: "Save failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Don't show the button if user is not authenticated
  if (!user || !session) {
    return (
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: "Sign in required",
            description: "Please sign in to save your FMEA",
            variant: "destructive",
          })
        }}
      >
        <Save className="h-4 w-4 mr-2" />
        Save FMEA
      </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Save className="h-4 w-4 mr-2" />
          Save FMEA
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save FMEA</DialogTitle>
          <DialogDescription>Save this FMEA analysis to your dashboard for future reference.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">FMEA Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Power Transformer Analysis - Site A"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>This FMEA will include:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>{failureModes?.length || 0} failure mode(s)</li>
              <li>Asset type: {assetType || "Not specified"}</li>
              <li>Voltage rating: {voltageRating || "Not specified"}</li>
              <li>Weibull parameters for reliability analysis</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? "Saving..." : "Save FMEA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
