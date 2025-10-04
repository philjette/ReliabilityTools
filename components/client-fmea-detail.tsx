"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SavedFMEAView } from "@/components/saved-fmea-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSupabase } from "@/hooks/use-supabase"
import { useAuth } from "@/contexts/auth-context"

interface ClientFMEADetailProps {
  fmeaId: string
}

export function ClientFMEADetail({ fmeaId }: ClientFMEADetailProps) {
  const [fmea, setFmea] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase, loading: supabaseLoading } = useSupabase()
  const { user: authUser, loading: authLoading } = useAuth()
  const router = useRouter()

  console.log("ClientFMEADetail mounted with fmeaId:", fmeaId)
  console.log("Auth status:", { authUser: !!authUser, authLoading, supabaseLoading })

  useEffect(() => {
    const fetchFMEA = async () => {
      if (!supabase) return

      try {
        setLoading(true)
        setError(null)

        console.log("Fetching FMEA with auth user:", authUser?.id)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.log("No user found in Supabase session")
          setError("You must be signed in to view FMEAs")
          return
        }

        console.log("Supabase user found:", user.id)

        const { data, error } = await supabase
          .from("fmeas")
          .select("*")
          .eq("id", fmeaId)
          .eq("user_id", user.id)
          .single()

        if (error) {
          setError(error.message)
          console.error("Error fetching FMEA:", error)
        } else if (!data) {
          setError("FMEA not found")
        } else {
          setFmea(data)
          console.log("Fetched FMEA:", data)
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch FMEA")
        console.error("Error fetching FMEA:", err)
      } finally {
        setLoading(false)
      }
    }

    // Wait for both Supabase and auth context to be ready
    if (!supabaseLoading && !authLoading && supabase && authUser) {
      fetchFMEA()
    } else if (!authLoading && !authUser) {
      // If auth is loaded but no user, show error
      setError("You must be signed in to view FMEAs")
      setLoading(false)
    }
  }, [supabase, supabaseLoading, authUser, authLoading, fmeaId])

  if (supabaseLoading || authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading FMEA...</span>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle>Error Loading FMEA</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline">Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  if (!fmea) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle>FMEA Not Found</CardTitle>
              <CardDescription>The requested FMEA could not be found.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline">Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <SavedFMEAView fmea={fmea} />
      <Footer />
    </div>
  )
}
