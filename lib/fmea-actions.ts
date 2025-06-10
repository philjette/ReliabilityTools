"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import type { FailureMode } from "@/lib/actions"
import { generateFmeaPdf } from "@/lib/pdf-export"

interface SaveFMEAParams {
  title: string
  assetType: string
  voltageRating: string
  operatingEnvironment: string
  ageRange: string
  loadProfile: string
  assetCriticality: string
  additionalNotes: string
  failureModes: FailureMode[]
  weibullParameters: Record<string, { shape: number; scale: number }>
}

export async function saveFMEA(params: SaveFMEAParams) {
  try {
    console.log("=== Starting saveFMEA ===")

    // Create Supabase client with proper configuration
    const supabase = createServerActionClient({
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })

    // First, let's verify the client is working
    console.log("Supabase client created")

    // Get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError)
      throw new Error(`Authentication failed: ${sessionError.message}`)
    }

    if (!sessionData.session) {
      console.error("No session found")
      throw new Error("No active session. Please sign in again.")
    }

    const user = sessionData.session.user
    if (!user || !user.id) {
      console.error("No user in session")
      throw new Error("Invalid user session. Please sign in again.")
    }

    console.log("User found:", { id: user.id, email: user.email })

    // Verify the user exists in auth.users table
    const { data: userCheck, error: userCheckError } = await supabase
      .from("auth.users")
      .select("id")
      .eq("id", user.id)
      .single()

    if (userCheckError) {
      console.log("User check failed, but this might be expected due to RLS")
      // This might fail due to RLS policies, but let's continue
    }

    // Validate required fields
    if (!params.title?.trim()) {
      throw new Error("Title is required")
    }

    if (!params.failureModes || params.failureModes.length === 0) {
      throw new Error("At least one failure mode is required")
    }

    // Prepare the data for insertion
    const fmeaData = {
      user_id: user.id, // This should be a valid UUID from auth.users
      title: params.title.trim(),
      asset_type: params.assetType || "",
      voltage_rating: params.voltageRating || "",
      operating_environment: params.operatingEnvironment || "",
      age_range: params.ageRange || "",
      load_profile: params.loadProfile || "",
      asset_criticality: params.assetCriticality || "",
      additional_notes: params.additionalNotes || "",
      failure_modes: params.failureModes,
      weibull_parameters: params.weibullParameters || {},
    }

    console.log("Attempting to insert FMEA with user_id:", user.id)

    // Insert the FMEA into the database
    const { data, error } = await supabase.from("fmeas").insert(fmeaData).select().single()

    if (error) {
      console.error("Database insert error:", error)

      // Check if it's a foreign key constraint error
      if (error.message.includes("fk_user") || error.message.includes("foreign key")) {
        throw new Error(
          `User authentication issue: Your user account may not be properly set up. Please sign out and sign in again.`,
        )
      }

      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      throw new Error("No data returned from insert operation")
    }

    console.log("FMEA saved successfully:", data.id)

    // Revalidate paths
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/fmeas")

    return data
  } catch (error) {
    console.error("=== Error in saveFMEA ===")
    console.error("Error details:", error)

    if (error instanceof Error) {
      throw error
    } else {
      throw new Error("Unknown error occurred while saving FMEA")
    }
  }
}

// Add a function to test authentication
export async function testAuthentication() {
  try {
    const supabase = createServerActionClient({
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return { success: false, error: sessionError.message }
    }

    if (!sessionData.session) {
      return { success: false, error: "No active session" }
    }

    const user = sessionData.session.user

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      session: {
        access_token: sessionData.session.access_token ? "Present" : "Missing",
        refresh_token: sessionData.session.refresh_token ? "Present" : "Missing",
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getUserFMEAs() {
  try {
    const supabase = createServerActionClient({ cookies })

    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      return []
    }

    const { data, error } = await supabase
      .from("fmeas")
      .select("*")
      .eq("user_id", sessionData.session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching FMEAs:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserFMEAs:", error)
    return []
  }
}

export async function getFMEAById(id: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    const { data, error } = await supabase.from("fmeas").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching FMEA:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getFMEAById:", error)
    return null
  }
}

export async function deleteFMEA(id: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    const { error } = await supabase.from("fmeas").delete().eq("id", id)

    if (error) {
      console.error("Error deleting FMEA:", error)
      throw new Error(`Failed to delete FMEA: ${error.message}`)
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/fmeas")

    return true
  } catch (error) {
    console.error("Error in deleteFMEA:", error)
    throw error
  }
}

// Add back the PDF generation functions
export async function generatePdf(params: SaveFMEAParams): Promise<Uint8Array> {
  return generateFmeaPdf(params)
}

export async function generatePdfFromSaved(id: string): Promise<Uint8Array> {
  const fmea = await getFMEAById(id)

  if (!fmea) {
    throw new Error("FMEA not found")
  }

  return generateFmeaPdf({
    title: fmea.title,
    assetType: fmea.asset_type,
    voltageRating: fmea.voltage_rating,
    operatingEnvironment: fmea.operating_environment,
    ageRange: fmea.age_range,
    loadProfile: fmea.load_profile,
    assetCriticality: fmea.asset_criticality,
    additionalNotes: fmea.additional_notes,
    failureModes: fmea.failure_modes,
    weibullParameters: fmea.weibull_parameters,
    createdAt: fmea.created_at,
  })
}
