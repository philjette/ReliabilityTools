"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { retrySupabaseInitialization } from "@/lib/supabase"

export function SignInButton() {
  const { supabaseClient, isLoading, error, supabaseStatus } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  const handleSignIn = async () => {
    if (!supabaseClient) {
      // Try to reinitialize Supabase if not available
      const client = retrySupabaseInitialization()
      if (!client) {
        setSignInError("Failed to initialize authentication service. Please check console for details.")
        return
      }
    }

    try {
      setIsSigningIn(true)
      setSignInError(null)

      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (err) {
      console.error("Sign in error:", err)
      setSignInError(err instanceof Error ? err.message : "Failed to sign in")
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Button
        onClick={handleSignIn}
        disabled={isLoading || isSigningIn || !supabaseStatus.isInitialized}
        className="w-full"
      >
        {isSigningIn ? "Signing in..." : "Sign in with Google"}
      </Button>

      {signInError && <p className="text-red-500 text-sm mt-2">{signInError}</p>}

      {!supabaseStatus.isInitialized && !signInError && (
        <p className="text-amber-500 text-sm mt-2">Initializing authentication service...</p>
      )}
    </div>
  )
}
