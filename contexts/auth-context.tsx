"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase-client"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
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
      } = client.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

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

  const signUp = async (email: string, password: string) => {
    try {
      if (!supabase) return { error: "Authentication not initialized" }
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (signUpError) return { error: signUpError.message }
      return {}
    } catch (err: any) {
      console.error("Sign up error:", err)
      return { error: err.message || "An unexpected error occurred" }
    }
  }

  const signInWithGoogle = async () => {
    try {
      if (!supabase) return { error: "Authentication not initialized" }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (oauthError) return { error: oauthError.message }
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
