"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Copy, Download } from "lucide-react"
import { ENV } from "@/lib/env"

export function EnvSetupHelper() {
  const [showHelper, setShowHelper] = useState(false)
  const [copied, setCopied] = useState(false)

  const envFileContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${ENV.SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ENV.SUPABASE_ANON_KEY}
`

  const handleCopy = () => {
    navigator.clipboard.writeText(envFileContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([envFileContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = ".env.local"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!showHelper) {
    return (
      <div className="fixed bottom-36 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setShowHelper(true)}>
          Setup Env
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-36 right-4 z-50 w-96">
      <Card>
        <CardHeader>
          <CardTitle>Environment Setup Helper</CardTitle>
          <CardDescription>
            Create a .env.local file with these values to fix the Supabase connection error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Environment Variables Missing</AlertTitle>
            <AlertDescription>
              Your app is missing required Supabase environment variables. Follow the steps below to fix this.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              1. Create a file named <code>.env.local</code> in your project root
            </p>
            <p className="text-sm font-medium">2. Copy and paste the following content:</p>
            <Textarea value={envFileContent} readOnly className="font-mono text-xs h-24" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCopy} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
              <Button size="sm" onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download .env.local
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">3. Restart your development server</p>
            <p className="text-xs text-muted-foreground">
              After creating the .env.local file, restart your Next.js development server for the changes to take
              effect.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" onClick={() => setShowHelper(false)} className="w-full">
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
