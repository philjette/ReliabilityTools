"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  useEffect(() => {
    // Log the error for debugging
    if (error || errorDescription) {
      console.error("Auth error:", { error, errorDescription })
    }
  }, [error, errorDescription])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tighter mb-6">Authentication Error</h1>

          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Failed</AlertTitle>
            <AlertDescription>
              {errorDescription || error || "There was a problem with the authentication process."}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <p>We encountered an error while trying to authenticate you. This could be due to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Cancelled authentication process</li>
              <li>Google account permissions were denied</li>
              <li>Session token expired</li>
              <li>Technical issues with our authentication service</li>
            </ul>

            <div className="pt-4">
              <Button onClick={() => router.push("/")} className="mr-4">
                Return to Home
              </Button>
              <Button variant="outline" onClick={() => router.push("/generate")}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
