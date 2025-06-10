"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { testCurrentUser } from "@/lib/test-auth"

export function TestAuthButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleTest = async () => {
    setIsLoading(true)
    try {
      const result = await testCurrentUser()

      console.log("Auth test result:", result)

      if (result.error) {
        toast({
          title: "Authentication Issue",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Authentication Success",
          description: `User: ${result.sessionUser?.email} (ID: ${result.sessionUser?.id})`,
        })
      }
    } catch (error) {
      console.error("Test auth error:", error)
      toast({
        title: "Test Failed",
        description: "Failed to test authentication",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleTest} disabled={isLoading} variant="outline" size="sm">
      {isLoading ? "Testing..." : "Test Auth"}
    </Button>
  )
}
