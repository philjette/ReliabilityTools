import Link from "next/link"
import { BarChart3, FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DbDebug } from "@/components/db-debug"
import { EnvDebug } from "@/components/env-debug"
import { AuthDebug } from "@/components/auth-debug"
import { getUserFMEAs } from "@/lib/fmea-actions"

export default async function Dashboard() {
  // Get user FMEAs
  const fmeas = await getUserFMEAs()

  return (
    <main className="flex-1 py-8">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome to your reliability engineering dashboard</p>
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

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent FMEAs</CardTitle>
              <CardDescription>Your recently created FMEA reports</CardDescription>
            </CardHeader>
            <CardContent>
              {fmeas.length > 0 ? (
                <div className="grid gap-4">
                  {fmeas.slice(0, 5).map((fmea) => (
                    <div key={fmea.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-medium">{fmea.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(fmea.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/fmeas/${fmea.id}`}>View</Link>
                      </Button>
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
            {fmeas.length > 5 && (
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/fmeas">View all FMEAs</Link>
                </Button>
              </CardFooter>
            )}
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Overview of your FMEA reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total FMEAs</p>
                    <p className="text-2xl font-bold">{fmeas.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Recent Activity</p>
                    <p className="text-2xl font-bold">
                      {
                        fmeas.filter((f) => {
                          const date = new Date(f.created_at)
                          const now = new Date()
                          const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
                          return diffDays <= 7
                        }).length
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/generate">
                      <Plus className="mr-2 h-4 w-4" />
                      Generate New FMEA
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/analyze">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analyze Reliability Data
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 space-y-6">
            <h2 className="text-2xl font-bold tracking-tighter">Debug Tools</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <EnvDebug />
              <AuthDebug />
              <DbDebug />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
