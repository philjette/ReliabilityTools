"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

export function AuthStatusDebug() {
  const [debugResult, setDebugResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user, session, supabaseClient } = useAuth()

  const checkAuthStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/debug-auth-status")
      const result = await response.json()
      setDebugResult(result)
    } catch (error) {
      setDebugResult({ error: "Failed to check auth status" })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAuth = async () => {
    if (supabaseClient) {
      try {
        await supabaseClient.auth.refreshSession()
        alert("Session refreshed - try the debug again")
      } catch (error) {
        alert("Failed to refresh session")
      }
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={checkAuthStatus} disabled={isLoading}>
            {isLoading ? "Checking..." : "Check Auth Status"}
          </Button>
          <Button onClick={refreshAuth} variant="outline">
            Refresh Session
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Client-side Auth Context:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(
              {
                user: user ? { id: user.id, email: user.email } : null,
                hasSession: !!session,
                hasSupabaseClient: !!supabaseClient,
              },
              null,
              2,
            )}
          </pre>
        </div>

        {debugResult && (
          <div className="space-y-2">
            <h4 className="font-semibold">Server-side Debug Result:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
