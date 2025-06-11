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
    console.log("Environment check:")
    console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Present" : "Missing")
    console.log("SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing")

    // Create Supabase client
    const supabase = createServerActionClient({ cookies })
    console.log("Supabase client created")

    // Try both authentication methods
    const {
      data: { user: userData },
      error: userError,
    } = await supabase.auth.getUser()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log("Auth results:")
    console.log(
      "getUser:",
      userData ? { id: userData.id, email: userData.email } : "null",
      "Error:",
      userError?.message,
    )
    console.log("getSession:", session ? { user_id: session.user.id } : "null", "Error:", sessionError?.message)

    // Use session user if available, fallback to getUser
    const user = session?.user || userData

    if (!user || !user.id) {
      console.error("No authenticated user found")
      throw new Error("No authenticated user found. Please sign in again.")
    }

    console.log("User authenticated:", { id: user.id, email: user.email })

    // Validate required fields
    if (!params.title?.trim()) {
      throw new Error("Title is required")
    }

    if (!params.failureModes || params.failureModes.length === 0) {
      throw new Error("At least one failure mode is required")
    }

    // Prepare the data for insertion
    const fmeaData = {
      user_id: user.id,
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

    console.log("Attempting to insert FMEA:")
    console.log("User ID:", user.id)
    console.log("Title:", fmeaData.title)
    console.log("Failure modes count:", fmeaData.failure_modes.length)

    // Insert the FMEA into the database
    const { data, error } = await supabase.from("fmeas").insert(fmeaData).select().single()

    console.log("Insert result:")
    console.log("Error:", error)
    console.log("Data:", data)

    if (error) {
      console.error("Database insert error:", error)
      console.error("Error code:", error.code)
      console.error("Error details:", error.details)
      console.error("Error hint:", error.hint)

      // Check if it's a foreign key constraint error
      if (error.message.includes("fk_user") || error.message.includes("foreign key")) {
        throw new Error(
          `User authentication issue: Your user account may not be properly set up. Please sign out and sign in again. Error: ${error.message}`,
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
    console.error("Error type:", typeof error)
    console.error("Error details:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack")

    if (error instanceof Error) {
      throw error
    } else {
      throw new Error("Unknown error occurred while saving FMEA")
    }
  }
}

// Simplified test function to debug authentication
export async function debugAuth() {
  try {
    console.log("=== Debug Auth ===")

    const supabase = createServerActionClient({ cookies })

    // Test 1: getUser()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log("getUser result:", { userData, userError })

    // Test 2: getSession()
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log("getSession result:", { sessionData, sessionError })

    return {
      getUser: {
        success: !userError,
        user: userData.user ? { id: userData.user.id, email: userData.user.email } : null,
        error: userError?.message,
      },
      getSession: {
        success: !sessionError,
        session: sessionData.session ? { user_id: sessionData.session.user.id } : null,
        error: sessionError?.message,
      },
    }
  } catch (error) {
    console.error("Debug auth error:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getUserFMEAs() {
  try {
    const supabase = createServerActionClient({ cookies })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("fmeas")
      .select("*")
      .eq("user_id", user.id)
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
