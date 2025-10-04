"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveFMEA, type FMEAData } from "@/lib/fmea-actions"
import { createClient } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"

interface SaveFMEADialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fmeaData: FMEAData
}

export function SaveFMEADialog({ open, onOpenChange, fmeaData }: SaveFMEADialogProps) {
  const [title, setTitle] = useState(fmeaData.title || "")
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Update title when fmeaData changes
  useEffect(() => {
    if (fmeaData.title) {
      setTitle(fmeaData.title)
    }
  }, [fmeaData.title])

  const handleSave = async () => {
    console.log("=== handleSave called ===")
    console.log("Title:", title)
    console.log("Title trimmed:", title.trim())
    console.log("FMEA Data:", fmeaData)
    console.log("Button should be enabled:", !saving && title.trim().length > 0)

    if (!title.trim()) {
      console.log("Title is empty, showing error")
      toast({
        title: "Error",
        description: "Please enter a title for the FMEA",
        variant: "destructive",
      })
      return
    }

    console.log("Starting save process...")
    setSaving(true)

    try {
      const dataToSave: FMEAData = {
        ...fmeaData,
        title: title.trim(),
      }

      console.log("Saving data:", dataToSave)
      console.log("Calling saveFMEA...")

      // Try client-side save first
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("No authenticated user found")
        toast({
          title: "Error",
          description: "You must be signed in to save FMEAs",
          variant: "destructive",
        })
        return
      }

      console.log("User authenticated:", user.id)

      const { data, error } = await supabase
        .from("fmeas")
        .insert({
          user_id: user.id,
          title: dataToSave.title,
          asset_type: dataToSave.asset_type,
          voltage_rating: dataToSave.voltage_rating,
          operating_environment: dataToSave.operating_environment,
          age_range: dataToSave.age_range,
          load_profile: dataToSave.load_profile,
          asset_criticality: dataToSave.asset_criticality,
          additional_notes: dataToSave.additional_notes,
          failure_modes: dataToSave.failure_modes,
          weibull_parameters: dataToSave.weibull_parameters || {},
        })
        .select()
        .single()

      const result = error ? { error: error.message } : { data }

      console.log("Save result received:", result)

      if (result.error) {
        console.error("Save failed with error:", result.error)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        console.log("Save successful!")
        toast({
          title: "Success",
          description: "FMEA saved successfully",
        })
        onOpenChange(false)
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: any) {
      console.error("Exception in handleSave:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save FMEA",
        variant: "destructive",
      })
    } finally {
      console.log("Setting saving to false")
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save FMEA</DialogTitle>
          <DialogDescription>Enter a title for this FMEA to save it to your dashboard.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Transformer 138kV Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>This FMEA will include:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>{fmeaData.failure_modes?.length || 0} failure mode(s)</li>
              <li>Asset type: {fmeaData.asset_type}</li>
              <li>Voltage rating: {fmeaData.voltage_rating}</li>
              <li>Weibull parameters for reliability analysis</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? (
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
