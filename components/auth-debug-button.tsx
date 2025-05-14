"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

export function AuthDebugButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authData, setAuthData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const checkAuth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check Supabase configuration
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables are not configured")
      }

      // Get session
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      setAuthData({
        session: data.session,
        user: data.session?.user || null,
        env: {
          supabaseUrl: supabaseUrl.substring(0, 10) + "...",
          hasAnonKey: !!supabaseAnonKey,
        },
      })

      toast({
        title: data.session ? "Authentication successful" : "No active session",
        description: data.session ? `Logged in as ${data.session.user.email}` : "You are not currently signed in",
      })
    } catch (err) {
      console.error("Auth debug error:", err)
      setError(err instanceof Error ? err.message : "Unknown authentication error")

      toast({
        title: "Authentication error",
        description: err instanceof Error ? err.message : "Unknown authentication error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => {
            setIsOpen(true)
            checkAuth()
          }}
        >
          Check Authentication
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Authentication Debug</DialogTitle>
          <DialogDescription>Check your current authentication status</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-800">
              <p className="font-medium">Authentication Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : authData ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="font-medium">Environment</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <p className="text-muted-foreground">Supabase URL:</p>
                  <p>{authData.env.supabaseUrl}</p>
                  <p className="text-muted-foreground">Anon Key:</p>
                  <p>{authData.env.hasAnonKey ? "Configured" : "Missing"}</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="font-medium">Session</p>
                {authData.session ? (
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <p className="text-muted-foreground">Status:</p>
                    <p className="text-green-600">Active</p>
                    <p className="text-muted-foreground">Expires:</p>
                    <p>{new Date(authData.session.expires_at * 1000).toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-sm mt-2 text-amber-600">No active session</p>
                )}
              </div>

              {authData.user && (
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">User</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <p className="text-muted-foreground">ID:</p>
                    <p className="break-all">{authData.user.id}</p>
                    <p className="text-muted-foreground">Email:</p>
                    <p>{authData.user.email}</p>
                    <p className="text-muted-foreground">Last Sign In:</p>
                    <p>{new Date(authData.user.last_sign_in_at).toLocaleString()}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={checkAuth}>
                  Refresh
                </Button>
                <Button variant="default" asChild>
                  <a href="/direct-dashboard">Go to Dashboard</a>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
