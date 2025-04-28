import Link from "next/link"
import { BarChart3 } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-center gap-4 px-4 md:px-6 md:flex-row">
        <div className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-5 w-5" />
          <span className="font-semibold">ReliabilityTools.ai</span>
        </div>
        <p className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} ReliabilityTools.ai. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:gap-6 md:ml-auto">
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            Terms
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  )
}
