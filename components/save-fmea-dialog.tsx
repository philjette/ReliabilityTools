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
  const { user } = useAuth()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your FMEA",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      await saveFMEA({
        title,
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

      toast({
        title: "FMEA saved",
        description: "Your FMEA has been saved successfully",
      })
      setIsOpen(false)
      setTitle("")
    } catch (error) {
      console.error("Error saving FMEA:", error)
      toast({
        title: "Error",
        description: "Failed to save FMEA. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return null
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
          <DialogDescription>Save this FMEA to your account for future reference.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a title for your FMEA"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save FMEA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
