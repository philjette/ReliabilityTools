import { getUserFMEAs } from "@/lib/fmea-actions"
import { SavedFMEAsList } from "@/components/saved-fmeas-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { data: fmeas, error } = await getUserFMEAs()

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Your FMEAs</h1>
          <p className="text-muted-foreground">View, manage, and analyze your saved FMEA reports</p>
        </div>
        <Button asChild>
          <Link href="/generate">
            <PlusCircle className="mr-2 h-4 w-4" />
            New FMEA
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">Error loading FMEAs: {error}</div>
      ) : (
        <SavedFMEAsList fmeas={fmeas || []} />
      )}
    </div>
  )
}
