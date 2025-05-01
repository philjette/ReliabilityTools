"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/contexts/AppContext"

interface FMEA {
  id: string
  name: string
  asset_type: string
  created_at: string
  data: any
}

export default function ComparisonPage() {
  const [fmeas, setFmeas] = useState<FMEA[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearSelectedFMEAs } = useAppContext()

  const ids = searchParams.getAll("ids")

  useEffect(() => {
    async function fetchFMEAs() {
      if (ids.length === 0) {
        setLoading(false)
        return
      }

      const supabase = createClientComponentClient()

      try {
        const { data, error } = await supabase.from("fmeas").select("*").in("id", ids)

        if (error) throw error

        setFmeas(data || [])
      } catch (error) {
        console.error("Error fetching FMEAs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFMEAs()
  }, [ids])

  const handleBackToDashboard = () => {
    clearSelectedFMEAs()
    router.push("/dashboard/fmeas")
  }

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>
  }

  if (ids.length < 2) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>FMEA Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please select at least 2 FMEAs to compare.</p>
            <Button onClick={handleBackToDashboard} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>FMEA Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {fmeas.length === 0 ? (
            <p>No FMEAs found with the provided IDs.</p>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fmeas.map((fmea) => (
                  <Card key={fmea.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{fmea.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>
                        <strong>Asset Type:</strong> {fmea.asset_type}
                      </p>
                      <p>
                        <strong>Created:</strong> {new Date(fmea.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Comparison Details</h3>
                {/* Comparison details would go here */}
                <p>Detailed comparison of the selected FMEAs will be displayed here.</p>
              </div>

              <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
