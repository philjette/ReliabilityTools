// Environment variables with fallbacks
export const ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yneznljakdqyhkrnqors.supabase.co",
  SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZXpubGpha2RxeWhrcm5xb3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxOTAyODEsImV4cCI6MjA2MDc2NjI4MX0.S0h6MkumdvBL0nqg0Xb9oaZxlFRCD_-uSUsU1l4ep2Y",
}

// Function to check if environment variables are properly set
export function areEnvVarsSet(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

// Log environment variable status
if (typeof window !== "undefined") {
  console.log("[ENV] Environment variables status:", {
    areSet: areEnvVarsSet(),
    usingFallbacks: !areEnvVarsSet(),
    urlType: typeof process.env.NEXT_PUBLIC_SUPABASE_URL,
    keyType: typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
}
