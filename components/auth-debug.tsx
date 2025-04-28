"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export function AuthDebug() {
  const { user, session, isLoading, retryAuth, supabaseStatus } = useAuth()
  const [showDebug, setShowDebug] = useState(false)
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [isRetrying, setIsRetrying] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({
    connection: null,
    session: null,
    oauth: null,
  })
  const { toast } = useToast()

  // Support function to check environment variables
  const checkEnvVars = () => {
    setEnvVars({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set (hidden)" : "Not set",
    })
  }

  // Function to test Supabase connection
  const testSupabaseConnection = async () => {
    const supabase = getSupabaseClient()
    setTestResults((prev) => ({ ...prev, connection: null }))

    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase client not initialized",
        variant: "destructive",
      })
      setTestResults((prev) => ({ ...prev, connection: false }))
      return
    }

    try {
      // Try a simple operation - get session
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Supabase connection test failed:", error)
        toast({
          title: "Connection Failed",
          description: error.message,
          variant: "destructive",
        })
        setTestResults((prev) => ({ ...prev, connection: false }))
      } else {
        console.log("Supabase connection successful:", data)
        toast({
          title: "Connection Successful",
          description: "Connected to Supabase successfully",
        })
        setTestResults((prev) => ({ ...prev, connection: true, session: !!data.session }))
      }
    } catch (error) {
      console.error("Supabase connection test exception:", error)
      toast({
        title: "Connection Error",
        description: String(error),
        variant: "destructive",
      })
      setTestResults((prev) => ({ ...prev, connection: false }))
    }
  }

  // Function to check Google OAuth configuration
  const testGoogleAuth = async () => {
    const supabase = getSupabaseClient()
    setTestResults((prev) => ({ ...prev, oauth: null }))

    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase client not initialized",
        variant: "destructive",
      })
      setTestResults((prev) => ({ ...prev, oauth: false }))
      return
    }

    try {
      // Try to generate a sign-in URL but don't redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      })

      if (error) {
        console.error("Google OAuth test failed:", error)
        toast({
          title: "OAuth Configuration Failed",
          description: error.message,
          variant: "destructive",
        })
        setTestResults((prev) => ({ ...prev, oauth: false }))
      } else if (data && data.url) {
        console.log("Google OAuth URL generation successful")
        toast({
          title: "OAuth Configuration Successful",
          description: "Google sign-in URL generated successfully",
        })
        setTestResults((prev) => ({ ...prev, oauth: true }))
      } else {
        toast({
          title: "OAuth Configuration Issue",
          description: "No URL was generated but no error was returned",
          variant: "destructive",
        })
        setTestResults((prev) => ({ ...prev, oauth: false }))
      }
    } catch (error) {
      console.error("Google OAuth test exception:", error)
      toast({
        title: "OAuth Test Error",
        description: String(error),
        variant: "destructive",
      })
      setTestResults((prev) => ({ ...prev, oauth: false }))
    }
  }

  // Handle retry with enhanced feedback
  const handleRetryAuth = async () => {
    setIsRetrying(true)
    try {
      const success = await retryAuth()
      if (success) {
        // Run tests after successful retry
        await testSupabaseConnection()
      }
    } finally {
      setIsRetrying(false)
    }
  }

  useEffect(() => {
    // Check env vars once when debug panel is opened
    if (showDebug) {
      checkEnvVars()
    }
  }, [showDebug])

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setShowDebug(true)}>
          Debug Auth
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader>
          <CardTitle>Auth Debug</CardTitle>
          <CardDescription>Authentication debugging information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-semibold">Supabase Status:</p>
              <span
                className={`px-2 py-0.5 rounded ${supabaseStatus.isInitialized ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {supabaseStatus.isInitialized ? "Initialized" : "Not Initialized"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-semibold">Loading State:</p>
              <span>{isLoading ? "Loading..." : "Completed"}</span>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-semibold">Authentication:</p>
              <span
                className={`px-2 py-0.5 rounded ${user ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
              >
                {user ? "Authenticated" : "Not authenticated"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-semibold">Session:</p>
              <span>{session ? "Active" : "None"}</span>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-semibold">Init Attempts:</p>
              <span>{supabaseStatus.initializationAttempts}</span>
            </div>
            {supabaseStatus.inProgress && (
              <div className="flex items-center justify-center">
                <span className="text-blue-600 flex items-center">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Initialization in progress...
                </span>
              </div>
            )}
          </div>

          {testResults.connection !== null && (
            <div className="bg-muted p-2 rounded space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Connection Test:</span>
                {testResults.connection === null ? (
                  <span>Pending...</span>
                ) : testResults.connection ? (
                  <span className="text-green-600 flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Successful
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center">
                    <XCircle className="h-3 w-3 mr-1" /> Failed
                  </span>
                )}
              </div>

              {testResults.session !== null && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Session Test:</span>
                  {testResults.session ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                    </span>
                  ) : (
                    <span className="text-yellow-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" /> No session
                    </span>
                  )}
                </div>
              )}

              {testResults.oauth !== null && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold">OAuth Config:</span>
                  {testResults.oauth ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Working
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <XCircle className="h-3 w-3 mr-1" /> Issues
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {supabaseStatus.lastError && (
            <Alert variant="destructive" className="text-xs p-3">
              <AlertCircle className="h-3 w-3" />
              <AlertTitle className="text-xs">Last Error</AlertTitle>
              <AlertDescription className="text-xs break-all">{supabaseStatus.lastError}</AlertDescription>
            </Alert>
          )}

          {Object.keys(envVars).length > 0 && (
            <div className="bg-muted p-2 rounded">
              <p className="font-semibold">Environment Variables:</p>
              <div className="space-y-1 mt-1">
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}:</span>
                    <span className={value === "Not set" ? "text-red-500" : "text-green-500"}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <p className="font-semibold">Tests:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={testSupabaseConnection} className="text-xs h-7">
                Test Connection
              </Button>
              <Button size="sm" onClick={testGoogleAuth} className="text-xs h-7">
                Test OAuth Config
              </Button>
              <Button size="sm" variant="outline" onClick={checkEnvVars} className="text-xs h-7 col-span-2">
                Check Environment
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryAuth}
              disabled={isRetrying}
              className="w-full text-xs"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry Auth Initialization
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" onClick={() => setShowDebug(false)} className="w-full">
            Close Debug
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
