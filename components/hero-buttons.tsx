"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export function HeroButtons() {
  const { user, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render anything during SSR to avoid hydration mismatches
  if (!isClient) {
    return (
      <div className="flex flex-col gap-2 min-[400px]:flex-row">
        <Button size="lg" className="gap-1.5">
          Generate FMEA
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button size="lg" variant="outline">
          Analyze Data
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 min-[400px]:flex-row">
      <Link href={!isLoading && user ? "/generate" : "/auth/signin"}>
        <Button size="lg" className="gap-1.5">
          Generate FMEA
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={!isLoading && user ? "/analyze" : "/auth/signin"}>
        <Button size="lg" variant="outline">
          Analyze Data
        </Button>
      </Link>
    </div>
  )
}
