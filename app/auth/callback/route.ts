import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Error exchanging code for session:", error)
        return NextResponse.redirect(new URL("/auth/sign-in?error=auth_callback_error", requestUrl.origin))
      }
    } catch (error) {
      console.error("Error in auth callback:", error)
      return NextResponse.redirect(new URL("/auth/sign-in?error=auth_callback_error", requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
}
