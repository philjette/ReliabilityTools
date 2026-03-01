"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

export default function DirectDashboard() {
  const [status, setStatus] = useState<string>("Checking authentication...")
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        setStatus("Initializing Supabase client...")

        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error("Supabase environment variables are not configured")
        }

        setStatus("Getting session...")
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (!data.session) {
          setStatus("No active session found")
          setError("You need to sign in to access the dashboard")
          return
        }

        setStatus("Session found, getting user...")
        setUser(data.session.user)

        // Wait a moment to show the success message
        setTimeout(() => {
          toast({
            title: "Authentication successful",
            description: `Logged in as ${data.session.user.email}`,
          })
          router.push("/dashboard/home")
        }, 1000)
      } catch (err) {
        console.error("Authentication error:", err)
        setError(err instanceof Error ? err.message : "Unknown authentication error")
        setStatus("Authentication failed")
      }
    }

    checkAuth()
  }, [router, toast, supabase.auth])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Direct Dashboard Access</h1>

        <div className="p-4 border rounded-lg">
          <h2 className="font-medium mb-2">Authentication Status</h2>
          <p className="text-sm mb-2">{status}</p>

          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {user ? (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">Authentication successful!</p>
              <p className="text-sm text-green-700">Logged in as: {user.email}</p>
              <div className="mt-2">
                <Button onClick={() => router.push("/dashboard/home")} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mt-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button variant="outline" onClick={() => router.push("/")} className="w-full">
            Return to Home
          </Button>
          <Button variant="outline" onClick={() => router.push("/auth/signin")} className="w-full">
            Go to Sign In
          </Button>
        </div>
      </div>
    </div>
  )
}
