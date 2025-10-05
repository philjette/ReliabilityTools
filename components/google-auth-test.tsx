"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function GoogleAuthTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")
  const { signInWithGoogle } = useAuth()

  const testGoogleAuth = async () => {
    setLoading(true)
    setResult("Testing Google authentication...")
    
    try {
      console.log("Testing Google auth...")
      const result = await signInWithGoogle()
      
      if (result.error) {
        setResult(`Error: ${result.error}`)
      } else {
        setResult("Google auth initiated successfully - check browser for redirect")
      }
    } catch (error: any) {
      setResult(`Exception: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Google Auth Test</CardTitle>
        <CardDescription>Test Google authentication flow</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testGoogleAuth} disabled={loading} className="w-full">
          {loading ? "Testing..." : "Test Google Auth"}
        </Button>
        {result && (
          <div className="p-3 bg-gray-100 rounded text-sm">
            {result}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
