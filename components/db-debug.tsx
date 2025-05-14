"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Database, RefreshCw } from "lucide-react"
import { checkDatabaseSchema, createFmeasTable } from "@/lib/db-checker"

export function DbDebug() {
  const [isChecking, setIsChecking] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [createResult, setCreateResult] = useState<any>(null)

  const handleCheck = async () => {
    setIsChecking(true)
    try {
      const data = await checkDatabaseSchema()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const data = await createFmeasTable()
      setCreateResult(data)
      if (data.success) {
        // Re-check the schema after creating the table
        handleCheck()
      }
    } catch (error) {
      setCreateResult({
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Schema Checker
        </CardTitle>
        <CardDescription>Check if the database schema is correctly set up for storing FMEAs</CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="space-y-4">
            <Alert variant={result.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              </div>
              <AlertDescription>
                {result.success ? "Database schema is correctly set up" : result.error || "Unknown error"}
              </AlertDescription>
            </Alert>

            {result.tables && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tables:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.tables.map((table: string) => (
                    <Badge key={table} variant={table === "fmeas" ? "default" : "outline"}>
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.columns && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Columns in 'fmeas' table:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.columns.map((column: string) => (
                    <Badge key={column} variant="outline">
                      {column}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.missingColumns && result.missingColumns.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">Missing Columns:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.missingColumns.map((column: string) => (
                    <Badge key={column} variant="destructive">
                      {column}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {createResult && (
          <Alert variant={createResult.success ? "default" : "destructive"} className="mt-4">
            <div className="flex items-center gap-2">
              {createResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{createResult.success ? "Success" : "Error"}</AlertTitle>
            </div>
            <AlertDescription>
              {createResult.success
                ? createResult.message || "Table created successfully"
                : createResult.error || "Unknown error"}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCheck} disabled={isChecking}>
          {isChecking ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>Check Schema</>
          )}
        </Button>
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>Create/Fix Table</>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
