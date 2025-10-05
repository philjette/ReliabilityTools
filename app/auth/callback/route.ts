import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  console.log("Auth callback received:", { code: !!code, url: requestUrl.toString() })

  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createServerComponentClient({ cookies: () => cookieStore })
      
      console.log("Exchanging code for session...")
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Error exchanging code for session:", error)
        return NextResponse.redirect(new URL("/auth/sign-in?error=auth_callback_error", requestUrl.origin))
      }
      
      console.log("Code exchanged successfully, redirecting to dashboard")
    } catch (error) {
      console.error("Error in auth callback:", error)
      return NextResponse.redirect(new URL("/auth/sign-in?error=auth_callback_error", requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
}
