"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function DebugAuthButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDebug = async () => {
    try {
      setIsLoading(true)

      // Simple debug without server action first
      console.log("Debug button clicked!")

      toast({
        title: "Debug Test",
        description: "Button is working! Check console for more details.",
      })
    } catch (error) {
      console.error("Debug error:", error)
      toast({
        title: "Debug Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleDebug} disabled={isLoading} variant="outline" size="sm">
      {isLoading ? "Testing..." : "🔧 Debug Auth"}
    </Button>
  )
}
