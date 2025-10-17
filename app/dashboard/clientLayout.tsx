"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: isLoading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Log authentication status for debugging
    console.log("Dashboard ClientLayout - Auth status:", {
      isLoading,
      isAuthenticated: !!user,
      userId: user?.id,
      email: user?.email,
    })
  }, [user, isLoading])

  // Redirect if not authenticated after loading completes
  useEffect(() => {
    if (isClient && !isLoading && !user) {
      console.log("Dashboard ClientLayout - Redirecting to sign in")
      router.push("/auth/signin")
    }
  }, [isClient, isLoading, user, router])

  // Show loading state while checking authentication
  if (isLoading || !isClient) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header activePath="/dashboard" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // If not authenticated, show nothing (will redirect)
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header activePath="/dashboard" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // If authenticated, render children
  return <>{children}</>
}
