"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function RiskMatrixSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState({
    lowThreshold: 25,
    mediumThreshold: 50,
    highThreshold: 100,
    criticalThreshold: 200,
  })

  const handleSave = () => {
    // In a real app, you would save these settings to localStorage or a backend
    console.log("Saving risk matrix settings:", settings)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Risk Matrix Settings</DialogTitle>
          <DialogDescription>Customize the risk level thresholds for the risk matrix visualization.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="low" className="text-right">
              Low Risk
            </Label>
            <Input
              id="low"
              type="number"
              value={settings.lowThreshold}
              onChange={(e) => setSettings((prev) => ({ ...prev, lowThreshold: Number.parseInt(e.target.value) || 0 }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="medium" className="text-right">
              Medium Risk
            </Label>
            <Input
              id="medium"
              type="number"
              value={settings.mediumThreshold}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, mediumThreshold: Number.parseInt(e.target.value) || 0 }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="high" className="text-right">
              High Risk
            </Label>
            <Input
              id="high"
              type="number"
              value={settings.highThreshold}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, highThreshold: Number.parseInt(e.target.value) || 0 }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="critical" className="text-right">
              Critical Risk
            </Label>
            <Input
              id="critical"
              type="number"
              value={settings.criticalThreshold}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, criticalThreshold: Number.parseInt(e.target.value) || 0 }))
              }
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
