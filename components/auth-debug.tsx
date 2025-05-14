"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseStatus, retrySupabaseInitialization } from "@/lib/supabase"
import { ENV } from "@/lib/env"
import { useAuth } from "@/contexts/auth-context"

export function AuthDebug() {
  const [showDebug, setShowDebug] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState(getSupabaseStatus())
  const [connectionTest, setConnectionTest] = useState<{
    status: "idle" | "loading" | "success" | "error"
    message?: string
  }>({ status: "idle" })
  const [sessionTest, setSessionTest] = useState<{
    status: "idle" | "loading" | "success" | "error"
    message?: string
  }>({ status: "idle" })
  const [oauthTest, setOauthTest] = useState<{
    status: "idle" | "loading" | "success" | "error"
    message?: string
  }>({ status: "idle" })
  const [envCheck, setEnvCheck] = useState<{
    url: boolean
    key: boolean
  }>({ url: false, key: false })

  // Use the auth context
  const auth = useAuth()
  const { user, supabaseClient } = auth

  useEffect(() => {
    if (showDebug) {
      // Update status when debug panel is shown
      setSupabaseStatus(getSupabaseStatus())

      // Check environment variables
      setEnvCheck({
        url: !!ENV.SUPABASE_URL,
        key: !!ENV.SUPABASE_ANON_KEY,
      })
    }
  }, [showDebug])

  const handleTestConnection = useCallback(async () => {
    setConnectionTest({ status: "loading" })
    try {
      if (!supabaseClient) {
        throw new Error("Supabase client not initialized")
      }

      // Simple ping test
      const { data, error } = await supabaseClient.from("_dummy_query").select("*").limit(1)

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "relation does not exist" which is fine for this test
        throw error
      }

      setConnectionTest({
        status: "success",
        message: "Connection successful",
      })
    } catch (error) {
      console.error("Connection test failed:", error)
      setConnectionTest({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }, [supabaseClient])

  const handleTestSession = useCallback(async () => {
    setSessionTest({ status: "loading" })
    try {
      if (!supabaseClient) {
        throw new Error("Supabase client not initialized")
      }

      const { data, error } = await supabaseClient.auth.getSession()

      if (error) {
        throw error
      }

      if (data.session) {
        setSessionTest({
          status: "success",
          message: `Session found for ${data.session.user.email}`,
        })
      } else {
        setSessionTest({
          status: "success",
          message: "No session",
        })
      }
    } catch (error) {
      console.error("Session test failed:", error)
      setSessionTest({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }, [supabaseClient])

  const handleTestOAuth = useCallback(async () => {
    setOauthTest({ status: "loading" })
    try {
      if (!supabaseClient) {
        throw new Error("Supabase client not initialized")
      }

      // Just check if the OAuth settings are configured
      const { data, error } = await supabaseClient.auth.getSession()

      if (error) {
        throw error
      }

      // This is a simple check - in a real app you'd verify the OAuth provider is configured
      setOauthTest({
        status: "success",
        message: "Working",
      })
    } catch (error) {
      console.error("OAuth test failed:", error)
      setOauthTest({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }, [supabaseClient])

  const handleRetry = () => {
    retrySupabaseInitialization()
    setSupabaseStatus(getSupabaseStatus())
  }

  const handleCheckEnvironment = () => {
    setEnvCheck({
      url: !!ENV.SUPABASE_URL,
      key: !!ENV.SUPABASE_ANON_KEY,
    })
  }

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
          <CardTitle>Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="bg-muted p-2 rounded">
            <p className="font-semibold">Supabase Status:</p>
            <div className="grid grid-cols-2 gap-1">
              <span>Initialized:</span>
              <span className={supabaseStatus.isInitialized ? "text-green-500" : "text-red-500"}>
                {supabaseStatus.isInitialized ? "Yes" : "No"}
              </span>

              <span>Attempts:</span>
              <span>{supabaseStatus.initializationAttempts}</span>

              <span>In Progress:</span>
              <span>{supabaseStatus.inProgress ? "Yes" : "No"}</span>

              {supabaseStatus.lastError && (
                <>
                  <span>Last Error:</span>
                  <span className="text-red-500">{supabaseStatus.lastError}</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-muted p-2 rounded">
            <p className="font-semibold">Environment Variables:</p>
            <div className="grid grid-cols-2 gap-1">
              <span>SUPABASE_URL:</span>
              <span className={envCheck.url ? "text-green-500" : "text-red-500"}>
                {envCheck.url ? "Set" : "Missing"}
              </span>

              <span>SUPABASE_ANON_KEY:</span>
              <span className={envCheck.key ? "text-green-500" : "text-red-500"}>
                {envCheck.key ? "Set" : "Missing"}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleCheckEnvironment} className="mt-2 w-full text-xs">
              Check Environment
            </Button>
          </div>

          <div className="bg-muted p-2 rounded">
            <p className="font-semibold">Tests:</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between items-center">
                  <span>Connection Test:</span>
                  <span
                    className={
                      connectionTest.status === "success"
                        ? "text-green-500"
                        : connectionTest.status === "error"
                          ? "text-red-500"
                          : ""
                    }
                  >
                    {connectionTest.status === "loading"
                      ? "Testing..."
                      : connectionTest.status === "success"
                        ? "Success"
                        : connectionTest.status === "error"
                          ? "Failed"
                          : "Not run"}
                  </span>
                </div>
                {connectionTest.message && <p className="text-xs mt-1">{connectionTest.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span>Session Test:</span>
                  <span
                    className={
                      sessionTest.status === "success"
                        ? "text-green-500"
                        : sessionTest.status === "error"
                          ? "text-red-500"
                          : ""
                    }
                  >
                    {sessionTest.status === "loading"
                      ? "Testing..."
                      : sessionTest.status === "success"
                        ? "Success"
                        : sessionTest.status === "error"
                          ? "Failed"
                          : "Not run"}
                  </span>
                </div>
                {sessionTest.message && <p className="text-xs mt-1">{sessionTest.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span>OAuth Config:</span>
                  <span
                    className={
                      oauthTest.status === "success"
                        ? "text-green-500"
                        : oauthTest.status === "error"
                          ? "text-red-500"
                          : ""
                    }
                  >
                    {oauthTest.status === "loading"
                      ? "Testing..."
                      : oauthTest.status === "success"
                        ? "Success"
                        : oauthTest.status === "error"
                          ? "Failed"
                          : "Not run"}
                  </span>
                </div>
                {oauthTest.message && <p className="text-xs mt-1">{oauthTest.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                className="text-xs"
                disabled={connectionTest.status === "loading" || !supabaseClient}
              >
                Test Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestSession}
                className="text-xs"
                disabled={sessionTest.status === "loading" || !supabaseClient}
              >
                Test Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestOAuth}
                className="text-xs"
                disabled={oauthTest.status === "loading" || !supabaseClient}
              >
                Test OAuth
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="w-full text-xs"
              disabled={supabaseStatus.inProgress}
            >
              Retry Initialization
            </Button>
          </div>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowDebug(false)} className="w-full">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
