"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/contexts/AppContext"

interface FMEA {
  id: string
  name: string
  asset_type: string
  created_at: string
}

export function CompareFMEAsButton({ fmeas }: { fmeas: FMEA[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { selectedFMEAs, addFMEA, removeFMEA, clearSelectedFMEAs } = useAppContext()

  const handleCompare = () => {
    if (selectedFMEAs.length < 2) {
      alert("Please select at least 2 FMEAs to compare")
      return
    }

    const queryString = selectedFMEAs.map((id) => `ids=${id}`).join("&")
    router.push(`/dashboard/compare?${queryString}`)
    setOpen(false)
  }

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      addFMEA(id)
    } else {
      removeFMEA(id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Compare FMEAs</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select FMEAs to Compare</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {fmeas.map((fmea) => (
            <div key={fmea.id} className="flex items-center space-x-2">
              <Checkbox
                id={`fmea-${fmea.id}`}
                checked={selectedFMEAs.includes(fmea.id)}
                onCheckedChange={(checked) => handleCheckboxChange(fmea.id, checked === true)}
              />
              <label
                htmlFor={`fmea-${fmea.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {fmea.name} ({fmea.asset_type})
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => clearSelectedFMEAs()}>
            Clear Selection
          </Button>
          <Button onClick={handleCompare}>Compare Selected</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
