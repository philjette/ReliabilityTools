import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")

  console.log("Auth callback received:", { 
    code: !!code, 
    error,
    errorDescription,
    url: requestUrl.toString(),
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  })

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error received:", { error, errorDescription })
    return NextResponse.redirect(new URL(`/auth/sign-in?error=oauth_error&message=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin))
  }

  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createServerComponentClient({ cookies: () => cookieStore })
      
      console.log("Exchanging code for session...")
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Error exchanging code for session:", error)
        return NextResponse.redirect(new URL("/auth/sign-in?error=auth_callback_error", requestUrl.origin))
      }
      
      console.log("Code exchanged successfully:", { 
        hasSession: !!data.session, 
        userId: data.session?.user?.id,
        email: data.session?.user?.email 
      })
      
      // Redirect to dashboard with a success parameter to trigger auth state refresh
      return NextResponse.redirect(new URL("/dashboard?auth=success", requestUrl.origin))
    } catch (error) {
      console.error("Error in auth callback:", error)
      return NextResponse.redirect(new URL("/auth/sign-in?error=auth_callback_error", requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
}
