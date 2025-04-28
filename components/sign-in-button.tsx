"use client"

import { useState } from "react"
import { LogIn, RefreshCw, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button, type ButtonProps } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SignInButtonProps extends ButtonProps {
  showIcon?: boolean
}

export function SignInButton({ showIcon = true, children, ...props }: SignInButtonProps) {
  const { signInWithGoogle, retryAuth, supabaseStatus } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Update the handleSignIn function to add more logging and error handling
  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("[SignInButton] Starting Google sign-in process...")

      // Check if Supabase is initialized first
      if (!supabaseStatus.isInitialized) {
        setError("Authentication service is not initialized. Please try retrying initialization.")
        setIsLoading(false)
        return
      }

      // Explicitly call the Google sign-in method
      const { error, url } = await signInWithGoogle()

      if (error) {
        console.error("[SignInButton] Sign-in error:", error)
        setError(error.message)

        // If the error is about Supabase not being initialized, offer to retry
        if (
          error.message.includes("not initialized") ||
          error.message.includes("not available") ||
          error.message.includes("not responding")
        ) {
          // Error is already set above
          return
        }

        throw error
      }

      // If we have a URL, we're being redirected to Google's OAuth page
      if (url) {
        console.log("[SignInButton] Redirecting to Google OAuth:", url)
        // Explicitly redirect to the URL
        window.location.href = url
      } else {
        // If no URL is returned, something went wrong
        setError("No redirect URL was returned. Please try again.")
      }
    } catch (error) {
      console.error("[SignInButton] Error signing in with Google:", error)
      setError(error instanceof Error ? error.message : "Failed to sign in with Google. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryAuth = async () => {
    setIsRetrying(true)
    setError(null)
    try {
      const success = await retryAuth()

      if (success) {
        toast({
          title: "Authentication service initialized",
          description: "You can now try signing in again.",
        })
      } else {
        setError("Failed to initialize authentication service. Check console for details.")
      }
    } catch (e) {
      setError(`Error during retry: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setIsRetrying(false)
    }
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="space-y-2">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button onClick={handleRetryAuth} disabled={isRetrying} variant="outline" size="sm" className="flex-1">
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Authentication
              </>
            )}
          </Button>
          <Button onClick={() => setError(null)} size="sm" variant="ghost">
            Dismiss
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button onClick={handleSignIn} disabled={isLoading || isRetrying} {...props}>
      {isLoading ? (
        "Signing in..."
      ) : isRetrying ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Retrying...
        </>
      ) : (
        <>
          {showIcon && <LogIn className="mr-2 h-4 w-4" />}
          {children || "Sign in with Google"}
        </>
      )}
    </Button>
  )
}
