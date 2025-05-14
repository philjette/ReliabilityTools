import { createClient } from "@supabase/supabase-js"
import { ENV } from "./env"

// Store client instance
let supabaseInstance: ReturnType<typeof createClient> | null = null
let initializationAttempts = 0
const MAX_INITIALIZATION_ATTEMPTS = 5
let lastError: Error | null = null
let initializationInProgress = false
let isInitialized = false

// Add initialization status tracking
export const getSupabaseStatus = () => ({
  isInitialized,
  initializationAttempts,
  lastError: lastError ? lastError.message : null,
  inProgress: initializationInProgress,
})

/**
 * Creates and returns a Supabase client for browser environments
 */
export function getSupabaseClient() {
  // Only run on the client side
  if (typeof window === "undefined") {
    console.warn("[Supabase] Attempted to initialize client on server side")
    return null
  }

  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Don't attempt if already at max attempts
  if (initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS) {
    console.error(`[Supabase] Max initialization attempts (${MAX_INITIALIZATION_ATTEMPTS}) reached. Giving up.`)
    return null
  }

  // Prevent concurrent initialization
  if (initializationInProgress) {
    console.warn("[Supabase] Initialization already in progress, wait for completion")
    return null
  }

  initializationInProgress = true
  initializationAttempts++

  try {
    // Get environment variables from our ENV object which includes fallbacks
    const supabaseUrl = ENV.SUPABASE_URL
    const supabaseAnonKey = ENV.SUPABASE_ANON_KEY

    // Log detailed information for debugging
    console.log(`[Supabase] Initialization attempt ${initializationAttempts}:`, {
      urlAvailable: !!supabaseUrl,
      keyAvailable: !!supabaseAnonKey,
      urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : "undefined",
      keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : "undefined",
      usingFallbacks: !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })

    // Validate environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      const error = new Error(
        `Supabase URL or Anonymous Key is missing. URL: ${!!supabaseUrl}, KEY: ${!!supabaseAnonKey}`,
      )
      lastError = error
      console.error(`[Supabase] ${error.message}`)
      initializationInProgress = false
      return null
    }

    // Validate URL format
    try {
      new URL(supabaseUrl)
    } catch (e) {
      lastError = new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
      console.error(`[Supabase] ${lastError.message}`)
      initializationInProgress = false
      return null
    }

    // Create client
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })

    // Test the client
    supabaseInstance.auth
      .getSession()
      .then(() => {
        console.log("[Supabase] Client initialized and successfully tested")
        isInitialized = true
      })
      .catch((error) => {
        console.error("[Supabase] Client test failed after initialization:", error)
        lastError = error
      })
      .finally(() => {
        initializationInProgress = false
      })

    return supabaseInstance
  } catch (error) {
    const typedError = error as Error
    console.error("[Supabase] Error during initialization:", typedError)
    lastError = typedError
    initializationInProgress = false
    return null
  }
}

/**
 * Resets the Supabase client and forces reinitialization
 */
export function retrySupabaseInitialization() {
  if (initializationInProgress) {
    console.warn("[Supabase] Cannot retry while initialization is in progress")
    return null
  }

  console.log("[Supabase] Forcing reinitialization")

  // Reset instance and state
  supabaseInstance = null
  isInitialized = false

  // Don't reset attempt counter completely, but give it another chance
  if (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
    // Give it another chance
  } else {
    // Reset attempt counter if at max
    initializationAttempts = 0
  }

  // Attempt initialization again
  return getSupabaseClient()
}

// For backward compatibility - only used on client side
export const supabase = typeof window !== "undefined" ? getSupabaseClient() : null
