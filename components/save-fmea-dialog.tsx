"use client"

import { useState } from "react"
import { Save, Loader2 } from "lucide-react"
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
import { useAuth } from "@/contexts/auth-context"
import { saveFMEA } from "@/lib/fmea-actions"
import { useRouter } from "next/navigation"
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
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      await saveFMEA({
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

      setIsOpen(false)
      setTitle("")
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to save FMEA")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <Button variant="outline" onClick={() => router.push("/auth/sign-in")}>
        <Save className="h-4 w-4 mr-2" />
        Sign in to Save
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
              onChange={(e) => {
                setTitle(e.target.value)
                setError("")
              }}
              disabled={isSaving}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
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
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save FMEA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
