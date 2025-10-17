"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Activity, ChevronDown, Menu } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserProfile } from "@/components/user-profile"
import { SignInButton } from "@/components/sign-in-button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"

interface HeaderProps {
  activePath?: string
}

export function ClientHeader({ activePath = "/" }: HeaderProps) {
  const { user, loading: isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
    console.log("ClientHeader - Auth status:", {
      isLoading,
      isAuthenticated: !!user,
      userId: user?.id,
      email: user?.email,
    })
  }, [user, isLoading])

  // Helper function to determine if a path is active
  const isActive = (path: string) => {
    if (path === "/") return activePath === "/"
    return activePath.startsWith(path)
  }

  // Handle dashboard navigation
  const handleDashboardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    if (isLoading) {
      toast({
        title: "Loading authentication...",
        description: "Please wait while we check your authentication status.",
      })
      return
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to sign in to access the dashboard.",
        variant: "destructive",
      })
      router.push("/auth/signin")
    } else {
      console.log("Navigating to dashboard with user:", user.email)
      router.push("/dashboard")
    }
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Activity className="h-6 w-6 text-primary" />
          <span>AssetX.pro</span>
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
                <Link
                  href={isClient && !isLoading && user ? "/generate" : "/auth/signin"}
                  className="w-full cursor-pointer"
                >
                  FMEA Generation
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={isClient && !isLoading && user ? "/analyze" : "/auth/signin"}
                  className="w-full cursor-pointer"
                >
                  Failure Curve Analysis
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isClient && (
            <a
              href="/dashboard"
              className={`font-medium ${isActive("/dashboard") ? "" : "text-muted-foreground"}`}
              onClick={handleDashboardClick}
            >
              Dashboard
            </a>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {isClient && !isLoading && (user ? <UserProfile /> : <SignInButton className="hidden md:flex" />)}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col gap-6 pt-10">
                <Link
                  href="/"
                  className={`font-medium text-lg ${isActive("/") ? "" : "text-muted-foreground"}`}
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>

                <Link
                  href="/about"
                  className={`font-medium text-lg ${isActive("/about") ? "" : "text-muted-foreground"}`}
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>

                <div className="space-y-3">
                  <h3 className="font-medium text-lg">Solutions</h3>
                  <div className="pl-4 space-y-3">
                    <Link
                      href={isClient && !isLoading && user ? "/generate" : "/auth/signin"}
                      className={`block font-medium ${isActive("/generate") ? "" : "text-muted-foreground"}`}
                      onClick={() => setIsOpen(false)}
                    >
                      FMEA Generation
                    </Link>
                    <Link
                      href={isClient && !isLoading && user ? "/analyze" : "/auth/signin"}
                      className={`block font-medium ${isActive("/analyze") ? "" : "text-muted-foreground"}`}
                      onClick={() => setIsOpen(false)}
                    >
                      Failure Curve Analysis
                    </Link>
                  </div>
                </div>

                {isClient && (
                  <a
                    href="/dashboard"
                    className={`font-medium text-lg ${isActive("/dashboard") ? "" : "text-muted-foreground"}`}
                    onClick={(e) => {
                      handleDashboardClick(e)
                      setIsOpen(false)
                    }}
                  >
                    Dashboard
                  </a>
                )}

                {isClient && !isLoading && !user && (
                  <div className="pt-4">
                    <SignInButton />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
