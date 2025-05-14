// Environment variables with fallbacks
export const ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yneznljakdqyhkrnqors.supabase.co",
  SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZXpubGpha2RxeWhrcm5xb3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxOTAyODEsImV4cCI6MjA2MDc2NjI4MX0.S0h6MkumdvBL0nqg0Xb9oaZxlFRCD_-uSUsU1l4ep2Y",
}

// Add this console log to help debug
console.log("ENV loaded:", {
  SUPABASE_URL_EXISTS: !!ENV.SUPABASE_URL,
  SUPABASE_KEY_EXISTS: !!ENV.SUPABASE_ANON_KEY,
  SUPABASE_URL_LENGTH: ENV.SUPABASE_URL?.length,
  SUPABASE_KEY_LENGTH: ENV.SUPABASE_ANON_KEY?.length,
})
