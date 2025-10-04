"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface EnvStatus {
  supabaseUrl: boolean
  supabaseKey: boolean
  openaiKey: boolean
}

export function EnvChecker() {
  const [status, setStatus] = useState<EnvStatus>({
    supabaseUrl: false,
    supabaseKey: false,
    openaiKey: false,
  })

  useEffect(() => {
    setStatus({
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      openaiKey: !!process.env.OPENAI_API_KEY,
    })
  }, [])

  const allConfigured = status.supabaseUrl && status.supabaseKey && status.openaiKey

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Environment Configuration Status</CardTitle>
        <CardDescription>Check if all required environment variables are set</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <EnvItem name="NEXT_PUBLIC_SUPABASE_URL" configured={status.supabaseUrl} description="Supabase project URL" />
          <EnvItem
            name="NEXT_PUBLIC_SUPABASE_ANON_KEY"
            configured={status.supabaseKey}
            description="Supabase anonymous key"
          />
          <EnvItem
            name="OPENAI_API_KEY"
            configured={status.openaiKey}
            description="OpenAI API key for FMEA generation"
          />
        </div>

        {!allConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some environment variables are missing. Please follow the setup instructions below.
            </AlertDescription>
          </Alert>
        )}

        {allConfigured && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All environment variables are configured correctly!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

function EnvItem({ name, configured, description }: { name: string; configured: boolean; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      {configured ? (
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
      )}
      <div className="flex-1">
        <div className="font-mono text-sm font-medium">{name}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </div>
  )
}
