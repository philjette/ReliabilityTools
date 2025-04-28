"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { checkEnvironmentVariables } from "@/lib/env-checker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function EnvDebug() {
  const [showDebug, setShowDebug] = useState(false)
  const [envCheck, setEnvCheck] = useState<ReturnType<typeof checkEnvironmentVariables> | null>(null)

  const runCheck = () => {
    setEnvCheck(checkEnvironmentVariables())
  }

  useEffect(() => {
    if (showDebug) {
      runCheck()
    }
  }, [showDebug])

  if (!showDebug) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setShowDebug(true)}>
          Debug Env
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-96">
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {envCheck && (
            <div className="space-y-4">
              <div className="bg-muted p-2 rounded">
                <p className="font-semibold">Environment:</p>
                <p>{envCheck.isServer ? "Server-side" : "Client-side"}</p>
              </div>

              {Object.entries(envCheck.variables).map(([key, info]) => (
                <div key={key} className="bg-muted p-2 rounded space-y-2">
                  <p className="font-semibold">{key}:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <span>Exists:</span>
                    <span className={info.exists ? "text-green-500" : "text-red-500"}>
                      {info.exists ? "Yes" : "No"}
                    </span>

                    <span>Type:</span>
                    <span>{info.type}</span>

                    <span>Value:</span>
                    <span className={info.exists ? "text-green-500" : "text-red-500"}>{info.value}</span>
                  </div>

                  {info.issues.length > 0 && (
                    <Alert variant="destructive" className="mt-2 p-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        <ul className="list-disc pl-4">
                          {info.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={runCheck} className="w-full text-xs">
              Refresh
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
