import Link from "next/link"
import { Activity } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container px-4 py-8 md:px-6">
        <div className="flex justify-center">
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                <Activity className="h-6 w-6 text-primary" />
                <span>reliabilitytools.ai</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Professional AI-powered reliability engineering tools for critical infrastructure asset management.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Tools</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/generate" className="text-muted-foreground hover:text-foreground">
                    FMEA Generator
                  </Link>
                </li>
                <li>
                  <Link href="/analyze" className="text-muted-foreground hover:text-foreground">
                    Data Analysis
                  </Link>
                </li>
              </ul>
            </div>
            {/* Company section - commented out for now
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground">
                    About
                  </Link>
                </li>
              </ul>
            </div>
            */}
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} reliabilitytools.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
