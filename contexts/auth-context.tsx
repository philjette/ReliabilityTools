"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient, retrySupabaseInitialization, getSupabaseStatus } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signInWithGoogle: () => Promise<{ error?: Error; url?: string }>
  signOut: () => Promise<void>
  retryAuth: () => Promise<boolean>
  supabaseStatus: ReturnType<typeof getSupabaseStatus>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseClient> | null>(null)
  const [supabaseStatus, setSupabaseStatus] = useState(getSupabaseStatus())
  const { toast } = useToast()

  // Update status periodically to reflect changes
  useEffect(() => {
    const interval = setInterval(() => {
      setSupabaseStatus(getSupabaseStatus())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Initialize Supabase client on the client side only
  useEffect(() => {
    // This will only run in the browser
    if (typeof window !== "undefined") {
      try {
        const supabaseClient = getSupabaseClient()
        setSupabase(supabaseClient)

        if (!supabaseClient) {
          console.error("[AuthContext] Failed to initialize Supabase client - client is null")
          setIsLoading(false)
        }
      } catch (error) {
        console.error("[AuthContext] Failed to initialize Supabase client:", error)
        setIsLoading(false)
      }
    }
  }, [])

  // Set up auth state listener once Supabase client is available
  useEffect(() => {
    if (!supabase) {
      // If Supabase client is not available, we can't check auth state
      if (typeof window !== "undefined") {
        console.log("[AuthContext] Supabase client not available, skipping auth check")
      }
      return
    }

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        console.log("[AuthContext] Initial session check:", session ? "Session found" : "No session")
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error("[AuthContext] Error getting session:", error)
        setIsLoading(false)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[AuthContext] Auth state changed:", _event, session ? "Session exists" : "No session")
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Function to retry authentication initialization with promise
  const retryAuth = async (): Promise<boolean> => {
    setIsLoading(true)

    try {
      console.log("[AuthContext] Attempting to reinitialize Supabase client")
      const client = retrySupabaseInitialization()

      if (!client) {
        toast({
          title: "Authentication Error",
          description: "Failed to initialize authentication service. Please check console for details.",
          variant: "destructive",
        })
        return false
      }

      setSupabase(client)

      // Test the client with a basic operation
      const { error } = await client.auth.getSession()

      if (error) {
        console.error("[AuthContext] Error testing auth service after retry:", error)
        toast({
          title: "Authentication Error",
          description: `Failed to connect to authentication service: ${error.message}`,
          variant: "destructive",
        })
        return false
      }

      toast({
        title: "Authentication Service Restored",
        description: "Successfully reconnected to authentication service.",
      })

      return true
    } catch (error) {
      console.error("[AuthContext] Error in retryAuth:", error)
      toast({
        title: "Authentication Error",
        description: `Failed to reinitialize: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
      setSupabaseStatus(getSupabaseStatus())
    }
  }

  // Update the signInWithGoogle function to add more logging and error handling
  const signInWithGoogle = async (): Promise<{ error?: Error; url?: string }> => {
    try {
      if (!supabase) {
        console.error("[AuthContext] Supabase client not initialized")
        return {
          error: new Error("Authentication service not available. Please try again later."),
        }
      }

      console.log("[AuthContext] Initiating Google sign-in...")

      // Check if Supabase URL and anon key are set
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("[AuthContext] Supabase environment variables are not set")
        return {
          error: new Error("Authentication configuration is missing. Please check your environment variables."),
        }
      }

      // Test Supabase connection first to verify client is working
      try {
        const { error: testError } = await supabase.auth.getSession()
        if (testError) {
          console.error("[AuthContext] Supabase connection test failed:", testError)
          return {
            error: new Error(`Authentication service not responding: ${testError.message}`),
          }
        }
      } catch (testError) {
        console.error("[AuthContext] Supabase connection test exception:", testError)
        return {
          error: new Error(`Authentication service not responding: ${String(testError)}`),
        }
      }

      // Get the current origin for the redirect URL
      const redirectTo = `${window.location.origin}/auth/callback`
      console.log("[AuthContext] Redirect URL:", redirectTo)

      // Explicitly use Google as the provider
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            // Request refresh token to enable session refresh
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("[AuthContext] Supabase OAuth error:", error)
        return { error }
      }

      console.log("[AuthContext] Sign-in initiated, redirect data:", data)

      // Return the URL that the user should be redirected to
      return { url: data.url }
    } catch (error) {
      console.error("[AuthContext] Failed to sign in with Google:", error)
      return {
        error: error instanceof Error ? error : new Error("Failed to initiate sign-in process. Please try again."),
      }
    }
  }

  const signOut = async () => {
    try {
      if (!supabase) {
        throw new Error("Authentication service not available")
      }

      await supabase.auth.signOut()
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
    } catch (error) {
      console.error("[AuthContext] Error signing out:", error)
      toast({
        title: "Sign-out Error",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Provide values
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithGoogle,
        signOut,
        retryAuth,
        supabaseStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
