"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function AuthStatusChecker() {
  const { user, session, supabaseClient, refreshSession } = useAuth()
  const { toast } = useToast()
  const [isChecking, setIsChecking] = useState(false)

  const checkAuthStatus = async () => {
    setIsChecking(true)
    try {
      if (!supabaseClient) {
        toast({
          title: "Error",
          description: "Supabase client not initialized",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabaseClient.auth.getSession()

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (!data.session) {
        toast({
          title: "Not Authenticated",
          description: "You are not currently signed in",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Authenticated",
        description: `Signed in as ${data.session.user.email}`,
      })

      // Refresh the session in the auth context
      await refreshSession()
    } catch (error) {
      console.error("Error checking auth status:", error)
      toast({
        title: "Error",
        description: "Failed to check authentication status",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={checkAuthStatus}
      disabled={isChecking}
      className="fixed bottom-4 right-4 z-50"
    >
      {isChecking ? "Checking..." : "Check Auth"}
    </Button>
  )
}
