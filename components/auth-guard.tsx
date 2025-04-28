"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // This effect runs only on the client after hydration
  useEffect(() => {
    setIsClient(true)

    // Check if environment variables are available
    if (typeof window !== "undefined") {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setAuthError("Authentication service configuration is missing. Please check your environment variables.")
      }
    }
  }, [])

  // Only redirect after we've checked authentication status and we're on the client
  useEffect(() => {
    if (isClient && !isLoading && !user && !authError) {
      router.push("/auth/signin")
    }
  }, [user, isLoading, router, isClient, authError])

  // Don't render anything during SSR to avoid hydration mismatches
  if (!isClient) {
    return null
  }

  // Show error if authentication service is not configured
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/")} className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show loading while redirecting
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  // If authenticated, render children
  return <>{children}</>
}
