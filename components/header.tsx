"use client"

import Link from "next/link"
import { Activity, Menu, X, User, LogOut, FileText } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Activity className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold">assetx</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 items-center">
          <Link href="/generate" className="text-gray-600 hover:text-gray-900 transition-colors">
            Generate FMEA
          </Link>
          <Link href="/analyze" className="text-gray-600 hover:text-gray-900 transition-colors">
            Weibull Analysis
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
            About
          </Link>
          <Link href="/setup" className="text-gray-600 hover:text-gray-900 transition-colors">
            Setup
          </Link>

          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <User className="h-4 w-4" />
                      {user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <FileText className="h-4 w-4" />
                        My FMEAs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/auth/sign-in">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/auth/sign-up">Sign Up</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden border-t py-4 px-4 space-y-4">
          <Link
            href="/generate"
            className="block text-gray-600 hover:text-gray-900"
            onClick={() => setIsMenuOpen(false)}
          >
            Generate FMEA
          </Link>
          <Link
            href="/analyze"
            className="block text-gray-600 hover:text-gray-900"
            onClick={() => setIsMenuOpen(false)}
          >
            Weibull Analysis
          </Link>
          <Link href="/about" className="block text-gray-600 hover:text-gray-900" onClick={() => setIsMenuOpen(false)}>
            About
          </Link>
          <Link href="/setup" className="block text-gray-600 hover:text-gray-900" onClick={() => setIsMenuOpen(false)}>
            Setup
          </Link>
          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My FMEAs
                  </Link>
                  <button onClick={handleSignOut} className="block w-full text-left text-gray-600 hover:text-gray-900">
                    Sign Out ({user.email})
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                    <Link href="/auth/sign-in" onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="w-full">
                    <Link href="/auth/sign-up" onClick={() => setIsMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </nav>
      )}
    </header>
  )
}
