import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Debug Auth Status ===")

    // Get all cookies
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    console.log(
      "All cookies:",
      allCookies.map((c) => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
    )

    // Look for Supabase auth cookies specifically
    const authCookies = allCookies.filter(
      (c) => c.name.includes("supabase") || c.name.includes("auth") || c.name.includes("sb-"),
    )

    console.log(
      "Auth-related cookies:",
      authCookies.map((c) => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
    )

    // Test environment
    console.log("Environment:")
    console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Present" : "Missing")
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing")

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Test both auth methods
    const { data: userData, error: userError } = await supabase.auth.getUser()
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    return NextResponse.json({
      cookies: {
        total: allCookies.length,
        authRelated: authCookies.length,
        authCookieNames: authCookies.map((c) => c.name),
      },
      environment: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      auth: {
        getUser: {
          success: !userError,
          user: userData.user
            ? {
                id: userData.user.id,
                email: userData.user.email,
                created_at: userData.user.created_at,
              }
            : null,
          error: userError?.message,
        },
        getSession: {
          success: !sessionError,
          session: sessionData.session
            ? {
                user_id: sessionData.session.user.id,
                expires_at: sessionData.session.expires_at,
                access_token_length: sessionData.session.access_token?.length || 0,
              }
            : null,
          error: sessionError?.message,
        },
      },
    })
  } catch (error) {
    console.error("Debug auth status error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
