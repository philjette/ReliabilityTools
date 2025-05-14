"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export function HeroButtons() {
  const { user, isLoading } = useAuth()

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-8">
      {!isLoading && user ? (
        <>
          <Button size="lg" asChild>
            <Link href="/dashboard/home">Go to Dashboard</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/generate">Generate FMEA</Link>
          </Button>
        </>
      ) : (
        <>
          <Button size="lg" asChild>
            <Link href="/auth/signin">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/about">Learn More</Link>
          </Button>
        </>
      )}
    </div>
  )
}
