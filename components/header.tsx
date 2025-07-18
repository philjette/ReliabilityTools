import Link from "next/link"
import { Activity, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface HeaderProps {
  activePath?: string
}

export function Header({ activePath = "/" }: HeaderProps) {
  // Helper function to determine if a path is active
  const isActive = (path: string) => {
    if (path === "/") return activePath === "/"
    return activePath.startsWith(path)
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Activity className="h-6 w-6 text-primary" />
          <span>assetx</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          <Link href="/" className={`font-medium ${isActive("/") ? "" : "text-muted-foreground"}`}>
            Home
          </Link>

          <Link href="/about" className={`font-medium ${isActive("/about") ? "" : "text-muted-foreground"}`}>
            About
          </Link>

          {/* Solutions Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="link" className="font-medium p-0 h-auto text-base" style={{ fontFamily: "inherit" }}>
                Solutions <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/generate" className="w-full cursor-pointer">
                  FMEA Generation
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/analyze" className="w-full cursor-pointer">
                  Weibull Analysis
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
