"use client"

import Link from "next/link"
import { Activity, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

export function Header() {
  const { user, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  // Debug auth state in header
  console.log("Header - Auth state:", { 
    loading, 
    hasUser: !!user, 
    userId: user?.id, 
    email: user?.email 
  })


  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">assetx</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/generate"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Generate FMEA
              </Link>
              <Link href="/analyze" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Weibull Analysis
              </Link>
              <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                About
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="hidden md:flex bg-transparent">
                        {user.email}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">My FMEAs</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/curves">My Failure Curves</Link>
                  </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="hidden md:flex items-center gap-2">
                    <Button variant="ghost" asChild>
                      <Link href="/auth/sign-in">Sign in</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/auth/sign-up">Sign up</Link>
                    </Button>
                  </div>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col gap-4">
              <Link
                href="/generate"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Generate FMEA
              </Link>
              <Link
                href="/analyze"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Weibull Analysis
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              {!loading && (
                <>
                  {user ? (
                    <>
                          <Link
                            href="/dashboard"
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            My FMEAs
                          </Link>
                          <Link
                            href="/curves"
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            My Failure Curves
                          </Link>
                      <button
                        onClick={() => {
                          handleSignOut()
                          setMobileMenuOpen(false)
                        }}
                        className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors text-left"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/sign-in"
                        className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/auth/sign-up"
                        className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
