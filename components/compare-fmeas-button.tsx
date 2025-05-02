"use client"

import type { FMEA } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { useAppContext } from "@/context/AppContext"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart, Check, X } from "lucide-react"

interface CompareFMEAsButtonProps {
  fmea: FMEA
}

export function CompareFMEAsButton({ fmea }: CompareFMEAsButtonProps) {
  const { selectedFMEAs, toggleFMEA } = useAppContext()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleToggleFMEA = async (fmeaId: string) => {
    setIsLoading(true)
    await toggleFMEA(fmeaId)
    setIsLoading(false)
  }

  const handleCompare = () => {
    if (selectedFMEAs.length < 2) {
      toast({
        title: "Not enough FMEAs selected",
        description: "Please select at least two FMEAs to compare.",
      })
      return
    }

    router.push(`/compare`)
  }

  const isSelected = selectedFMEAs.includes(fmea.id)

  return (
    <button
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 data-[state=open]:bg-secondary hover:bg-secondary/80 bg-muted text-muted-foreground h-9 px-4 py-2"
      onClick={() => handleToggleFMEA(fmea.id)}
      disabled={isLoading}
    >
      {selectedFMEAs.length >= 2 && !isSelected ? (
        <X className="h-3 w-3 mr-2" />
      ) : (
        <BarChart className="h-4 w-4 mr-2" />
      )}
      {selectedFMEAs.includes(fmea.id) ? "Remove" : "Compare"}
      {selectedFMEAs.includes(fmea.id) && <Check className="h-3 w-3" />}
    </button>
  )
}
