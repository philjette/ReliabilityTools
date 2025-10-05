"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { User, AuthResponse } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase-client"

interface SignUpResult {
  error?: string
  data?: AuthResponse["data"]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)

      // Get initial session
      client.auth
        .getSession()
        .then(({ data: { session }, error: sessionError }) => {
          console.log("Initial session check:", { 
            hasSession: !!session, 
            userId: session?.user?.id, 
            email: session?.user?.email,
            error: sessionError?.message 
          })
          if (sessionError) {
            console.error("Session error:", sessionError)
            setError(sessionError.message)
          }
          setUser(session?.user ?? null)
          setLoading(false)
        })
        .catch((err) => {
          console.error("Error getting session:", err)
          setError(err.message || "Failed to initialize authentication")
          setLoading(false)
        })

      // Listen for auth changes
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((event, session) => {
        console.log("Auth state change:", { event, user: session?.user?.id, email: session?.user?.email })
        setUser(session?.user ?? null)
        setLoading(false)
      })

      // Check for auth success parameter and manually refresh session
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('auth') === 'success') {
        console.log("Auth success detected in context, manually refreshing session...")
        // Manually refresh the session
        client.auth.getSession().then(({ data: { session }, error }) => {
          console.log("Manual session refresh:", { 
            hasSession: !!session, 
            userId: session?.user?.id, 
            email: session?.user?.email,
            error: error?.message 
          })
          setUser(session?.user ?? null)
          setLoading(false)
        })
      }

      return () => subscription.unsubscribe()
    } catch (err: any) {
      console.error("Error initializing auth:", err)
      setError(err.message || "Failed to initialize authentication")
      setLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      if (!supabase) return { error: "Authentication not initialized" }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) return { error: signInError.message }
      return {}
    } catch (err: any) {
      console.error("Sign in error:", err)
      return { error: err.message || "An unexpected error occurred" }
    }
  }

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    try {
      if (!supabase) return { error: "Authentication not initialized" }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        console.error("Sign up error:", signUpError)
        return { error: signUpError.message }
      }

      // Return the full response data so we can check if email confirmation is needed
      return { data }
    } catch (err: any) {
      console.error("Sign up error:", err)
      return { error: err.message || "An unexpected error occurred" }
    }
  }

  const signInWithGoogle = async () => {
    try {
      if (!supabase) return { error: "Authentication not initialized" }
      
      console.log("Starting Google OAuth sign-in...")
      console.log("Redirect URL:", `${window.location.origin}/auth/callback`)
      
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (oauthError) {
        console.error("Google OAuth error:", oauthError)
        return { error: oauthError.message }
      }
      
      console.log("Google OAuth initiated successfully")
      return {}
    } catch (err: any) {
      console.error("Google sign in error:", err)
      return { error: err.message || "An unexpected error occurred" }
    }
  }

  const signOut = async () => {
    try {
      if (!supabase) return
      await supabase.auth.signOut()
    } catch (err: any) {
      console.error("Sign out error:", err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
