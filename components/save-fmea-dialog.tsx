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
import type { FailureMode } from "@/lib/actions"

interface SaveFMEADialogProps {
  fmeaData: {
    title: string
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
}

export function SaveFMEADialog({ fmeaData }: SaveFMEADialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState(fmeaData.title)
  const [isSaving, setIsSaving] = useState(false)
  const { user, signIn } = useAuth()

  const handleSave = async () => {
    if (!user) {
      await signIn()
      return
    }

    setIsSaving(true)
    try {
      await saveFMEA({
        ...fmeaData,
        title,
      })
      setIsOpen(false)
    } catch (error) {
      console.error("Error saving FMEA:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Save className="mr-2 h-4 w-4" />
          Save FMEA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save FMEA Report</DialogTitle>
          <DialogDescription>
            {user
              ? "Save this FMEA analysis to your dashboard for future reference."
              : "Sign in to save this FMEA analysis to your dashboard."}
          </DialogDescription>
        </DialogHeader>
        {user ? (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter FMEA title"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-4">
            <Button onClick={handleSave} className="w-full">
              Sign In to Save
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
