import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const error = requestUrl.searchParams.get("error")
    const errorDescription = requestUrl.searchParams.get("error_description")

    console.log("Auth callback received:", {
      hasCode: Boolean(code),
      error,
      errorDescription,
      url: request.url,
    })

    // Handle OAuth error
    if (error) {
      console.error("OAuth error:", error, errorDescription)
      return NextResponse.redirect(
        new URL(
          `/auth-error?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || "")}`,
          requestUrl.origin,
        ),
      )
    }

    // Handle missing code
    if (!code) {
      console.error("No code parameter in auth callback")
      return NextResponse.redirect(
        new URL("/auth-error?error=no_code&error_description=No%20authorization%20code%20received", requestUrl.origin),
      )
    }

    // Exchange the code for a session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError)
      return NextResponse.redirect(
        new URL(
          `/auth-error?error=exchange_error&error_description=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin,
        ),
      )
    }

    console.log("Successfully exchanged code for session:", {
      hasSession: Boolean(data.session),
      hasUser: Boolean(data.user),
    })

    // Redirect to dashboard if authenticated, otherwise to home
    const redirectPath = data.session ? "/dashboard" : "/"
    return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
  } catch (error) {
    console.error("Exception in auth callback:", error)
    return NextResponse.redirect(
      new URL("/auth-error?error=unexpected&error_description=An%20unexpected%20error%20occurred", request.url),
    )
  }
}
