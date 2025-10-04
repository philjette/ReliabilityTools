import { getUserFMEAs } from "@/lib/fmea-actions"
import { SavedFMEAsList } from "@/components/saved-fmeas-list"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { data: fmeas, error } = await getUserFMEAs()

  return (
    <div className="min-h-screen bg-white">
      <Header activePath="/dashboard" />

      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">FMEA Dashboard</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl">View, manage, and analyze your saved FMEA reports.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {error ? (
              <Card>
                <CardHeader>
                  <CardTitle>Error Loading FMEAs</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
              </Card>
            ) : fmeas && fmeas.length > 0 ? (
              <SavedFMEAsList fmeas={fmeas} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No FMEAs Yet</CardTitle>
                  <CardDescription>
                    You haven't created any FMEA reports yet. Get started by generating your first FMEA.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/generate">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate FMEA
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
