import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, BarChart3 } from "lucide-react"

export function HeroButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button asChild size="lg">
        <Link href="/generate">
          <FileText className="mr-2 h-5 w-5" />
          Generate FMEA
        </Link>
      </Button>
      <Button variant="outline" size="lg" asChild>
        <Link href="/analyze">
          <BarChart3 className="mr-2 h-5 w-5" />
          Analyze Data
        </Link>
      </Button>
    </div>
  )
}
