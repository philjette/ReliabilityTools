"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Check, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAppContext } from "@/contexts/AppContext"
import { Badge } from "@/components/ui/badge"

interface CompareFMEAsButtonProps {
  fmeas: any[]
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
}

export function CompareFMEAsButton({ fmeas, variant = "default" }: CompareFMEAsButtonProps) {
  const router = useRouter()
  const { selectedFMEAs, addSelectedFMEA, removeSelectedFMEA, clearSelectedFMEAs, isSelected } = useAppContext()
  const [isOpen, setIsOpen] = useState(false)

  const handleCompare = () => {
    if (selectedFMEAs.length >= 2) {
      router.push("/dashboard/compare")
    }
  }

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant={variant} className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Select FMEAs
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {fmeas.length > 0 ? (
              fmeas.map((fmea) => (
                <DropdownMenuItem
                  key={fmea.id}
                  className="flex items-center justify-between"
                  onSelect={(e) => {
                    e.preventDefault()
                    if (isSelected(fmea.id)) {
                      removeSelectedFMEA(fmea.id)
                    } else {
                      addSelectedFMEA(fmea)
                    }
                  }}
                >
                  <div className="truncate">{fmea.title}</div>
                  {isSelected(fmea.id) ? <Check className="h-4 w-4 text-primary" /> : <div className="h-4 w-4" />}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">No FMEAs available</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="default"
          onClick={handleCompare}
          disabled={selectedFMEAs.length < 2}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Compare ({selectedFMEAs.length})
        </Button>
      </div>

      {selectedFMEAs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedFMEAs.map((fmea) => (
            <Badge key={fmea.id} variant="outline" className="flex items-center gap-1">
              {fmea.title}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeSelectedFMEA(fmea.id)} />
            </Badge>
          ))}
          <Badge variant="outline" className="cursor-pointer" onClick={clearSelectedFMEAs}>
            Clear all
          </Badge>
        </div>
      )}
    </div>
  )
}
