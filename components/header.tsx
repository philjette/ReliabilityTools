"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BarChart3 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserProfile } from "@/components/user-profile"
import { SignInButton } from "@/components/sign-in-button"

interface HeaderProps {
  activePath?: string
}

export function Header({ activePath = "/" }: HeaderProps) {
  const { user, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <BarChart3 className="h-6 w-6" />
          <span>ReliabilityTools.ai</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/" className={`font-medium ${activePath === "/" ? "" : "text-muted-foreground"}`}>
            Home
          </Link>
          <Link
            href={isClient && !isLoading && user ? "/generate" : "/auth/signin"}
            className={`font-medium ${activePath === "/generate" ? "" : "text-muted-foreground"}`}
          >
            Generate FMEA
          </Link>
          <Link
            href={isClient && !isLoading && user ? "/analyze" : "/auth/signin"}
            className={`font-medium ${activePath === "/analyze" ? "" : "text-muted-foreground"}`}
          >
            Analyze Data
          </Link>
          <Link href="/about" className={`font-medium ${activePath === "/about" ? "" : "text-muted-foreground"}`}>
            About
          </Link>
          {isClient && !isLoading && user && (
            <Link
              href="/dashboard"
              className={`font-medium ${activePath === "/dashboard" ? "" : "text-muted-foreground"}`}
            >
              Dashboard
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {isClient && !isLoading && (user ? <UserProfile /> : <SignInButton />)}
        </div>
      </div>
    </header>
  )
}
