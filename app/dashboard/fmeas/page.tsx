import Link from "next/link"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getUserFMEAs } from "@/lib/fmea-actions"
import { DeleteFMEAButton } from "@/components/delete-fmea-button"

export default async function FMEAsList() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to home if not authenticated
  if (!session) {
    redirect("/")
  }

  const fmeas = await getUserFMEAs()

  return (
    <div className="flex flex-col min-h-screen">
      <Header activePath="/dashboard" />
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tighter">My FMEAs</h1>
              <p className="text-muted-foreground mt-2">Manage your saved FMEA reports</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button asChild>
                <Link href="/generate">
                  <Plus className="mr-2 h-4 w-4" />
                  New FMEA
                </Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All FMEAs</CardTitle>
              <CardDescription>Your complete collection of FMEA reports</CardDescription>
            </CardHeader>
            <CardContent>
              {fmeas.length > 0 ? (
                <div className="grid gap-4">
                  {fmeas.map((fmea) => (
                    <div key={fmea.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-medium">{fmea.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">{fmea.asset_type}</span>
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">{fmea.voltage_rating}</span>
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">
                              {fmea.operating_environment}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(fmea.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/fmeas/${fmea.id}`}>View</Link>
                        </Button>
                        <DeleteFMEAButton id={fmea.id} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No FMEAs yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any FMEA reports yet. Generate your first FMEA to get started.
                  </p>
                  <Button asChild>
                    <Link href="/generate">
                      <Plus className="mr-2 h-4 w-4" />
                      Generate FMEA
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
