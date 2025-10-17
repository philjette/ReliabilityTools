"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogIn, UserPlus } from "lucide-react"

interface SignInButtonProps {
  className?: string
}

export function SignInButton({ className }: SignInButtonProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Button variant="ghost" asChild>
        <Link href="/auth/sign-in">
          <LogIn className="h-4 w-4 mr-2" />
          Sign in
        </Link>
      </Button>
      <Button asChild>
        <Link href="/auth/sign-up">
          <UserPlus className="h-4 w-4 mr-2" />
          Sign up
        </Link>
      </Button>
    </div>
  )
}
