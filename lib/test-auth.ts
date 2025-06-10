"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function testCurrentUser() {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return { error: `Session error: ${sessionError.message}` }
    }

    if (!session) {
      return { error: "No session found" }
    }

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return { error: `User error: ${userError.message}` }
    }

    if (!user) {
      return { error: "No user found" }
    }

    // Check if this user exists in auth.users
    const { data: authUser, error: authError } = await supabase
      .from("auth.users")
      .select("id, email")
      .eq("id", user.id)
      .single()

    return {
      success: true,
      sessionUser: {
        id: user.id,
        email: user.email,
      },
      authUser: authUser,
      authError: authError?.message,
    }
  } catch (error) {
    return { error: `Unexpected error: ${error}` }
  }
}
