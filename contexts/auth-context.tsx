"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient, getSupabaseStatus } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: Error | null
  supabaseClient: ReturnType<typeof getSupabaseClient>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  supabaseStatus: ReturnType<typeof getSupabaseStatus>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof getSupabaseClient>>(null)
  const [supabaseStatus, setSupabaseStatus] = useState(getSupabaseStatus())
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  // Initialize Supabase client
  useEffect(() => {
    if (typeof window === "undefined") return

    const initializeSupabase = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get Supabase client
        const client = getSupabaseClient()
        setSupabaseClient(client)
        setSupabaseStatus(getSupabaseStatus())

        if (!client) {
          throw new Error("Failed to initialize Supabase client")
        }

        // Get session
        const { data, error } = await client.auth.getSession()

        if (error) {
          throw error
        }

        setSession(data.session)
        setUser(data.session?.user || null)

        // Set up auth state change listener
        const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
          setSession(session)
          setUser(session?.user || null)
        })

        return () => {
          authListener.subscription.unsubscribe()
        }
      } catch (err) {
        console.error("Error initializing auth:", err)
        setError(err instanceof Error ? err : new Error("Unknown error during auth initialization"))

        // Retry logic
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying auth initialization (${retryCount + 1}/${MAX_RETRIES})...`)
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
          }, 1000) // Retry after 1 second
        }
      } finally {
        setIsLoading(false)
      }
    }

    initializeSupabase()
  }, [retryCount])

  // Update Supabase status periodically
  useEffect(() => {
    if (typeof window === "undefined") return

    const interval = setInterval(() => {
      setSupabaseStatus(getSupabaseStatus())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const signOut = async () => {
    if (!supabaseClient) return
    await supabaseClient.auth.signOut()
  }

  const refreshSession = async () => {
    if (!supabaseClient) return

    try {
      setIsLoading(true)
      const { data, error } = await supabaseClient.auth.getSession()

      if (error) {
        throw error
      }

      setSession(data.session)
      setUser(data.session?.user || null)
    } catch (err) {
      console.error("Error refreshing session:", err)
      setError(err instanceof Error ? err : new Error("Unknown error during session refresh"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        error,
        supabaseClient,
        signOut,
        refreshSession,
        supabaseStatus,
      }}
    >
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
