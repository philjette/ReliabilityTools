import { Button } from "@/components/ui/button"
import { FileText, BarChart3 } from "lucide-react"
import Link from "next/link"

export function HeroButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <Button asChild size="lg">
        <Link href="/generate">
          <FileText className="mr-2 h-5 w-5" />
          FMEA Generation
        </Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href="/analyze">
          <BarChart3 className="mr-2 h-5 w-5" />
          Weibull Analysis
        </Link>
      </Button>
    </div>
  )
}
